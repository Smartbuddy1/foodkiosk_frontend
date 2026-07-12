import http from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { connectRedis, disconnectRedis } from "./config/redis.js";
import { initSocket } from "./config/socket.js";
import { logger } from "./utils/logger.js";
import { authRouter } from "./routes/auth.js";
import { superAdminRouter } from "./routes/superAdmin.js";
import { adminRouter } from "./routes/admin.js";

const app = createApp();
const server = http.createServer(app);
initSocket(server);

app.use("/auth", authRouter);
app.use("/super-admin", superAdminRouter);
app.use("/admin", adminRouter);

async function bootstrap() {
  await prisma.$connect();
  await connectRedis();

  server.listen(env.PORT, () => {
    logger.info(`API listening on port ${env.PORT}`);
  });
}

async function shutdown(signal: string) {
  logger.info(`Received ${signal}; shutting down gracefully`);
  server.close(async () => {
    await prisma.$disconnect();
    await disconnectRedis();
    logger.info("Shutdown complete");
    process.exit(0);
  });

  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

bootstrap().catch((error) => {
  logger.error("Failed to bootstrap API", error);
  process.exit(1);
});
