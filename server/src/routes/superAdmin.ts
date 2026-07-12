import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Role } from "@food/shared";
import { prisma } from "../config/prisma.js";
import { authorize } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const superAdminRouter = Router();

const restaurantSchema = z.object({
  name: z.string().min(2),
  logoUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().default(true)
});

const adminUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6)
});

// GET all restaurants
superAdminRouter.get(
  "/restaurants",
  authorize("super_admin"),
  asyncHandler(async (_req, res) => {
    const restaurants = await prisma.restaurant.findMany({
      include: {
        users: {
          where: { role: "ADMIN" },
          select: { id: true, name: true, email: true, createdAt: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json({ restaurants });
  })
);

// CREATE restaurant & admin
superAdminRouter.post(
  "/restaurants",
  authorize("super_admin"),
  asyncHandler(async (req, res) => {
    const restaurantInput = restaurantSchema.parse(req.body.restaurant);
    const adminInput = adminUserSchema.parse(req.body.admin);

    const passwordHash = await bcrypt.hash(adminInput.password, 10);

    const restaurant = await prisma.restaurant.create({
      data: {
        name: restaurantInput.name,
        logoUrl: restaurantInput.logoUrl,
        isActive: restaurantInput.isActive,
        users: {
          create: {
            name: adminInput.name,
            email: adminInput.email,
            passwordHash,
            role: "ADMIN"
          }
        }
      },
      include: {
        users: { select: { id: true, name: true, email: true, createdAt: true } }
      }
    });

    res.status(201).json({ restaurant });
  })
);

// UPDATE restaurant status
superAdminRouter.put(
  "/restaurants/:id",
  authorize("super_admin"),
  asyncHandler(async (req, res) => {
    const restaurant = await prisma.restaurant.update({
      where: { id: req.params.id },
      data: { isActive: req.body.isActive }
    });
    res.json({ restaurant });
  })
);
