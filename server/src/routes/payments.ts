import { Router } from "express";
import { z } from "zod";
import { createOrder } from "../services/orderService.js";
import {
  createRazorpayOrder,
  verifyRazorpaySignature
} from "../services/paymentService.js";
import { paymentRateLimiter } from "../middleware/rateLimit.js";
import { AppError } from "../middleware/error.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { placeOrderSchema } from "../validators/order.js";
import { broadcastNewOrder } from "../config/socket.js";

export const paymentsRouter = Router();

const createPaymentSchema = z.object({
  amount: z.coerce.number().positive(),
  receipt: z.string().max(80).default(() => `receipt_${Date.now()}`)
});

const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
  order: placeOrderSchema
});

paymentsRouter.use(paymentRateLimiter);

paymentsRouter.post(
  "/create",
  asyncHandler(async (req, res) => {
    const input = createPaymentSchema.parse(req.body);
    const paymentOrder = await createRazorpayOrder(input.amount, input.receipt);
    res.status(201).json({ paymentOrder });
  })
);

paymentsRouter.post(
  "/verify",
  asyncHandler(async (req, res) => {
    const input = verifyPaymentSchema.parse(req.body);
    const isValid = verifyRazorpaySignature(input);
    if (!isValid) throw new AppError(400, "Invalid Razorpay payment signature");

    const order = await createOrder(input.order.restaurantId, input.order, {
      paymentStatus: "paid",
      razorpayOrderId: input.razorpayOrderId,
      razorpayPaymentId: input.razorpayPaymentId
    });
    broadcastNewOrder(order);
    res.status(201).json({ order });
  })
);

paymentsRouter.post(
  "/cash",
  asyncHandler(async (req, res) => {
    const input = placeOrderSchema.parse({ ...req.body, paymentMethod: "cash" });
    const order = await createOrder(input.restaurantId, input, { paymentStatus: "pending_cash" });
    broadcastNewOrder(order);
    res.status(201).json({ order });
  })
);
