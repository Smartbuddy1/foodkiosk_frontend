import type {
  AnalyticsSummaryDto,
  CategoryDto,
  MenuItemDto,
  OrderDto,
  OrderStatus,
  OrderType,
  PaymentMethod,
  Role,
} from "@food/shared";

export const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";
export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ?? "http://localhost:4000";

export type AuthUser = {
  id: number;
  restaurantId?: string | null;
  email: string;
  name: string;
  role: Role;
};

export type OrderInput = {
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  notes?: string;
  promoCode?: string;
  items: Array<{
    menuItemId: number;
    quantity: number;
    variantId?: number;
    addonIds: number[];
    removeIngredients: string[];
    spiceLevel: "mild" | "medium" | "hot";
    specialInstructions?: string;
  }>;
};

type RequestOptions = RequestInit & { token?: string };

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body)
    headers.set("Content-Type", "application/json");
  if (options.token) headers.set("Authorization", `Bearer ${options.token}`);

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message ?? `Request failed with ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  health: () => request<{ ok: boolean }>("/health"),
  categories: () => request<{ categories: CategoryDto[] }>("/menu/categories"),
  items: (params = "") =>
    request<{ items: MenuItemDto[] }>(`/menu/items${params}`),
  placeOrder: (order: OrderInput) =>
    request<{ order: OrderDto }>("/orders", {
      method: "POST",
      body: JSON.stringify(order),
    }),
  cashOrder: (order: OrderInput) =>
    request<{ order: OrderDto }>("/payments/cash", {
      method: "POST",
      body: JSON.stringify(order),
    }),
  printReceipt: (orderId: number) =>
    request<{ printed: boolean; reason?: string }>(
      `/orders/${orderId}/receipt`,
      {
        method: "POST",
      },
    ),
  readyTokens: () =>
    request<{
      tokens: Array<{
        id: number;
        tokenNumber: number;
        status: OrderStatus;
        updatedAt: string;
      }>;
    }>("/kds/ready"),
  login: (email: string, password: string) =>
    request<{ token: string; user: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: (token: string) => request<{ user: AuthUser }>("/auth/me", { token }),
  adminSummary: (token: string) =>
    request<{ summary: AnalyticsSummaryDto }>("/admin/analytics/summary", {
      token,
    }),
  adminOrders: (token: string, params = "") =>
    request<{ orders: OrderDto[] }>(`/admin/orders${params}`, { token }),
  updateOrderStatus: (
    token: string,
    orderId: number,
    status: OrderStatus,
    override = false,
  ) =>
    request<{ order: OrderDto }>(`/admin/orders/${orderId}/status`, {
      method: "PUT",
      token,
      body: JSON.stringify({ status, override }),
    }),
  adminMenuItems: (token: string) =>
    request<{ items: MenuItemDto[] }>("/admin/menu/items", { token }),
  adminCategories: (token: string) =>
    request<{ categories: CategoryDto[] }>("/admin/menu/categories", { token }),
  createMenuItem: (token: string, body: Record<string, unknown>) =>
    request<{ item: MenuItemDto }>("/admin/menu/items", {
      method: "POST",
      token,
      body: JSON.stringify(body),
    }),
  updateMenuItem: (token: string, itemId: number, body: Partial<MenuItemDto>) =>
    request<{ item: MenuItemDto }>(`/admin/menu/items/${itemId}`, {
      method: "PUT",
      token,
      body: JSON.stringify(body),
    }),
  promos: (token: string) =>
    request<{ promos: Array<Record<string, unknown>> }>("/admin/promos", {
      token,
    }),
  createPromo: (token: string, body: Record<string, unknown>) =>
    request<{ promo: Record<string, unknown> }>("/admin/promos", {
      method: "POST",
      token,
      body: JSON.stringify(body),
    }),
  staff: (token: string) =>
    request<{ staff: AuthUser[] }>("/admin/staff", { token }),
  createStaff: (token: string, body: Record<string, unknown>) =>
    request<{ staff: AuthUser }>("/admin/staff", {
      method: "POST",
      token,
      body: JSON.stringify(body),
    }),
  settings: (token: string) =>
    request<{ settings: Record<string, unknown> }>("/admin/settings", {
      token,
    }),
  activity: (token: string) =>
    request<{ activity: Array<Record<string, unknown>> }>("/admin/activity", {
      token,
    }),
};

export function getStoredToken() {
  return window.localStorage.getItem("food-kiosk-token");
}

export function storeAuth(token: string, user: AuthUser) {
  window.localStorage.setItem("food-kiosk-token", token);
  window.localStorage.setItem("food-kiosk-user", JSON.stringify(user));
}

export function clearAuth() {
  window.localStorage.removeItem("food-kiosk-token");
  window.localStorage.removeItem("food-kiosk-user");
}

export function getStoredUser(): AuthUser | null {
  const raw = window.localStorage.getItem("food-kiosk-user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}
