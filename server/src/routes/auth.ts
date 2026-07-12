import { Router } from "express";
import bcrypt from "bcryptjs";
import type { Role } from "@food/shared";
import { prisma } from "../config/prisma.js";
import {
  authenticate,
  blacklistToken,
  signAccessToken,
} from "../middleware/auth.js";
import { AppError } from "../middleware/error.js";
import { loginSchema } from "../validators/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logActivity } from "../services/auditService.js";

export const authRouter = Router();

const toRole = (role: string) => role.toLowerCase() as Role;

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (!user) throw new AppError(401, "Invalid email or password");

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) throw new AppError(401, "Invalid email or password");

    const payload = {
      id: user.id,
      restaurantId: user.restaurantId,
      email: user.email,
      name: user.name,
      role: toRole(user.role),
    };
    const token = signAccessToken(payload);
    await logActivity(payload, "auth.login");

    res.json({ token, user: payload });
  }),
);

authRouter.post(
  "/logout",
  authenticate,
  asyncHandler(async (req, res) => {
    if (req.token) await blacklistToken(req.token);
    await logActivity(req.user, "auth.logout");
    res.status(204).send();
  }),
);

authRouter.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  }),
);
