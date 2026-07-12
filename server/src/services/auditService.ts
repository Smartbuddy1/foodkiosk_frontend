import { prisma } from "../config/prisma.js";
import { logger } from "../utils/logger.js";

export async function logActivity(user: Express.User | undefined, action: string, meta: unknown = {}) {
  if (!user) return;
  try {
    await prisma.staffActivityLog.create({
      data: {
        userId: user.id,
        action,
        meta: meta as object
      }
    });
  } catch (error) {
    logger.warn("Failed to write staff activity log", {
      action,
      userId: user.id,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
