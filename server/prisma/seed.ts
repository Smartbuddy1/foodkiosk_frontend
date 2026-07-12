import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const localPhoto = (fileName: string) => `/images/photos/${fileName}`;

async function main() {
  console.log("Starting seed...");

  // Create Super Admin
  const superAdminPassword = await bcrypt.hash("Super@12345", 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: "super@food.local" },
    update: {},
    create: {
      name: "Super Admin",
      email: "super@food.local",
      passwordHash: superAdminPassword,
      role: Role.SUPER_ADMIN,
    },
  });
  console.log(`Super Admin created: ${superAdmin.email}`);

  // Create Restaurant 1 (BiteCraft Burgers)
  const restaurant1 = await prisma.restaurant.create({
    data: {
      name: "BiteCraft Burgers",
      isActive: true,
    },
  });
  console.log(`Restaurant created: ${restaurant1.name}`);

  // Create Restaurant 1 Admin
  const adminPassword = await bcrypt.hash("Admin@12345", 10);
  await prisma.user.upsert({
    where: { email: "admin@food.local" },
    update: { restaurantId: restaurant1.id },
    create: {
      restaurantId: restaurant1.id,
      name: "Admin",
      email: "admin@food.local",
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  });

  // Create categories for Restaurant 1
  const categoriesData = [
    { name: "Burgers", displayOrder: 1 },
    { name: "Wraps", displayOrder: 2 },
    { name: "Sides", displayOrder: 3 },
    { name: "Drinks", displayOrder: 4 },
    { name: "Combos", displayOrder: 5 },
    { name: "Desserts", displayOrder: 6 },
  ];

  const categories = [];
  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: {
        restaurantId_name: { restaurantId: restaurant1.id, name: cat.name },
      },
      update: {},
      create: {
        restaurantId: restaurant1.id,
        name: cat.name,
        displayOrder: cat.displayOrder,
        isActive: true,
      },
    });
    categories.push(created);
  }

  const categoryMap = Object.fromEntries(categories.map((c) => [c.name, c.id]));

  // Create Premium BiteCraft Menu Items
  const menuItemsData = [
    {
      categoryId: categoryMap["Burgers"],
      name: "BiteCraft Signature Beast",
      description:
        "Double house-blend grilled patties with caramelised onions, truffle mayo, and sharp cheddar.",
      price: 189,
      imageUrl:
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80",
      isVeg: false,
      allergens: "gluten,dairy",
    },
    {
      categoryId: categoryMap["Burgers"],
      name: "Truffle Mushroom & Veg Craft",
      description:
        "Hand-crafted wild mushroom patty with truffle drizzle and Swiss cheese.",
      price: 139,
      imageUrl:
        "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=800&q=80",
      isVeg: true,
      allergens: "gluten,dairy",
    },
    {
      categoryId: categoryMap["Wraps"],
      name: "Smoked Paneer & Pepper Craft Wrap",
      description:
        "Tandoori-smoked paneer cubes, bell peppers, and mint-yogurt dressing.",
      price: 159,
      imageUrl:
        "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&q=80",
      isVeg: true,
      allergens: "gluten,dairy",
    },
    {
      categoryId: categoryMap["Wraps"],
      name: "Fiery Chipotle Chicken Wrap",
      description:
        "Crispy chicken tenders coated in fiery chipotle sauce with fresh lettuce.",
      price: 179,
      imageUrl:
        "https://images.unsplash.com/photo-1528736235302-52922df5c122?w=800&q=80",
      isVeg: false,
      allergens: "gluten,egg",
    },
    {
      categoryId: categoryMap["Sides"],
      name: "Rustic Sea Salt Fries",
      description: "Thick-cut skin-on fries tossed in Himalayan pink sea salt.",
      price: 99,
      imageUrl:
        "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=800&q=80",
      isVeg: true,
      allergens: "",
    },
    {
      categoryId: categoryMap["Sides"],
      name: "Gourmet Pepper-Cheese Croquettes",
      description:
        "Golden fried croquettes stuffed with jalapeno, black pepper, and gooey cheese.",
      price: 119,
      imageUrl:
        "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=800&q=80",
      isVeg: true,
      allergens: "dairy,gluten",
    },
    {
      categoryId: categoryMap["Drinks"],
      name: "House Brewed Cola",
      description:
        "Our signature craft cola made with natural cane sugar and spices.",
      price: 79,
      imageUrl:
        "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&q=80",
      isVeg: true,
      allergens: "",
    },
    {
      categoryId: categoryMap["Drinks"],
      name: "Alphonso Mango & Mint Nectar",
      description:
        "Fresh alphonso mango nectar blended with crushed mint leaves.",
      price: 109,
      imageUrl:
        "https://images.unsplash.com/photo-1546171753-97d7676e4602?w=800&q=80",
      isVeg: true,
      allergens: "",
    },
    {
      categoryId: categoryMap["Combos"],
      name: "BiteCraft Signature Combo",
      description: "Signature Beast Burger + Rustic Fries + House Brewed Cola.",
      price: 299,
      imageUrl:
        "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800&q=80",
      isVeg: false,
      allergens: "gluten,dairy",
    },
    {
      categoryId: categoryMap["Combos"],
      name: "Artisanal Wrap Combo",
      description:
        "Smoked Paneer Wrap + Gourmet Croquettes + Alphonso Mango Nectar.",
      price: 279,
      imageUrl:
        "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&q=80",
      isVeg: true,
      allergens: "gluten,dairy",
    },
    {
      categoryId: categoryMap["Desserts"],
      name: "Belgian Chocolate Fudge Velvet",
      description:
        "Warm, rich Belgian chocolate cake slice with a gooey center.",
      price: 99,
      imageUrl:
        "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=800&q=80",
      isVeg: true,
      allergens: "dairy",
    },
    {
      categoryId: categoryMap["Desserts"],
      name: "Gooey Walnut & Fudge Brownie",
      description:
        "Triple-chocolate fudge brownie topped with roasted walnuts.",
      price: 89,
      imageUrl:
        "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&q=80",
      isVeg: true,
      allergens: "gluten,dairy",
    },
    {
      categoryId: categoryMap["Desserts"],
      name: "Dairy Don Hard Scoops",
      description:
        "Classic Dairy Don ice cream scoops served rich, creamy, and chilled.",
      price: 89,
      imageUrl: localPhoto("hard-scoops-photo.png"),
      isVeg: true,
      allergens: "dairy",
    },
    {
      categoryId: categoryMap["Desserts"],
      name: "Dairy Don Softies",
      description:
        "Smooth vanilla soft serve topped with chocolate drizzle and crunchy nuts.",
      price: 79,
      imageUrl: localPhoto("softies-photo.png"),
      isVeg: true,
      allergens: "dairy,nuts",
    },
    {
      categoryId: categoryMap["Desserts"],
      name: "Dairy Don Sundae",
      description:
        "Banana split sundae with assorted scoops, whipped cream, and chocolate sauce.",
      price: 129,
      imageUrl: localPhoto("sundae-photo.jpg"),
      isVeg: true,
      allergens: "dairy",
    },
    {
      categoryId: categoryMap["Desserts"],
      name: "Dairy Don Thickshake",
      description:
        "Thick chocolate shake blended creamy and finished with chocolate drizzle.",
      price: 149,
      imageUrl: localPhoto("thickshakes-photo.png"),
      isVeg: true,
      allergens: "dairy,nuts",
    },
    {
      categoryId: categoryMap["Desserts"],
      name: "Dairy Don Mastani",
      description:
        "Creamy mastani dessert shake topped with ice cream and chocolate garnish.",
      price: 159,
      imageUrl: localPhoto("mastani-photo.png"),
      isVeg: true,
      allergens: "dairy",
    },
    {
      categoryId: categoryMap["Desserts"],
      name: "Dairy Don Sugar Less Scoops",
      description:
        "Sugar-less chocolate ice cream scoops with a smooth, rich finish.",
      price: 109,
      imageUrl: localPhoto("sugar-less-photo.jpg"),
      isVeg: true,
      allergens: "dairy,nuts",
    },
    {
      categoryId: categoryMap["Desserts"],
      name: "Dairy Don Chocolate Candy Bar",
      description:
        "Chocolate-coated frozen candy bar served with a glossy chocolate dip.",
      price: 99,
      imageUrl: localPhoto("candy-photo.png"),
      isVeg: true,
      allergens: "dairy",
    },
  ];

  for (const item of menuItemsData) {
    const createdItem = await prisma.menuItem.create({
      data: {
        restaurantId: restaurant1.id,
        categoryId: item.categoryId,
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        isVeg: item.isVeg,
        allergens: item.allergens,
      },
    });

    if (
      item.categoryId === categoryMap["Burgers"] ||
      item.categoryId === categoryMap["Wraps"]
    ) {
      await prisma.itemVariant.createMany({
        data: [
          { itemId: createdItem.id, label: "Regular", priceDelta: 0 },
          { itemId: createdItem.id, label: "Large", priceDelta: 40 },
        ],
      });

      await prisma.itemAddon.createMany({
        data: [
          { itemId: createdItem.id, label: "Extra Cheese", price: 20 },
          { itemId: createdItem.id, label: "Jalapenos", price: 15 },
        ],
      });
    }

    if (
      item.categoryId === categoryMap["Desserts"] &&
      item.name.startsWith("Dairy Don ")
    ) {
      await prisma.itemVariant.createMany({
        data: [
          { itemId: createdItem.id, label: "Regular", priceDelta: 0 },
          { itemId: createdItem.id, label: "Large", priceDelta: 35 },
        ],
      });

      await prisma.itemAddon.createMany({
        data: [
          { itemId: createdItem.id, label: "Chocolate Sauce", price: 20 },
          { itemId: createdItem.id, label: "Nut Crunch", price: 20 },
        ],
      });
    }
  }

  // Create Restaurant 2 (Pizza Palace) to test multi-tenancy
  const restaurant2 = await prisma.restaurant.create({
    data: { name: "Pizza Palace" },
  });
  console.log(`Restaurant created: ${restaurant2.name}`);

  const admin2Password = await bcrypt.hash("Admin@12345", 10);
  await prisma.user.upsert({
    where: { email: "pizza@food.local" },
    update: { restaurantId: restaurant2.id },
    create: {
      restaurantId: restaurant2.id,
      name: "Pizza Admin",
      email: "pizza@food.local",
      passwordHash: admin2Password,
      role: Role.ADMIN,
    },
  });

  const pizzaCat = await prisma.category.create({
    data: {
      restaurantId: restaurant2.id,
      name: "Pizzas",
      displayOrder: 1,
      isActive: true,
    },
  });

  await prisma.menuItem.create({
    data: {
      restaurantId: restaurant2.id,
      categoryId: pizzaCat.id,
      name: "Margherita",
      description: "Classic cheese pizza",
      price: 299,
      imageUrl:
        "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80",
      isVeg: true,
      allergens: "gluten,dairy",
    },
  });

  console.log(
    "Seed complete. Super Admin: super@food.local | BiteCraft: admin@food.local | Pizza: pizza@food.local",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
