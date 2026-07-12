import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Role, OrderStatus, PaymentMethod } from "@food/shared";
import { ADMIN_ROLES, CASHIER_ROLES, KDS_ROLES } from "@food/shared";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { authorize } from "../middleware/auth.js";
import { AppError } from "../middleware/error.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  categoryWriteSchema,
  menuItemWriteSchema,
} from "../validators/menu.js";
import { statusUpdateSchema } from "../validators/order.js";
import {
  getOrder,
  listOrders,
  ordersToCsv,
  updateOrderStatus,
} from "../services/orderService.js";
import { getAnalyticsSummary } from "../services/analyticsService.js";
import { broadcastOrderStatus } from "../config/socket.js";
import { logActivity } from "../services/auditService.js";
import { refundPayment } from "../services/paymentService.js";

export const adminRouter = Router();

const roleSchema = z.enum(["admin", "staff", "kitchen", "cashier", "manager"]);
const promoSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(32)
    .transform((value) => value.toUpperCase()),
  discountType: z.enum(["flat", "percentage"]),
  discountValue: z.coerce.number().positive(),
  minOrder: z.coerce.number().min(0).default(0),
  maxUses: z.coerce.number().int().min(0).default(0),
  validFrom: z.coerce.date(),
  validTo: z.coerce.date(),
});
const staffSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: roleSchema,
});

const toPrismaRole = (role: Role) =>
  role.toUpperCase() as "ADMIN" | "STAFF" | "KITCHEN" | "CASHIER" | "MANAGER";
const toRole = (role: string) => role.toLowerCase() as Role;

adminRouter.get(
  "/analytics/summary",
  authorize(...ADMIN_ROLES),
  asyncHandler(async (req, res) => {
    res.json({ summary: await getAnalyticsSummary(req.user!.restaurantId!) });
  }),
);

adminRouter.get(
  "/menu/categories",
  authorize(...ADMIN_ROLES),
  asyncHandler(async (req, res) => {
    const categories = await prisma.category.findMany({
      where: { restaurantId: req.user!.restaurantId! },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    });
    res.json({ categories });
  }),
);

adminRouter.post(
  "/menu/categories",
  authorize(...ADMIN_ROLES),
  asyncHandler(async (req, res) => {
    const input = categoryWriteSchema.parse(req.body);
    const category = await prisma.category.create({
      data: { ...input, restaurantId: req.user!.restaurantId! },
    });
    await logActivity(req.user, "menu.category_create", {
      categoryId: category.id,
    });
    res.status(201).json({ category });
  }),
);

adminRouter.get(
  "/menu/items",
  authorize(...ADMIN_ROLES),
  asyncHandler(async (req, res) => {
    const items = await prisma.menuItem.findMany({
      where: { restaurantId: req.user!.restaurantId! },
      include: { category: true, variants: true, addons: true },
      orderBy: [{ category: { displayOrder: "asc" } }, { name: "asc" }],
    });
    res.json({
      items: items.map((item) => ({
        ...item,
        price: Number(item.price),
        variants: item.variants.map((variant) => ({
          ...variant,
          priceDelta: Number(variant.priceDelta),
        })),
        addons: item.addons.map((addon) => ({
          ...addon,
          price: Number(addon.price),
        })),
      })),
    });
  }),
);

adminRouter.post(
  "/menu/items",
  authorize(...ADMIN_ROLES),
  asyncHandler(async (req, res) => {
    const input = menuItemWriteSchema.parse(req.body);
    const item = await prisma.menuItem.create({
      data: {
        restaurantId: req.user!.restaurantId!,
        categoryId: input.categoryId,
        name: input.name,
        description: input.description,
        price: input.price,
        imageUrl: input.imageUrl,
        isVeg: input.isVeg,
        isVegan: input.isVegan,
        isAvailable: input.isAvailable,
        allergens: input.allergens ? input.allergens.join(",") : "",
        variants: { create: input.variants },
        addons: { create: input.addons },
      },
    });
    await logActivity(req.user, "menu.item_create", { itemId: item.id });
    res.status(201).json({ item });
  }),
);

