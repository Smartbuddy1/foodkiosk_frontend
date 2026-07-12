import { Router } from "express";
import { placeOrderSchema } from "../validators/order.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../middleware/error.js";
import { createOrder, getOrder } from "../services/orderService.js";
import { printReceipt } from "../services/receiptPrinter.js";
import { broadcastNewOrder } from "../config/socket.js";

export const ordersRouter = Router();

ordersRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    if (!req.body.restaurantId) {
      const { prisma } = await import("../config/prisma.js");
      const defaultRestaurant = await prisma.restaurant.findFirst({ where: { isActive: true } });
      if (defaultRestaurant) req.body.restaurantId = defaultRestaurant.id;
    }
    const input = placeOrderSchema.parse(req.body);
    const order = await createOrder(input.restaurantId, input);
    broadcastNewOrder(order);
    res.status(201).json({ order });
  })
);

ordersRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    let restaurantId = req.query.restaurantId as string;
    if (!restaurantId) {
      const { prisma } = await import("../config/prisma.js");
      const defaultRestaurant = await prisma.restaurant.findFirst({ where: { isActive: true } });
      if (defaultRestaurant) restaurantId = defaultRestaurant.id;
      else throw new AppError(400, "restaurantId query is required");
    }
    const order = await getOrder(Number(req.params.id), restaurantId);
    res.json({ order });
  })
);

ordersRouter.post(
  "/:id/receipt",
  asyncHandler(async (req, res) => {
    let restaurantId = req.body.restaurantId as string;
    if (!restaurantId) {
      const { prisma } = await import("../config/prisma.js");
      const defaultRestaurant = await prisma.restaurant.findFirst({ where: { isActive: true } });
      if (defaultRestaurant) restaurantId = defaultRestaurant.id;
      else throw new AppError(400, "restaurantId body is required");
    }
    const order = await getOrder(Number(req.params.id), restaurantId);
    const result = await printReceipt(order);
    res.json(result);
  })
);
