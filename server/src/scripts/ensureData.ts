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

async function ensureMenu(restaurantId: string) {
  const desserts = await prisma.category.findUnique({
    where: {
      restaurantId_name: {
        restaurantId,
        name: "Desserts",
      },
    },
  });
  if (!desserts) return;

  const items = [
    {
      name: "Dairy Don Hard Scoops",
      description: "Classic Dairy Don ice cream scoops served rich and creamy.",
      price: 89,
      imageUrl: "/images/photos/hard-scoops-photo.png",
    },
    {
      name: "Dairy Don Softies",
      description: "Smooth vanilla soft serve with chocolate drizzle.",
      price: 79,
      imageUrl: "/images/photos/softies-photo.png",
    },
    {
      name: "Dairy Don Sundae",
      description: "Sundae with assorted scoops, cream, and chocolate sauce.",
      price: 129,
      imageUrl: "/images/photos/sundae-photo.jpg",
    },
    {
      name: "Dairy Don Thickshake",
      description: "Thick creamy shake finished with chocolate drizzle.",
      price: 149,
      imageUrl: "/images/photos/thickshakes-photo.png",
    },
    {
      name: "Dairy Don Mastani",
      description: "Creamy mastani dessert shake topped with ice cream.",
      price: 159,
      imageUrl: "/images/photos/mastani-photo.png",
    },
    {
      name: "Dairy Don Chocolate Candy Bar",
      description: "Chocolate-coated frozen candy bar with chocolate dip.",
      price: 99,
      imageUrl: "/images/photos/candy-photo.png",
    },
  ];

  for (const item of items) {
    const existing = await prisma.menuItem.findFirst({
      where: {
        restaurantId,
        name: item.name,
      },
    });
    const menuItem =
      existing ??
      (await prisma.menuItem.create({
        data: {
          restaurantId,
          categoryId: desserts.id,
          name: item.name,
          description: item.description,
          price: item.price,
          imageUrl: item.imageUrl,
          isVeg: true,
          isAvailable: true,
          allergens: "dairy",
        },
      }));

    const regular = await prisma.itemVariant.findFirst({
      where: { itemId: menuItem.id, label: "Regular" },
    });
    if (!regular) {
      await prisma.itemVariant.create({
        data: {
          itemId: menuItem.id,
          label: "Regular",
          priceDelta: 0,
        },
      });
    }
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
  await ensureMenu(restaurant.id);
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
