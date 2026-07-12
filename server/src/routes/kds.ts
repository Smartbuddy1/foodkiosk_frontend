import { Router } from "express";
import { getReadyTokens } from "../services/orderService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const kdsRouter = Router();

kdsRouter.get(
  "/ready",
  asyncHandler(async (_req, res) => {
    const orders = await getReadyTokens();
    res.json({
      tokens: orders.map((order) => ({
        id: order.id,
        tokenNumber: order.tokenNumber,
        status: order.status,
        updatedAt: order.updatedAt
      }))
    });
  })
);
