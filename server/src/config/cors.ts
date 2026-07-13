import { env, isProduction } from "./env.js";

const configuredOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set([
  ...configuredOrigins,
  env.CLIENT_URL,
  "https://foodkiosk1.vercel.app"
]);

const localDevOriginPattern =
  /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/;

export function isAllowedCorsOrigin(origin?: string) {
  if (!origin) return true;
  if (allowedOrigins.has(origin)) return true;
  return !isProduction && localDevOriginPattern.test(origin);
}

export function corsOrigin(
  origin: string | undefined,
  callback: (error: Error | null, allow?: boolean) => void,
) {
  callback(null, isAllowedCorsOrigin(origin));
}
