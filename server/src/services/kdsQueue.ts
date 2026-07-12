import type { OrderDto } from "@food/shared";
import { redis } from "../config/redis.js";

const ACTIVE_QUEUE_KEY = "kds:active_orders";

export async function cacheActiveOrder(order: OrderDto) {
  if (!redis) return;
  if (["collected", "cancelled"].includes(order.status)) {
    await redis.zrem(ACTIVE_QUEUE_KEY, String(order.id));
    return;
  }
  await redis.zadd(ACTIVE_QUEUE_KEY, Date.now(), String(order.id));
  await redis.set(`kds:order:${order.id}`, JSON.stringify(order), "EX", 60 * 60 * 12);
}

export async function removeActiveOrder(orderId: number) {
  if (!redis) return;
  await redis.zrem(ACTIVE_QUEUE_KEY, String(orderId));
  await redis.del(`kds:order:${orderId}`);
}
