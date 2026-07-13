import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "../config/prisma.js";

async function ensureRestaurant() {
  const existing = await prisma.restaurant.findFirst({
    where: { name: "Dairy Don The Real Ice Cream" },
  });
  if (existing) return existing;

  return prisma.restaurant.create({
    data: {
      name: "Dairy Don The Real Ice Cream",
      isActive: true,
    },
  });
}

async function ensureCategories(restaurantId: string) {
  const categories = [
    { name: "Burgers", displayOrder: 1 },
    { name: "Wraps", displayOrder: 2 },
    { name: "Sides", displayOrder: 3 },
    { name: "Drinks", displayOrder: 4 },
    { name: "Combos", displayOrder: 5 },
    { name: "Desserts", displayOrder: 6 },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: {
        restaurantId_name: {
          restaurantId,
          name: category.name,
        },
      },
      update: {
        displayOrder: category.displayOrder,
        isActive: true,
      },
      create: {
        restaurantId,
        name: category.name,
        displayOrder: category.displayOrder,
        isActive: true,
      },
    });
  }
}

async function ensureAdmin(restaurantId: string) {
  const passwordHash = await bcrypt.hash("Admin@12345", 10);
  await prisma.user.upsert({
    where: { email: "admin@food.local" },
    update: {
      restaurantId,
      role: Role.ADMIN,
    },
    create: {
      restaurantId,
      name: "Admin",
      email: "admin@food.local",
      passwordHash,
      role: Role.ADMIN,
    },
  });
}

async function main() {
  const restaurant = await ensureRestaurant();
  await ensureCategories(restaurant.id);
  await ensureAdmin(restaurant.id);
  console.log("Default production data ready: admin@food.local / Admin@12345");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
