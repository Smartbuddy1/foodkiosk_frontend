export const ROLES = ["super_admin", "admin", "staff", "kitchen", "cashier", "manager"] as const;
export type Role = (typeof ROLES)[number];

export const ORDER_TYPES = ["dine_in", "takeaway"] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

export const ORDER_STATUSES = [
  "new",
  "preparing",
  "ready",
  "collected",
  "cancelled"
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ["card", "upi", "cash"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "refunded",
  "pending_cash"
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["collected"],
  collected: [],
  cancelled: []
};

export const SUPER_ADMIN_ROLES: Role[] = ["super_admin"];
export const ADMIN_ROLES: Role[] = ["admin", "manager"];
export const KDS_ROLES: Role[] = ["admin", "manager", "staff", "kitchen"];
export const CASHIER_ROLES: Role[] = ["admin", "manager", "cashier"];

export const DEFAULT_TAX_RATES = {
  food: 0.05,
  beverage: 0.18
} as const;

export const DEFAULT_PACKAGING_CHARGE = 10;

export const CATEGORY_STATIONS: Record<string, "Grill" | "Fry" | "Assembly" | "Drinks"> = {
  Burgers: "Grill",
  Wraps: "Assembly",
  Sides: "Fry",
  Drinks: "Drinks",
  Combos: "Assembly",
  Desserts: "Assembly"
};

export type RestaurantDto = {
  id: string;
  name: string;
  logoUrl?: string | null;
  isActive: boolean;
  createdAt: string;
};

export type CategoryDto = {
  id: number;
  restaurantId: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
};

export type VariantDto = {
  id: number;
  label: string;
  priceDelta: number;
};

export type AddonDto = {
  id: number;
  label: string;
  price: number;
  isDefault: boolean;
};

export type MenuItemDto = {
  id: number;
  restaurantId: string;
  categoryId: number;
  category?: CategoryDto;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isVeg: boolean;
  isVegan?: boolean;
  isAvailable: boolean;
  allergens?: string[];
  variants: VariantDto[];
  addons: AddonDto[];
};

export type OrderItemDto = {
  id: number;
  menuItemId: number;
  name: string;
  category: string;
  station: "Grill" | "Fry" | "Assembly" | "Drinks";
  variant?: string | null;
  quantity: number;
  unitPrice: number;
  customisations: {
    addons?: string[];
    removeIngredients?: string[];
    spiceLevel?: "mild" | "medium" | "hot";
    specialInstructions?: string;
  };
};

export type OrderDto = {
  id: number;
  restaurantId: string;
  tokenNumber: number;
  orderType: OrderType;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  packagingCharge: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItemDto[];
};

export type AnalyticsSummaryDto = {
  totalOrders: number;
  revenue: number;
  averageOrderValue: number;
  liveByStatus: Record<OrderStatus, number>;
  hourlyVolume: Array<{ hour: string; orders: number; revenue: number }>;
  topItems: Array<{ name: string; quantity: number; revenue: number }>;
  paymentBreakdown: Array<{ method: PaymentMethod; count: number; revenue: number }>;
  categoryRevenue: Array<{ category: string; revenue: number }>;
  revenueTrend: Array<{ date: string; revenue: number; orders: number }>;
};

export function formatRupees(value: number): string {
  return `₹${value.toFixed(2)}`;
}

export function toTitle(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getStationForCategory(category: string): "Grill" | "Fry" | "Assembly" | "Drinks" {
  return CATEGORY_STATIONS[category] ?? "Assembly";
}

export function getTaxRateForCategory(category: string): number {
  return category === "Drinks" ? DEFAULT_TAX_RATES.beverage : DEFAULT_TAX_RATES.food;
}
