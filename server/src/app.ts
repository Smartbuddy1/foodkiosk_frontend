import express from "express";
import cors from "cors";
import helmet from "helmet";
import { corsOrigin } from "./config/cors.js";
import { authRateLimiter } from "./middleware/rateLimit.js";
import { authenticate } from "./middleware/auth.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { authRouter } from "./routes/auth.js";
import { menuRouter } from "./routes/menu.js";
import { ordersRouter } from "./routes/orders.js";
import { paymentsRouter } from "./routes/payments.js";
import { adminRouter } from "./routes/admin.js";
import { kdsRouter } from "./routes/kds.js";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(
    cors({
      origin: corsOrigin,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      service: "food-kiosk-api",
      time: new Date().toISOString(),
    });
  });

  app.use("/api/auth", authRateLimiter, authRouter);
  app.use("/api/menu", menuRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/payments", paymentsRouter);
  app.use("/api/kds", kdsRouter);
  app.use("/api/admin", authenticate, adminRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