adminRouter.put(
  "/menu/items/:id",
  authorize(...ADMIN_ROLES),
  asyncHandler(async (req, res) => {
    const input = menuItemWriteSchema.partial().parse(req.body);
    const itemId = Number(req.params.id);
    const item = await prisma.$transaction(async (tx) => {
      if (input.variants)
        await tx.itemVariant.deleteMany({ where: { itemId } });
      if (input.addons) await tx.itemAddon.deleteMany({ where: { itemId } });
      return tx.menuItem.update({
        where: { id: itemId },
        data: {
          restaurantId: req.user!.restaurantId!,
          categoryId: input.categoryId,
          name: input.name,
          description: input.description,
          price: input.price,
          imageUrl: input.imageUrl,
          isVeg: input.isVeg,
          isVegan: input.isVegan,
          isAvailable: input.isAvailable,
          allergens: input.allergens ? input.allergens.join(",") : undefined,
          variants: input.variants ? { create: input.variants } : undefined,
          addons: input.addons ? { create: input.addons } : undefined,
        },
      });
    });
    await logActivity(req.user, "menu.item_update", { itemId });
    res.json({ item });
  }),
);

adminRouter.delete(
  "/menu/items/:id",
  authorize(...ADMIN_ROLES),
  asyncHandler(async (req, res) => {
    const itemId = Number(req.params.id);
    await prisma.menuItem.delete({ where: { id: itemId } });
    await logActivity(req.user, "menu.item_delete", { itemId });
    res.status(204).send();
  }),
);

adminRouter.get(
  "/orders",
  authorize(...ADMIN_ROLES, ...KDS_ROLES, ...CASHIER_ROLES),
  asyncHandler(async (req, res) => {
    const dateFrom = req.query.dateFrom
      ? new Date(String(req.query.dateFrom))
      : undefined;
    const dateTo = req.query.dateTo
      ? new Date(String(req.query.dateTo))
      : undefined;
    const status = req.query.status
      ? (String(req.query.status) as OrderStatus)
      : undefined;
    const paymentMethod = req.query.paymentMethod
      ? (String(req.query.paymentMethod) as PaymentMethod)
      : undefined;
    const activeOnly = req.query.active === "true";
    const orders = await listOrders({
      restaurantId: req.user!.restaurantId!,
      status,
      paymentMethod,
      activeOnly,
      dateFrom,
      dateTo,
    });
    res.json({ orders });
  }),
);

adminRouter.get(
  "/orders/export.csv",
  authorize(...ADMIN_ROLES),
  asyncHandler(async (req, res) => {
    const dateFrom = req.query.dateFrom
      ? new Date(String(req.query.dateFrom))
      : undefined;
    const dateTo = req.query.dateTo
      ? new Date(String(req.query.dateTo))
      : undefined;
    const orders = await listOrders({
      restaurantId: req.user!.restaurantId!,
      dateFrom,
      dateTo,
    });
    res.header("Content-Type", "text/csv");
    res.attachment("orders.csv");
    res.send(ordersToCsv(orders));
  }),
);

adminRouter.get(
  "/orders/:id",
  authorize(...ADMIN_ROLES, ...KDS_ROLES, ...CASHIER_ROLES),
  asyncHandler(async (req, res) => {
    res.json({
      order: await getOrder(Number(req.params.id), req.user!.restaurantId!),
    });
  }),
);

adminRouter.put(
  "/orders/:id/status",
  authorize(...ADMIN_ROLES, ...KDS_ROLES, ...CASHIER_ROLES),
  asyncHandler(async (req, res) => {
    const input = statusUpdateSchema.parse(req.body);
    const order = await updateOrderStatus(
      Number(req.params.id),
      req.user!.restaurantId!,
      input.status,
      req.user,
      input.override,
    );
    broadcastOrderStatus(order);
    res.json({ order });
  }),
);

