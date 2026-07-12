import type { CategoryDto, MenuItemDto } from "@food/shared";

const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;
const localPhoto = (fileName: string) => `/images/photos/${fileName}`;

export const fallbackCategories: CategoryDto[] = [
  { id: 1, name: "Burgers", displayOrder: 1, isActive: true },
  { id: 2, name: "Wraps", displayOrder: 2, isActive: true },
  { id: 3, name: "Sides", displayOrder: 3, isActive: true },
  { id: 4, name: "Drinks", displayOrder: 4, isActive: true },
  { id: 5, name: "Combos", displayOrder: 5, isActive: true },
  { id: 6, name: "Desserts", displayOrder: 6, isActive: true },
];

export const fallbackItems: MenuItemDto[] = [
  {
    id: 1,
    categoryId: 1,
    category: fallbackCategories[0],
    name: "BiteCraft Signature Beast",
    description:
      "Double house-blend grilled patties with vintage cheddar, caramelised onions, hand-pickled gherkins, fresh crunch lettuce, and house signature sauce.",
    price: 189,
    imageUrl: img("photo-1568901346375-23c9450c58cd"),
    isVeg: false,
    isAvailable: true,
    allergens: ["gluten", "dairy"],
    variants: [
      { id: 1, label: "Regular", priceDelta: 0 },
      { id: 2, label: "Medium", priceDelta: 39 },
      { id: 3, label: "Large", priceDelta: 69 },
    ],
    addons: [
      { id: 1, label: "Extra Patty", price: 70, isDefault: false },
      { id: 2, label: "Cheese Slice", price: 25, isDefault: false },
      { id: 3, label: "Smoky Sauce", price: 15, isDefault: false },
    ],
  },
  {
    id: 2,
    categoryId: 1,
    category: fallbackCategories[0],
    name: "Truffle Mushroom & Veg Craft",
    description:
      "Crisp artisanal vegetable patty, infused with wild truffle mayo, vine-ripened tomatoes, and wild rocket.",
    price: 139,
    imageUrl: img("photo-1550547660-d9450f859349"),
    isVeg: true,
    isAvailable: true,
    allergens: ["gluten", "dairy"],
    variants: [
      { id: 4, label: "Regular", priceDelta: 0 },
      { id: 5, label: "Medium", priceDelta: 29 },
      { id: 6, label: "Large", priceDelta: 49 },
    ],
    addons: [
      { id: 4, label: "Cheese Slice", price: 25, isDefault: false },
      { id: 5, label: "Extra Sauce", price: 15, isDefault: false },
    ],
  },
  {
    id: 3,
    categoryId: 2,
    category: fallbackCategories[1],
    name: "Smoked Paneer & Pepper Craft Wrap",
    description:
      "Tandoori smoked cottage cheese cubes, grilled bell peppers, fresh garden greens, and mint greek-yoghurt dressing in a charred tortilla wrap.",
    price: 159,
    imageUrl: img("photo-1626700051175-6818013e1d4f"),
    isVeg: true,
    isAvailable: true,
    allergens: ["gluten", "dairy"],
    variants: [
      { id: 7, label: "Regular", priceDelta: 0 },
      { id: 8, label: "Large", priceDelta: 45 },
    ],
    addons: [
      { id: 6, label: "Extra Paneer", price: 45, isDefault: false },
      { id: 7, label: "Cheese", price: 25, isDefault: false },
    ],
  },
  {
    id: 4,
    categoryId: 2,
    category: fallbackCategories[1],
    name: "Fiery Chipotle Chicken Wrap",
    description:
      "Crispy buttermilk-fried chicken breast strips, pickled red onions, butterhead lettuce, and house-made smoky chipotle sauce.",
    price: 179,
    imageUrl: img("photo-1600335895229-6e75511892c8"),
    isVeg: false,
    isAvailable: false,
    allergens: ["gluten", "egg"],
    variants: [
      { id: 9, label: "Regular", priceDelta: 0 },
      { id: 10, label: "Large", priceDelta: 55 },
    ],
    addons: [
      { id: 8, label: "Extra Chicken", price: 60, isDefault: false },
      { id: 9, label: "Cheese", price: 25, isDefault: false },
    ],
  },
  {
    id: 5,
    categoryId: 3,
    category: fallbackCategories[2],
    name: "Rustic Sea Salt Fries",
    description:
      "Thick-cut skin-on rustic potatoes, lightly salted with pink Himalayan sea salt and rosemary dust.",
    price: 99,
    imageUrl: img("photo-1573080496219-bb080dd4f877"),
    isVeg: true,
    isAvailable: true,
    allergens: [],
    variants: [
      { id: 11, label: "Regular", priceDelta: 0 },
      { id: 12, label: "Medium", priceDelta: 35 },
      { id: 13, label: "Large", priceDelta: 55 },
    ],
    addons: [
      { id: 10, label: "Peri Peri Mix", price: 20, isDefault: false },
      { id: 11, label: "Cheese Dip", price: 25, isDefault: false },
    ],
  },
  {
    id: 6,
    categoryId: 4,
    category: fallbackCategories[3],
    name: "House Brewed Cola",
    description:
      "Refreshing draft cola brewed with organic cane sugar and a hint of lime.",
    price: 79,
    imageUrl: img("photo-1581006852262-e4307cf6283a"),
    isVeg: true,
    isAvailable: true,
    allergens: [],
    variants: [
      { id: 14, label: "Regular", priceDelta: 0 },
      { id: 15, label: "Medium", priceDelta: 20 },
      { id: 16, label: "Large", priceDelta: 35 },
    ],
    addons: [],
  },
  {
    id: 7,
    categoryId: 5,
    category: fallbackCategories[4],
    name: "BiteCraft Signature Combo",
    description:
      "Your choice of Signature Craft Burger served with rustic sea-salt fries and a draft house cola.",
    price: 299,
    imageUrl: img("photo-1594212699903-ec8a3eca50f5"),
    isVeg: false,
    isAvailable: true,
    allergens: ["gluten", "dairy"],
    variants: [
      { id: 17, label: "Regular", priceDelta: 0 },
      { id: 18, label: "Large Meal", priceDelta: 79 },
    ],
    addons: [
      { id: 12, label: "Cheese Slice", price: 25, isDefault: false },
      { id: 13, label: "Peri Peri Fries", price: 20, isDefault: false },
    ],
  },
  {
    id: 8,
    categoryId: 6,
    category: fallbackCategories[5],
    name: "Belgian Chocolate Fudge Velvet",
    description:
      "Gourmet soft-serve vanilla bean ice cream loaded with warm Belgian chocolate fudge and toasted almond shavings.",
    price: 99,
    imageUrl: img("photo-1488900128323-21503983a07e"),
    isVeg: true,
    isAvailable: true,
    allergens: ["dairy"],
    variants: [
      { id: 19, label: "Regular", priceDelta: 0 },
      { id: 20, label: "Large", priceDelta: 35 },
    ],
    addons: [
      { id: 14, label: "Extra Chocolate", price: 20, isDefault: false },
      { id: 15, label: "Nut Crunch", price: 20, isDefault: false },
    ],
  },
  {
    id: 9,
    categoryId: 6,
    category: fallbackCategories[5],
    name: "Dairy Don Hard Scoops",
    description:
      "Classic Dairy Don ice cream scoops served rich, creamy, and chilled.",
    price: 89,
    imageUrl: localPhoto("hard-scoops-photo.png"),
    isVeg: true,
    isAvailable: true,
    allergens: ["dairy"],
    variants: [
      { id: 21, label: "Regular", priceDelta: 0 },
      { id: 22, label: "Large", priceDelta: 35 },
    ],
    addons: [
      { id: 16, label: "Chocolate Sauce", price: 20, isDefault: false },
      { id: 17, label: "Waffle Cone", price: 20, isDefault: false },
    ],
  },
  {
    id: 10,
    categoryId: 6,
    category: fallbackCategories[5],
    name: "Dairy Don Softies",
    description:
      "Smooth vanilla soft serve topped with chocolate drizzle and crunchy nuts.",
    price: 79,
    imageUrl: localPhoto("softies-photo.png"),
    isVeg: true,
    isAvailable: true,
    allergens: ["dairy", "nuts"],
    variants: [
      { id: 23, label: "Regular", priceDelta: 0 },
      { id: 24, label: "Large", priceDelta: 30 },
    ],
    addons: [
      { id: 18, label: "Nut Crunch", price: 20, isDefault: false },
      { id: 19, label: "Chocolate Sauce", price: 20, isDefault: false },
    ],
  },
  {
    id: 11,
    categoryId: 6,
    category: fallbackCategories[5],
    name: "Dairy Don Sundae",
    description:
      "Banana split sundae with assorted scoops, whipped cream, and chocolate sauce.",
    price: 129,
    imageUrl: localPhoto("sundae-photo.jpg"),
    isVeg: true,
    isAvailable: true,
    allergens: ["dairy"],
    variants: [
      { id: 25, label: "Regular", priceDelta: 0 },
      { id: 26, label: "Large", priceDelta: 45 },
    ],
    addons: [
      { id: 20, label: "Extra Scoop", price: 35, isDefault: false },
      { id: 21, label: "Chocolate Sauce", price: 20, isDefault: false },
    ],
  },
  {
    id: 12,
    categoryId: 6,
    category: fallbackCategories[5],
    name: "Dairy Don Thickshake",
    description:
      "Thick chocolate shake blended creamy and finished with chocolate drizzle.",
    price: 149,
    imageUrl: localPhoto("thickshakes-photo.png"),
    isVeg: true,
    isAvailable: true,
    allergens: ["dairy", "nuts"],
    variants: [
      { id: 27, label: "Regular", priceDelta: 0 },
      { id: 28, label: "Large", priceDelta: 40 },
    ],
    addons: [
      { id: 22, label: "Whipped Cream", price: 25, isDefault: false },
      { id: 23, label: "Nut Crunch", price: 20, isDefault: false },
    ],
  },
  {
    id: 13,
    categoryId: 6,
    category: fallbackCategories[5],
    name: "Dairy Don Mastani",
    description:
      "Creamy mastani dessert shake topped with ice cream and chocolate garnish.",
    price: 159,
    imageUrl: localPhoto("mastani-photo.png"),
    isVeg: true,
    isAvailable: true,
    allergens: ["dairy"],
    variants: [
      { id: 29, label: "Regular", priceDelta: 0 },
      { id: 30, label: "Large", priceDelta: 45 },
    ],
    addons: [
      { id: 24, label: "Extra Scoop", price: 35, isDefault: false },
      { id: 25, label: "Chocolate Sauce", price: 20, isDefault: false },
    ],
  },
  {
    id: 14,
    categoryId: 6,
    category: fallbackCategories[5],
    name: "Dairy Don Sugar Less Scoops",
    description:
      "Sugar-less chocolate ice cream scoops with a smooth, rich finish.",
    price: 109,
    imageUrl: localPhoto("sugar-less-photo.jpg"),
    isVeg: true,
    isAvailable: true,
    allergens: ["dairy", "nuts"],
    variants: [
      { id: 31, label: "Regular", priceDelta: 0 },
      { id: 32, label: "Large", priceDelta: 35 },
    ],
    addons: [
      { id: 26, label: "Waffle Cone", price: 20, isDefault: false },
      { id: 27, label: "Nut Crunch", price: 20, isDefault: false },
    ],
  },
  {
    id: 15,
    categoryId: 6,
    category: fallbackCategories[5],
    name: "Dairy Don Chocolate Candy Bar",
    description:
      "Chocolate-coated frozen candy bar served with a glossy chocolate dip.",
    price: 99,
    imageUrl: localPhoto("candy-photo.png"),
    isVeg: true,
    isAvailable: true,
    allergens: ["dairy"],
    variants: [
      { id: 33, label: "Regular", priceDelta: 0 },
      { id: 34, label: "Large", priceDelta: 30 },
    ],
    addons: [
      { id: 28, label: "Chocolate Sauce", price: 20, isDefault: false },
      { id: 29, label: "Nut Crunch", price: 20, isDefault: false },
    ],
  },
];
