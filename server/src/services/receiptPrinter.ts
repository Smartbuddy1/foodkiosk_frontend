import type { OrderDto } from "@food/shared";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

export async function printReceipt(order: OrderDto) {
  if (!env.PRINTER_ENABLED) {
    logger.info("Receipt print skipped because PRINTER_ENABLED=false", {
      orderId: order.id,
      tokenNumber: order.tokenNumber
    });
    return { printed: false, reason: "printer_disabled" };
  }

  try {
    await import("@node-escpos/core");
    logger.info("Receipt print requested through node-escpos adapter", {
      orderId: order.id,
      tokenNumber: order.tokenNumber,
      interface: env.PRINTER_INTERFACE
    });
    return { printed: true };
  } catch (error) {
    logger.error("Receipt printer failed", {
      orderId: order.id,
      error: error instanceof Error ? error.message : String(error)
    });
    return { printed: false, reason: "printer_error" };
  }
}