adminRouter.post(
  "/payments/refund/:id",
  authorize(...ADMIN_ROLES),
  asyncHandler(async (req, res) => {
    const amount = req.body?.amount ? Number(req.body.amount) : undefined;
    const refund = await refundPayment(String(req.params.id), amount);
    await logActivity(req.user, "payment.refund", {
      paymentId: req.params.id,
      amount,
    });
    res.json({ refund });
  }),
);

adminRouter.get(
  "/promos",
  authorize(...ADMIN_ROLES),
  asyncHandler(async (req, res) => {
    const promos = await prisma.promoCode.findMany({
      where: { restaurantId: req.user!.restaurantId! },
      orderBy: { validTo: "desc" },
    });
    res.json({
      promos: promos.map((promo) => ({
        ...promo,
        discountType: promo.discountType.toLowerCase(),
        discountValue: Number(promo.discountValue),
        minOrder: Number(promo.minOrder),
      })),
    });
  }),
);

adminRouter.post(
  "/promos",
  authorize(...ADMIN_ROLES),
  asyncHandler(async (req, res) => {
    const input = promoSchema.parse(req.body);
    if (input.validTo <= input.validFrom)
      throw new AppError(400, "validTo must be after validFrom");
    const promo = await prisma.promoCode.create({
      data: {
        restaurantId: req.user!.restaurantId!,
        code: input.code,
        discountType: input.discountType.toUpperCase() as "FLAT" | "PERCENTAGE",
        discountValue: input.discountValue,
        minOrder: input.minOrder,
        maxUses: input.maxUses,
        validFrom: input.validFrom,
        validTo: input.validTo,
      },
    });
    await logActivity(req.user, "promo.create", { promoId: promo.id });
    res.status(201).json({ promo });
  }),
);

adminRouter.get(
  "/staff",
  authorize(...ADMIN_ROLES),
  asyncHandler(async (_req, res) => {
    const staff = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json({
      staff: staff.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: toRole(user.role),
        createdAt: user.createdAt,
      })),
    });
  }),
);

adminRouter.post(
  "/staff",
  authorize(...ADMIN_ROLES),
  asyncHandler(async (req, res) => {
    const input = staffSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: toPrismaRole(input.role),
      },
    });
    await logActivity(req.user, "staff.create", {
      userId: user.id,
      role: input.role,
    });
    res.status(201).json({
      staff: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: toRole(user.role),
        createdAt: user.createdAt,
      },
    });
  }),
);

adminRouter.get(
  "/activity",
  authorize(...ADMIN_ROLES),
  asyncHandler(async (_req, res) => {
    const activity = await prisma.staffActivityLog.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json({
      activity: activity.map((entry) => ({
        id: entry.id,
        action: entry.action,
        meta: entry.meta,
        createdAt: entry.createdAt,
        user: {
          id: entry.user.id,
          name: entry.user.name,
          email: entry.user.email,
          role: toRole(entry.user.role),
        },
      })),
    });
  }),
);

adminRouter.get(
  "/settings",
  authorize(...ADMIN_ROLES),
  asyncHandler(async (_req, res) => {
    res.json({
      settings: {
        restaurantName: env.RESTAURANT_NAME,
        gstNumber: env.RESTAURANT_GST_NUMBER,
        dailyRevenueGoal: env.DAILY_REVENUE_GOAL,
        kioskIdleTimeoutSeconds: env.KIOSK_IDLE_TIMEOUT_SECONDS,
        cashPaymentEnabled: env.CASH_PAYMENT_ENABLED,
        printer: {
          enabled: env.PRINTER_ENABLED,
          interface: env.PRINTER_INTERFACE,
        },
        taxRates: {
          food: 5,
          beverage: 18,
        },
      },
    });
  }),
);
