import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { Role } from "@food/shared";
import { env } from "../config/env.js";
import { redis } from "../config/redis.js";
import { AppError } from "./error.js";

type JwtPayload = {
  sub: string;
  email: string;
  role: Role;
  name: string;
  restaurantId: string | null;
};

export function signAccessToken(user: Express.User) {
  return jwt.sign(
    {
      email: user.email,
      role: user.role,
      name: user.name,
      restaurantId: user.restaurantId || null
    },
    env.JWT_SECRET,
    {
      subject: String(user.id),
      expiresIn: env.JWT_EXPIRES_IN as any
    }
  );
}

export function verifyAccessToken(token: string): Express.User {
  const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  return {
    id: Number(decoded.sub),
    email: decoded.email,
    role: decoded.role,
    name: decoded.name,
    restaurantId: decoded.restaurantId
  };
}

export async function blacklistToken(token: string) {
  if (!redis) return;
  const decoded = jwt.decode(token) as { exp?: number } | null;
  const ttl = decoded?.exp ? Math.max(decoded.exp - Math.floor(Date.now() / 1000), 1) : 60 * 60;
  await redis.set(`jwt:blacklist:${token}`, "1", "EX", ttl);
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
  if (!token) return next(new AppError(401, "Missing bearer token"));

  try {
    if (redis) {
      const isBlacklisted = await redis.get(`jwt:blacklist:${token}`);
      if (isBlacklisted) return next(new AppError(401, "Token has been revoked"));
    }
    req.user = verifyAccessToken(token);
    req.token = token;
    return next();
  } catch {
    return next(new AppError(401, "Invalid or expired token"));
  }
}

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError(401, "Authentication required"));
    if (req.user.role === "admin" || roles.includes(req.user.role)) return next();
    return next(new AppError(403, "Insufficient permissions"));
  };
}
