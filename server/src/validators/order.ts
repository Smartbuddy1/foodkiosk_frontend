import { z } from "zod";

export const orderItemInputSchema = z.object({
  menuItemId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(1).max(20),
  variantId: z.coerce.number().int().positive().optional(),
  addonIds: z.array(z.coerce.number().int().positive()).default([]),
  removeIngredients: z.array(z.string().max(40)).default([]),
  spiceLevel: z.enum(["mild", "medium", "hot"]).default("medium"),
  specialInstructions: z.string().max(160).optional()
});

export const placeOrderSchema = z.object({
  restaurantId: z.string().uuid(),
  orderType: z.enum(["dine_in", "takeaway"]),
  paymentMethod: z.enum(["card", "upi", "cash"]),
  notes: z.string().max(240).optional(),
  promoCode: z.string().trim().toUpperCase().max(32).optional(),
  items: z.array(orderItemInputSchema).min(1).max(60)
});

export const statusUpdateSchema = z.object({
  status: z.enum(["new", "preparing", "ready", "collected", "cancelled"]),
  override: z.boolean().default(false)
});
