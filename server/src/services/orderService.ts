import { Prisma } from "@prisma/client";
import type { z } from "zod";
import {
  DEFAULT_PACKAGING_CHARGE,
  STATUS_TRANSITIONS,
  getStationForCategory,
  getTaxRateForCategory,
  type OrderDto,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus
} from "@food/shared";
import { prisma } from "../config/prisma.js";
import { AppError } from "../middleware/error.js";
import type { placeOrderSchema } from "../validators/order.js";
import { cacheActiveOrder, removeActiveOrder } from "./kdsQueue.js";
import { logActivity } from "./auditService.js";

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

type CreateOrderOptions = {
  paymentStatus?: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
};

type OrderWithItems = Prisma.OrderGetPayload<{
  include: {
    items: {
      include: {
        menuItem: {
          include: {
            category: true;
          };
        };
      };
    };
  };
}>;

const money = (value: number) => new Prisma.Decimal(value.toFixed(2));
const decimalNumber = (value: Prisma.Decimal | number | null | undefined) => Number(value ?? 0);

function toPrismaOrderType(type: string) {
  return type === "dine_in" ? "DINE_IN" : "TAKEAWAY";
}

function toPrismaPaymentMethod(method: string) {
  if (method === "upi") return "UPI";
  if (method === "cash") return "CASH";
  return "CARD";
}

function toPrismaPaymentStatus(status: PaymentStatus) {
  return status.toUpperCase() as "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "PENDING_CASH";
}

function toPrismaStatus(status: OrderStatus) {
  return status.toUpperCase() as "NEW" | "PREPARING" | "READY" | "COLLECTED" | "CANCELLED";
}

const lower = <T extends string>(value: string) => value.toLowerCase() as T;

export function serializeOrder(order: OrderWithItems): OrderDto {
  return {
    id: order.id,
    restaurantId: order.restaurantId,
    tokenNumber: order.tokenNumber,
    orderType: lower(order.orderType),
    status: lower(order.status),
    subtotal: decimalNumber(order.subtotal),
    tax: decimalNumber(order.tax),
    packagingCharge: decimalNumber(order.packagingCharge),
    discount: decimalNumber(order.discount),
    total: decimalNumber(order.total),
    paymentMethod: lower(order.paymentMethod),
    paymentStatus: lower(order.paymentStatus),
    notes: order.notes,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: order.items.map((item) => {
      const category = item.menuItem.category.name;
      const customisations =
        typeof item.customisations === "object" && item.customisations !== null
          ? (item.customisations as OrderDto["items"][number]["customisations"])
          : {};
      return {
        id: item.id,
        menuItemId: item.menuItemId,
        name: item.menuItem.name,
        category,
        station: getStationForCategory(category),
        variant: item.variant,
        quantity: item.quantity,
        unitPrice: decimalNumber(item.unitPrice),
        customisations
      };
    })
  };
}

async function buildOrderPricing(input: PlaceOrderInput) {
  const ids = [...new Set(input.items.map((item) => item.menuItemId))];
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: ids } },
    include: { category: true, variants: true, addons: true }
  });
  const menuMap = new Map(menuItems.map((item) => [item.id, item]));

  let subtotal = 0;
  let tax = 0;
  const orderItems: Prisma.OrderItemCreateWithoutOrderInput[] = [];

  for (const line of input.items) {
    const menuItem = menuMap.get(line.menuItemId);
    if (!menuItem) throw new AppError(404, `Menu item ${line.menuItemId} not found`);
    if (!menuItem.isAvailable) throw new AppError(409, `${menuItem.name} is out of stock`);

    const variant = line.variantId
      ? menuItem.variants.find((candidate) => candidate.id === line.variantId)
      : menuItem.variants.find((candidate) => candidate.label.toLowerCase() === "regular");
    if (line.variantId && !variant) {
      throw new AppError(400, `Variant ${line.variantId} does not belong to ${menuItem.name}`);
    }

    const addonIds = new Set(line.addonIds);
    const addons = menuItem.addons.filter((addon) => addonIds.has(addon.id));
    if (addons.length !== addonIds.size) {
      throw new AppError(400, `One or more add-ons do not belong to ${menuItem.name}`);
    }

    const unitPrice =
      decimalNumber(menuItem.price) +
      decimalNumber(variant?.priceDelta) +
      addons.reduce((sum, addon) => sum + decimalNumber(addon.price), 0);
    const lineSubtotal = unitPrice * line.quantity;
    subtotal += lineSubtotal;
    tax += lineSubtotal * getTaxRateForCategory(menuItem.category.name);

    orderItems.push({
      menuItem: { connect: { id: menuItem.id } },
      variant: variant?.label,
      quantity: line.quantity,
      unitPrice: money(unitPrice),
      customisations: {
        addons: addons.map((addon) => addon.label),
        removeIngredients: line.removeIngredients,
        spiceLevel: line.spiceLevel,
        specialInstructions: line.specialInstructions
      }
    });
  }

  return { subtotal, tax, orderItems };
}

async function calculateDiscount(tx: Prisma.TransactionClient, code: string | undefined, subtotal: number, restaurantId: string) {
  if (!code) return { discount: 0, promoId: null as number | null };

  const promo = await tx.promoCode.findUnique({ where: { restaurantId_code: { restaurantId, code } } });
  const now = new Date();
  if (!promo) throw new AppError(404, "Promo code not found");
  if (promo.validFrom > now || promo.validTo < now) throw new AppError(400, "Promo code is expired");
  if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) {
    throw new AppError(400, "Promo code usage limit reached");
  }
  if (subtotal < decimalNumber(promo.minOrder)) {
    throw new AppError(400, `Minimum order value is ₹${decimalNumber(promo.minOrder).toFixed(2)}`);
  }

  const rawDiscount =
    promo.discountType === "FLAT"
      ? decimalNumber(promo.discountValue)
      : subtotal * (decimalNumber(promo.discountValue) / 100);
  return { discount: Math.min(rawDiscount, subtotal), promoId: promo.id };
}

