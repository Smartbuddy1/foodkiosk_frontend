import { z } from "zod";

const imageUrlSchema = z.string().refine(
  (value) => {
    if (value.startsWith("/images/")) return true;
    return z.string().url().safeParse(value).success;
  },
  { message: "imageUrl must be a valid URL or /images path" },
);

export const menuItemWriteSchema = z.object({
  categoryId: z.coerce.number().int().positive(),
  name: z.string().min(2).max(120),
  description: z.string().min(5).max(600),
  price: z.coerce.number().positive(),
  imageUrl: imageUrlSchema,
  isVeg: z.boolean(),
  isVegan: z.boolean().default(false),
  isAvailable: z.boolean().default(true),
  allergens: z.array(z.string().max(40)).default([]),
  variants: z
    .array(
      z.object({
        label: z.string().min(1).max(60),
        priceDelta: z.coerce.number().min(0),
      }),
    )
    .default([]),
  addons: z
    .array(
      z.object({
        label: z.string().min(1).max(60),
        price: z.coerce.number().min(0),
        isDefault: z.boolean().default(false),
      }),
    )
    .default([]),
});

export const categoryWriteSchema = z.object({
  name: z.string().min(2).max(80),
  displayOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});
