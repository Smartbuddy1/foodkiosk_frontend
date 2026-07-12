import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger.js";

export const prisma = new PrismaClient({
  log: [
    { level: "error", emit: "event" },
    { level: "warn", emit: "event" }
  ]
});

prisma.$on("error", (event) => logger.error("Prisma error", event));
prisma.$on("warn", (event) => logger.warn("Prisma warning", event));