export async function createOrder(
  restaurantId: string,
  input: PlaceOrderInput,
  options: CreateOrderOptions = {}
) {
  const pricing = await buildOrderPricing(input);
  const packagingCharge = input.orderType === "takeaway" ? DEFAULT_PACKAGING_CHARGE : 0;
  const paymentStatus =
    options.paymentStatus ?? (input.paymentMethod === "cash" ? "pending_cash" : "paid");

  const order = await prisma.$transaction(async (tx) => {
    const { discount, promoId } = await calculateDiscount(tx, input.promoCode, pricing.subtotal, restaurantId);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const ordersToday = await tx.order.count({
      where: { restaurantId, createdAt: { gte: startOfDay } }
    });
    const total = Math.max(pricing.subtotal + pricing.tax + packagingCharge - discount, 0);

    const created = await tx.order.create({
      data: {
        restaurantId,
        tokenNumber: ordersToday + 1,
        orderType: toPrismaOrderType(input.orderType),
        status: "NEW",
        subtotal: money(pricing.subtotal),
        tax: money(pricing.tax),
        packagingCharge: money(packagingCharge),
        discount: money(discount),
        total: money(total),
        paymentMethod: toPrismaPaymentMethod(input.paymentMethod),
        paymentStatus: toPrismaPaymentStatus(paymentStatus),
        notes: input.notes,
        razorpayOrderId: options.razorpayOrderId,
        razorpayPaymentId: options.razorpayPaymentId,
        items: { create: pricing.orderItems }
      },
      include: {
        items: {
          include: {
            menuItem: { include: { category: true } }
          }
        }
      }
    });

    if (promoId) {
      await tx.promoCode.update({
        where: { id: promoId },
        data: { usedCount: { increment: 1 } }
      });
    }

    return created;
  });

  const dto = serializeOrder(order);
  await cacheActiveOrder(dto);
  return dto;
}

export async function getOrder(orderId: number, restaurantId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId, restaurantId },
    include: {
      items: {
        include: {
          menuItem: { include: { category: true } }
        }
      }
    }
  });
  if (!order) throw new AppError(404, "Order not found");
  return serializeOrder(order);
}

export async function listOrders(options: {
  restaurantId: string;
  status?: OrderStatus;
  paymentMethod?: PaymentMethod;
  activeOnly?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}) {
  const orders = await prisma.order.findMany({
    where: {
      restaurantId: options.restaurantId,
      status: options.activeOnly
        ? { in: ["NEW", "PREPARING", "READY"] }
        : options.status
          ? toPrismaStatus(options.status)
          : undefined,
      paymentMethod: options.paymentMethod ? toPrismaPaymentMethod(options.paymentMethod) : undefined,
      createdAt:
        options.dateFrom || options.dateTo
          ? {
              gte: options.dateFrom,
              lte: options.dateTo
            }
          : undefined
    },
    include: {
      items: {
        include: {
          menuItem: { include: { category: true } }
        }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 250
  });
  return orders.map(serializeOrder);
}

export async function updateOrderStatus(
  orderId: number,
  restaurantId: string,
  nextStatus: OrderStatus,
  user: Express.User | undefined,
  override = false
) {
  const current = await getOrder(orderId, restaurantId);
  const allowed = STATUS_TRANSITIONS[current.status].includes(nextStatus);
  const canOverride = override && user?.role === "admin";
  if (!allowed && !canOverride) {
    throw new AppError(409, `Cannot move order from ${current.status} to ${nextStatus}`);
  }

  const updated = await prisma.order.update({
    where: { id: orderId, restaurantId },
    data: { status: toPrismaStatus(nextStatus) },
    include: {
      items: {
        include: {
          menuItem: { include: { category: true } }
        }
      }
    }
  });
  const dto = serializeOrder(updated);

  if (["collected", "cancelled"].includes(dto.status)) {
    await removeActiveOrder(dto.id);
  } else {
    await cacheActiveOrder(dto);
  }

  await logActivity(user, "order.status_update", {
    orderId,
    from: current.status,
    to: nextStatus,
    override: canOverride
  });
  return dto;
}

export async function getReadyTokens() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const orders = await prisma.order.findMany({
    where: {
      status: "READY",
      createdAt: { gte: startOfDay }
    },
    orderBy: { updatedAt: "desc" },
    take: 12,
    include: {
      items: {
        include: {
          menuItem: { include: { category: true } }
        }
      }
    }
  });
  return orders.map(serializeOrder);
}

export function ordersToCsv(orders: OrderDto[]) {
  const header = [
    "id",
    "token_number",
    "status",
    "order_type",
    "payment_method",
    "payment_status",
    "subtotal",
    "tax",
    "discount",
    "total",
    "created_at"
  ];
  const rows = orders.map((order) =>
    [
      order.id,
      order.tokenNumber,
      order.status,
      order.orderType,
      order.paymentMethod,
      order.paymentStatus,
      order.subtotal,
      order.tax,
      order.discount,
      order.total,
      order.createdAt
    ]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(",")
  );
  return [header.join(","), ...rows].join("\n");
}
