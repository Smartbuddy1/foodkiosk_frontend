import { formatRupees, getTaxRateForCategory, DEFAULT_PACKAGING_CHARGE } from "@food/shared";
import type { MenuItemDto, OrderStatus, OrderType } from "@food/shared";

export { formatRupees };

export function elapsedMinutes(createdAt: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000));
}

export function urgencyClass(createdAt: string) {
  const minutes = elapsedMinutes(createdAt);
  if (minutes > 10) return "border-red-500 bg-red-50";
  if (minutes >= 5) return "border-amber-500 bg-amber-50";
  return "border-green-500 bg-green-50";
}

export function statusTone(status: OrderStatus) {
  if (status === "ready") return "bg-green-700 text-white";
  if (status === "preparing") return "bg-amber-500 text-ink";
  if (status === "cancelled") return "bg-red-700 text-white";
  if (status === "collected") return "bg-slate-700 text-white";
  return "bg-bun text-ink";
}

export function estimateTotals(
  lines: Array<{ item: MenuItemDto; quantity: number; unitPrice: number }>,
  orderType: OrderType,
  promoCode?: string
) {
  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const tax = lines.reduce((sum, line) => {
    const category = line.item.category?.name ?? "";
    return sum + line.unitPrice * line.quantity * getTaxRateForCategory(category);
  }, 0);
  const packagingCharge = orderType === "takeaway" ? DEFAULT_PACKAGING_CHARGE : 0;
  const discount =
    promoCode?.toUpperCase() === "WELCOME10" && subtotal >= 199 ? Math.min(subtotal * 0.1, subtotal) : 0;
  return {
    subtotal,
    tax,
    packagingCharge,
    discount,
    total: Math.max(subtotal + tax + packagingCharge - discount, 0)
  };
}
