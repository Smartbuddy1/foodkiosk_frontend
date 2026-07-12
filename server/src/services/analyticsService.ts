import { type AnalyticsSummaryDto, type OrderStatus, type PaymentMethod } from "@food/shared";
import { listOrders } from "./orderService.js";

const statusList: OrderStatus[] = ["new", "preparing", "ready", "collected", "cancelled"];

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function getAnalyticsSummary(restaurantId: string): Promise<AnalyticsSummaryDto> {
  const now = new Date();
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const thirtyDaysAgo = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30);

  const todaysOrders = await listOrders({ restaurantId, dateFrom: startToday });
  const recentOrders = await listOrders({ restaurantId, dateFrom: thirtyDaysAgo });
  const activeOrders = await listOrders({ restaurantId, activeOnly: true });

  const revenue = todaysOrders.reduce((sum, order) => sum + order.total, 0);
  const liveByStatus = statusList.reduce(
    (acc, status) => ({ ...acc, [status]: activeOrders.filter((order) => order.status === status).length }),
    {} as Record<OrderStatus, number>
  );

  const hourlyVolume = Array.from({ length: 24 }, (_, hour) => {
    const matching = todaysOrders.filter((order) => new Date(order.createdAt).getHours() === hour);
    return {
      hour: `${String(hour).padStart(2, "0")}:00`,
      orders: matching.length,
      revenue: matching.reduce((sum, order) => sum + order.total, 0)
    };
  });

  const itemMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  const categoryMap = new Map<string, number>();
  const paymentMap = new Map<PaymentMethod, { method: PaymentMethod; count: number; revenue: number }>();
  const trendMap = new Map<string, { date: string; revenue: number; orders: number }>();

  for (const order of recentOrders) {
    const trendKey = dateKey(new Date(order.createdAt));
    const trend = trendMap.get(trendKey) ?? { date: trendKey, revenue: 0, orders: 0 };
    trend.revenue += order.total;
    trend.orders += 1;
    trendMap.set(trendKey, trend);

    const payment = paymentMap.get(order.paymentMethod) ?? {
      method: order.paymentMethod,
      count: 0,
      revenue: 0
    };
    payment.count += 1;
    payment.revenue += order.total;
    paymentMap.set(order.paymentMethod, payment);

    for (const item of order.items) {
      const existing = itemMap.get(item.name) ?? { name: item.name, quantity: 0, revenue: 0 };
      existing.quantity += item.quantity;
      existing.revenue += item.quantity * item.unitPrice;
      itemMap.set(item.name, existing);

      categoryMap.set(item.category, (categoryMap.get(item.category) ?? 0) + item.quantity * item.unitPrice);
    }
  }

  return {
    totalOrders: todaysOrders.length,
    revenue,
    averageOrderValue: todaysOrders.length ? revenue / todaysOrders.length : 0,
    liveByStatus,
    hourlyVolume,
    topItems: [...itemMap.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5),
    paymentBreakdown: [...paymentMap.values()],
    categoryRevenue: [...categoryMap.entries()].map(([category, categoryRevenue]) => ({
      category,
      revenue: categoryRevenue
    })),
    revenueTrend: [...trendMap.values()].sort((a, b) => a.date.localeCompare(b.date))
  };
}
