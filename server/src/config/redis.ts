import { Redis } from "ioredis";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

export const redis = env.REDIS_URL
  ? new Redis(env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableReadyCheck: true
    })
  : null;

if (redis) {
  redis.on("error", (error: Error) => {
    logger.warn("Redis unavailable; continuing without Redis-backed queue/session features", {
      error: error.message
    });
  });
}

export async function connectRedis() {
  if (!redis) return;
  try {
    await redis.connect();
    logger.info("Redis connected");
  } catch (error) {
    logger.warn("Redis connection skipped", {
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

export async function disconnectRedis() {
  if (!redis) return;
  redis.disconnect();
}
