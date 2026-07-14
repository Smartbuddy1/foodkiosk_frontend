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
const privateNetworkDevOriginPattern =
  /^https?:\/\/(?:(?:10|127)\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})(?::\d+)?$/;

export function isAllowedCorsOrigin(origin?: string) {
  if (!origin) return true;
  if (allowedOrigins.has(origin)) return true;
  return (
    !isProduction &&
    (localDevOriginPattern.test(origin) ||
      privateNetworkDevOriginPattern.test(origin))
  );
}

export function corsOrigin(
  origin: string | undefined,
  callback: (error: Error | null, allow?: boolean) => void,
) {
  callback(null, isAllowedCorsOrigin(origin));
}
