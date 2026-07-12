import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

// Load .env from the monorepo root regardless of cwd
dotenv.config({ path: path.resolve(import.meta.dirname, "../../../.env") });
dotenv.config(); // fallback: also load from cwd if present

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().default(4000),
  CLIENT_URL: z.string().url().default("http://localhost:5173"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(24, "JWT_SECRET must be at least 24 characters"),
  JWT_EXPIRES_IN: z.string().default("8h"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().default(120),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  PRINTER_ENABLED: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  PRINTER_INTERFACE: z.string().default("usb"),
  PRINTER_VENDOR_ID: z.string().optional(),
  PRINTER_PRODUCT_ID: z.string().optional(),
  PRINTER_HOST: z.string().optional(),
  PRINTER_PORT: z.coerce.number().default(9100),
  RESTAURANT_NAME: z.string().default("Golden Burger Works"),
  RESTAURANT_GST_NUMBER: z.string().default(""),
  DAILY_REVENUE_GOAL: z.coerce.number().positive().default(1000),
  KIOSK_IDLE_TIMEOUT_SECONDS: z.coerce.number().default(60),
  CASH_PAYMENT_ENABLED: z
    .string()
    .optional()
    .transform((value) => value !== "false"),
});

export const env = envSchema.parse(process.env);

export const isProduction = env.NODE_ENV === "production";
