import { Router } from "express";
import type { MenuItemDto } from "@food/shared";
import { prisma } from "../config/prisma.js";
import { AppError } from "../middleware/error.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const menuRouter = Router();

function serializeMenuItem(item: Awaited<ReturnType<typeof prisma.menuItem.findMany>>[number]): MenuItemDto {
  const typed = item as typeof item & {
    category?: { id: number; restaurantId: string; name: string; displayOrder: number; isActive: boolean };
    variants?: Array<{ id: number; label: string; priceDelta: unknown }>;
    addons?: Array<{ id: number; label: string; price: unknown; isDefault: boolean }>;
  };
  return {
    id: typed.id,
    restaurantId: typed.restaurantId,
    categoryId: typed.categoryId,
    category: typed.category,
    name: typed.name,
    description: typed.description,
    price: Number(typed.price),
    imageUrl: typed.imageUrl,
    isVeg: typed.isVeg,
    isVegan: typed.isVegan,
    isAvailable: typed.isAvailable,
    allergens: typeof typed.allergens === "string"
      ? (typed.allergens ? typed.allergens.split(",") : [])
      : (Array.isArray(typed.allergens) ? typed.allergens : []),
    variants: (typed.variants ?? []).map((variant) => ({
      id: variant.id,
      label: variant.label,
      priceDelta: Number(variant.priceDelta)
    })),
    addons: (typed.addons ?? []).map((addon) => ({
      id: addon.id,
      label: addon.label,
      price: Number(addon.price),
      isDefault: addon.isDefault
    }))
  };
}

menuRouter.get(
  "/categories",
  asyncHandler(async (req, res) => {
    let restaurantId = req.query.restaurantId as string;
    if (!restaurantId) {
      const defaultRestaurant = await prisma.restaurant.findFirst({ where: { isActive: true } });
      if (defaultRestaurant) restaurantId = defaultRestaurant.id;
      else throw new AppError(400, "restaurantId is required");
    }
    const categories = await prisma.category.findMany({
      where: { restaurantId, isActive: true },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }]
    });
    res.json({ categories });
  })
);

menuRouter.get(
  "/items",
  asyncHandler(async (req, res) => {
    let restaurantId = req.query.restaurantId as string;
    if (!restaurantId) {
      const defaultRestaurant = await prisma.restaurant.findFirst({ where: { isActive: true } });
      if (defaultRestaurant) restaurantId = defaultRestaurant.id;
      else throw new AppError(400, "restaurantId is required");
    }
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const search = req.query.search ? String(req.query.search) : undefined;
    const items = await prisma.menuItem.findMany({
      where: {
        restaurantId,
        categoryId,
        category: { isActive: true },
        OR: search
          ? [
              { name: { contains: search } },
              { description: { contains: search } }
            ]
          : undefined
      },
      include: {
        category: true,
        variants: true,
        addons: true
      },
      orderBy: [{ category: { displayOrder: "asc" } }, { name: "asc" }]
    });
    res.json({ items: items.map(serializeMenuItem) });
  })
);

menuRouter.get(
  "/items/:id",
  asyncHandler(async (req, res) => {
    const restaurantId = req.query.restaurantId as string;
    const item = await prisma.menuItem.findUnique({
      where: { id: Number(req.params.id), restaurantId },
      include: {
        category: true,
        variants: true,
        addons: true
      }
    });
    if (!item) throw new AppError(404, "Menu item not found");
    res.json({ item: serializeMenuItem(item) });
  })
);
