import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpDown,
  BadgePercent,
  Bell,
  ChevronDown,
  Edit3,
  Eye,
  EyeOff,
  Grid2X2,
  Megaphone,
  MoreVertical,
  PackagePlus,
  Plus,
  ReceiptText,
  RefreshCw,
  Save,
  Search,
  ShoppingBasket,
  Store,
  Truck,
  UserRoundCog,
  Users,
  XCircle,
} from "lucide-react";
import type {
  AnalyticsSummaryDto,
  CategoryDto,
  MenuItemDto,
  OrderDto,
  OrderStatus,
} from "@food/shared";
import Login from "./Login";
import { api, getStoredToken, getStoredUser } from "../lib/api";

type AdminView =
  | "dashboard"
  | "users"
  | "restaurants"
  | "orders"
  | "delivery"
  | "transactions"
  | "offers"
  | "banners"
  | "staff";
type CategoryBucket = "Food" | "Drink" | "Desert";
type SortMode = "newest" | "oldest" | "status";

type MenuFormState = {
  name: string;
  description: string;
  categoryId: string;
  price: string;
  imageUrl: string;
  isVeg: boolean;
  isAvailable: boolean;
};

const orange = "#ff922b";
const blue = "#3d7ff0";
const green = "#19c06b";
const red = "#ff2626";
const panelShadow = "0 12px 35px rgba(22, 22, 22, 0.06)";
const fallbackImage =
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=300&q=80";
const defaultProductImage =
  "https://images.unsplash.com/photo-1488900128323-21503983a07e?auto=format&fit=crop&w=900&q=80";
const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const statusOptions: OrderStatus[] = [
  "new",
  "preparing",
  "ready",
  "collected",
  "cancelled",
];
const demoSalesData = [
  { month: "Jan", sales: 18500 },
  { month: "Feb", sales: 22400 },
  { month: "Mar", sales: 27800 },
  { month: "Apr", sales: 24600 },
  { month: "May", sales: 31500 },
  { month: "Jun", sales: 36800 },
  { month: "Jul", sales: 42100 },
  { month: "Aug", sales: 39700 },
  { month: "Sep", sales: 45200 },
  { month: "Oct", sales: 48600 },
  { month: "Nov", sales: 52300 },
  { month: "Dec", sales: 57800 },
];
const demoEarningCategories = [
  { day: "Sun", Food: 5200, Drink: 2800, Desert: 8400 },
  { day: "Mon", Food: 3800, Drink: 2100, Desert: 6900 },
  { day: "Tue", Food: 4200, Drink: 2400, Desert: 7600 },
  { day: "Wed", Food: 4600, Drink: 2600, Desert: 8100 },
  { day: "Thu", Food: 5100, Drink: 3000, Desert: 9000 },
  { day: "Fri", Food: 6400, Drink: 3900, Desert: 11200 },
  { day: "Sat", Food: 7100, Drink: 4200, Desert: 12800 },
];
const demoSparkSales = [
  { label: 0, value: 5200 },
  { label: 1, value: 6400 },
  { label: 2, value: 5900 },
  { label: 3, value: 7200 },
  { label: 4, value: 8400 },
  { label: 5, value: 9100 },
  { label: 6, value: 10800 },
  { label: 7, value: 12400 },
];
const demoSparkOrders = [
  { label: 0, value: 34 },
  { label: 1, value: 42 },
  { label: 2, value: 39 },
  { label: 3, value: 48 },
  { label: 4, value: 56 },
  { label: 5, value: 63 },
  { label: 6, value: 71 },
  { label: 7, value: 78 },
];
const demoSpecialties = [
  {
    name: "Dairy Don Sundae",
    imageUrl: "/images/photos/sundae-photo.jpg",
    quantity: 142,
    revenue: 18318,
  },
  {
    name: "Dairy Don Thickshake",
    imageUrl: "/images/photos/thickshakes-photo.png",
    quantity: 118,
    revenue: 17582,
  },
  {
    name: "Dairy Don Hard Scoops",
    imageUrl: "/images/photos/hard-scoops-photo.png",
    quantity: 205,
    revenue: 18245,
  },
];
const demoTransactions = [
  {
    name: "Dairy Don Sundae",
    imageUrl: "/images/photos/sundae-photo.jpg",
    time: "12:45 PM",
    total: 258,
  },
  {
    name: "Dairy Don Thickshake",
    imageUrl: "/images/photos/thickshakes-photo.png",
    time: "12:18 PM",
    total: 298,
  },
  {
    name: "Dairy Don Hard Scoops",
    imageUrl: "/images/photos/hard-scoops-photo.png",
    time: "11:52 AM",
    total: 178,
  },
  {
    name: "Dairy Don Mastani",
    imageUrl: "/images/photos/mastani-photo.png",
    time: "11:30 AM",
    total: 318,
  },
];

const navItems: Array<{
  view: AdminView;
  label: string;
  icon: typeof Grid2X2;
}> = [
  { view: "dashboard", label: "Dashboard", icon: Grid2X2 },
  { view: "users", label: "Users", icon: Users },
  { view: "restaurants", label: "Restaurants", icon: Store },
  { view: "orders", label: "Orders", icon: ShoppingBasket },
  { view: "delivery", label: "Delivery Tracking", icon: Truck },
  { view: "transactions", label: "Transactions", icon: ReceiptText },
  { view: "offers", label: "Offers & Discounts", icon: BadgePercent },
  { view: "banners", label: "Banners & Promotions", icon: Megaphone },
  { view: "staff", label: "Staff & Access", icon: UserRoundCog },
];

function emptyMenuForm(categoryId = ""): MenuFormState {
  return {
    name: "",
    description: "",
    categoryId,
    price: "",
    imageUrl: defaultProductImage,
    isVeg: true,
    isAvailable: true,
  };
}

function sameDate(value: string, target: Date) {
  const date = new Date(value);
  return (
    date.getFullYear() === target.getFullYear() &&
    date.getMonth() === target.getMonth() &&
    date.getDate() === target.getDate()
  );
}

function previousDay(date: Date) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() - 1);
  return copy;
}

function changePercent(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function bucketForCategory(category?: string): CategoryBucket {
  const value = (category ?? "").toLowerCase();
  if (value.includes("drink") || value.includes("shake")) return "Drink";
  if (
    value.includes("dessert") ||
    value.includes("sweet") ||
    value.includes("scoop") ||
    value.includes("sundae")
  )
    return "Desert";
  return "Food";
}

function compactCurrency(value: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: value >= 1000 ? 0 : 2,
    minimumFractionDigits: value >= 1000 ? 0 : 2,
  })}`;
}

function itemImage(itemName: string, menuItems: MenuItemDto[]) {
  return (
    menuItems.find((item) => item.name === itemName)?.imageUrl ?? fallbackImage
  );
}

function monthlySales(orders: OrderDto[]) {
  const rows = months.map((month) => ({ month, sales: 0 }));
  const year = new Date().getFullYear();
  for (const order of orders) {
    const created = new Date(order.createdAt);
    if (created.getFullYear() === year)
      rows[created.getMonth()].sales += order.total;
  }
  return rows;
}

function weeklyBuckets(orders: OrderDto[]) {
  const rows = weekDays.map((day) => ({ day, Food: 0, Drink: 0, Desert: 0 }));
  for (const order of orders) {
    const created = new Date(order.createdAt);
    for (const item of order.items) {
      const bucket = bucketForCategory(item.category);
      rows[created.getDay()][bucket] += item.quantity * item.unitPrice;
    }
  }
  return rows;
}

function sparkline(orders: OrderDto[], metric: "sales" | "orders") {
  return Array.from({ length: 8 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (7 - index));
    const matching = orders.filter((order) => sameDate(order.createdAt, date));
    return {
      label: index,
      value:
        metric === "sales"
          ? matching.reduce((sum, order) => sum + order.total, 0)
          : matching.length,
    };
  });
}

function topItems(
  summary: AnalyticsSummaryDto | null,
  menuItems: MenuItemDto[],
) {
  return (summary?.topItems ?? []).slice(0, 5).map((item) => ({
    ...item,
    imageUrl: itemImage(item.name, menuItems),
  }));
}

function readableStatus(status: string) {
  if (status === "new") return "Pending";
  if (status === "preparing") return "Preparing";
  if (status === "ready") return "Ready";
  if (status === "collected") return "Completed";
  return "Cancelled";
}

function statusPill(status: string) {
  if (status === "ready" || status === "collected")
    return "bg-emerald-50 text-emerald-600 border-emerald-100";
  if (status === "preparing") return "bg-blue-50 text-blue-600 border-blue-100";
  if (status === "cancelled") return "bg-red-50 text-red-600 border-red-100";
  return "bg-orange-50 text-orange-600 border-orange-100";
}

function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[10px] bg-white ${className}`}
      style={{ boxShadow: panelShadow }}
    >
      {children}
    </section>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[10px] border border-dashed border-[#e2e2e2] bg-[#fafafa] p-8 text-center">
      <p className="text-sm font-black text-[#202020]">{title}</p>
      <p className="mt-2 text-xs font-semibold text-[#8d8d8d]">{text}</p>
    </div>
  );
}

function SalesCard({
  title,
  value,
  change,
  positive,
  orders,
  metric,
  sparkData,
}: {
  title: string;
  value: string | number;
  change: number;
  positive: boolean;
  orders: OrderDto[];
  metric: "sales" | "orders";
  sparkData?: Array<{ label: number; value: number }>;
}) {
  return (
    <Panel className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-semibold text-[#a0a0a0]">{title}</p>
          <p className="mt-8 text-[30px] font-bold tracking-wide text-[#1f1f1f]">
            {value}
          </p>
        </div>
        <span
          className={`rounded-[4px] border px-2 py-1 text-xs font-bold ${positive ? "border-emerald-200 bg-emerald-50 text-emerald-500" : "border-red-200 bg-red-50 text-red-500"}`}
        >
          {positive ? "Up" : "Down"} {Math.abs(change).toFixed(1)} %
        </span>
      </div>
      <div className="mt-1 h-16">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparkData ?? sparkline(orders, metric)}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={positive ? green : red}
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h3 className="text-[17px] font-black">{title}</h3>
      {action}
    </div>
  );
}

export default function Admin() {
  const [token, setToken] = useState(getStoredToken());
  const [activeView, setActiveView] = useState<AdminView>("dashboard");
  const [summary, setSummary] = useState<AnalyticsSummaryDto | null>(null);
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [promos, setPromos] = useState<Array<Record<string, unknown>>>([]);
  const [staff, setStaff] = useState<Array<Record<string, unknown>>>([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [menuQuery, setMenuQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [menuForm, setMenuForm] = useState<MenuFormState>(emptyMenuForm());
  const [orderStatusFilter, setOrderStatusFilter] = useState<
    OrderStatus | "all"
  >("all");
  const [orderSort, setOrderSort] = useState<SortMode>("newest");
  const [openOrderMenu, setOpenOrderMenu] = useState<number | null>(null);
  const user = getStoredUser();

  async function loadAdminData(currentToken = token) {
    if (!currentToken) return;
    setError("");
    try {
      const [
        summaryRes,
        ordersRes,
        menuRes,
        categoriesRes,
        promosRes,
        staffRes,
      ] = await Promise.all([
        api.adminSummary(currentToken),
        api.adminOrders(currentToken),
        api.adminMenuItems(currentToken),
        api.adminCategories(currentToken),
        api.promos(currentToken),
        api.staff(currentToken),
      ]);
      setSummary(summaryRes.summary);
      setOrders(ordersRes.orders);
      setMenuItems(menuRes.items);
      setCategories(categoriesRes.categories);
      setPromos(promosRes.promos);
      setStaff(staffRes.staff as unknown as Array<Record<string, unknown>>);
      setMenuForm((current) => ({
        ...current,
        categoryId:
          current.categoryId || String(categoriesRes.categories[0]?.id ?? ""),
      }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load admin dashboard",
      );
    }
  }

  useEffect(() => {
    void loadAdminData();
  }, [token]);

  const now = new Date();
  const yesterday = previousDay(now);
  const todayOrders = orders.filter((order) => sameDate(order.createdAt, now));
  const yesterdayOrders = orders.filter((order) =>
    sameDate(order.createdAt, yesterday),
  );
  const totalEarning = orders.reduce((sum, order) => sum + order.total, 0);
  const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
  const yesterdayRevenue = yesterdayOrders.reduce(
    (sum, order) => sum + order.total,
    0,
  );
  const salesChange = changePercent(todayRevenue, yesterdayRevenue);
  const orderChange = changePercent(todayOrders.length, yesterdayOrders.length);
  const salesData = useMemo(() => monthlySales(orders), [orders]);
  const earningCategories = useMemo(() => weeklyBuckets(orders), [orders]);
  const trending = useMemo(
    () => topItems(summary, menuItems),
    [menuItems, summary],
  );
  const topSpecialties = trending.length
    ? trending
    : menuItems.slice(0, 5).map((item) => ({
        name: item.name,
        imageUrl: item.imageUrl,
        quantity: 0,
        revenue: item.price,
      }));

  const filteredOrders = useMemo(() => {
    const rows = orders.filter(
      (order) =>
        orderStatusFilter === "all" || order.status === orderStatusFilter,
    );
    if (orderSort === "oldest")
      return [...rows].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    if (orderSort === "status")
      return [...rows].sort((a, b) => a.status.localeCompare(b.status));
    return [...rows].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [orderSort, orderStatusFilter, orders]);

  const filteredMenu = useMemo(() => {
    const query = menuQuery.trim().toLowerCase();
    return menuItems.filter((item) => {
      const categoryMatch =
        categoryFilter === "all" || String(item.categoryId) === categoryFilter;
      const textMatch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category?.name.toLowerCase().includes(query);
      return categoryMatch && textMatch;
    });
  }, [categoryFilter, menuItems, menuQuery]);

  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    const productRows = menuItems
      .filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query),
      )
      .slice(0, 4)
      .map((item) => ({
        id: item.id,
        type: "Product",
        title: item.name,
        meta: item.category?.name ?? "Menu item",
      }));
    const orderRows = orders
      .filter(
        (order) =>
          String(order.tokenNumber).includes(query) ||
          order.items.some((item) => item.name.toLowerCase().includes(query)),
      )
      .slice(0, 4)
      .map((order) => ({
        id: order.id,
        type: "Order",
        title: `Order #${String(order.tokenNumber).padStart(3, "0")}`,
        meta: readableStatus(order.status),
      }));
    return [...productRows, ...orderRows].slice(0, 6);
  }, [menuItems, orders, search]);

  function editItem(item: MenuItemDto) {
    setActiveView("restaurants");
    setEditingItemId(item.id);
    setMenuForm({
      name: item.name,
      description: item.description,
      categoryId: String(item.categoryId),
      price: String(item.price),
      imageUrl: item.imageUrl,
      isVeg: item.isVeg,
      isAvailable: item.isAvailable,
    });
  }

  function resetItemForm() {
    setEditingItemId(null);
    setMenuForm(emptyMenuForm(String(categories[0]?.id ?? "")));
  }

  async function saveMenuItem(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    const payload = {
      categoryId: Number(menuForm.categoryId),
      name: menuForm.name.trim(),
      description: menuForm.description.trim(),
      price: Number(menuForm.price),
      imageUrl: menuForm.imageUrl.trim(),
      isVeg: menuForm.isVeg,
      isVegan: false,
      isAvailable: menuForm.isAvailable,
    };
    try {
      if (editingItemId)
        await api.updateMenuItem(token, editingItemId, payload);
      else
        await api.createMenuItem(token, {
          ...payload,
          allergens: [],
          variants: [{ label: "Regular", priceDelta: 0 }],
          addons: [],
        });
      resetItemForm();
      await loadAdminData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save product");
    }
  }

  async function toggleItem(item: MenuItemDto) {
    if (!token) return;
    try {
      await api.updateMenuItem(token, item.id, {
        isAvailable: !item.isAvailable,
      });
      setMenuItems((current) =>
        current.map((candidate) =>
          candidate.id === item.id
            ? { ...candidate, isAvailable: !item.isAvailable }
            : candidate,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update product");
    }
  }

  async function updateStatus(order: OrderDto, status: OrderStatus) {
    if (!token) return;
    try {
      await api.updateOrderStatus(token, order.id, status, true);
      setOpenOrderMenu(null);
      await loadAdminData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update order");
    }
  }

  function selectSearchResult(result: { type: string; title: string }) {
    if (result.type === "Product") {
      setActiveView("restaurants");
      setMenuQuery(result.title);
    } else {
      setActiveView("orders");
    }
    setSearch("");
  }

  if (!token)
    return (
      <Login title="Admin Login" onLogin={(nextToken) => setToken(nextToken)} />
    );

  const title =
    navItems.find((item) => item.view === activeView)?.label ?? "Dashboard";

  return (
    <main className="h-screen overflow-hidden bg-[#f7f7f9] font-sans text-[#202020]">
      {error && (
        <div className="fixed left-1/2 top-5 z-50 -translate-x-1/2 rounded-full bg-red-600 px-5 py-3 text-sm font-bold text-white">
          {error}
        </div>
      )}
      <div className="flex h-full w-full overflow-hidden bg-[#f7f7f9]">
        <aside className="hidden h-full w-[220px] shrink-0 overflow-y-auto bg-white lg:block">
          <div className="flex h-[72px] items-center gap-3 border-b border-[#eeeeee] px-5">
            <img
              className="h-12 w-12 shrink-0 rounded-full object-contain"
              src="/images/brand/dairy-don-logo.png"
              alt="Dairy Don"
            />
            <div className="min-w-0">
              <h1 className="text-[18px] font-black leading-5 tracking-tight text-[#202020]">
                Dairy Don
              </h1>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#8d8d8d]">
                Real Ice Cream
              </p>
            </div>
          </div>

          <nav className="space-y-3 px-4 py-5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.view === activeView;
              return (
                <button
                  key={item.label}
                  className={`flex h-[44px] w-full items-center gap-3 rounded-[5px] px-3 text-left text-[13px] font-bold transition ${
                    active
                      ? "bg-[#ff922b] text-white shadow-[0_8px_18px_rgba(255,146,43,0.28)]"
                      : "text-[#9d9d9d] hover:bg-orange-50 hover:text-[#ff922b]"
                  }`}
                  onClick={() => setActiveView(item.view)}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mx-4 mt-14 rounded-[10px] bg-[#ff922b] p-3 text-white">
            <img
              className="h-14 w-14 rounded-full bg-white object-contain p-1"
              src="/images/brand/dairy-don-logo.png"
              alt="Dairy Don"
            />
            <p className="mt-3 text-[13px] font-black">Dairy Don Admin</p>
            <p className="mt-1 text-[10px] font-medium leading-4 text-white/85">
              Manage products, orders, offers, and staff from one dashboard.
            </p>
          </div>
        </aside>

        <section className="min-w-0 flex-1 overflow-y-auto">
          <header className="sticky top-0 z-20 flex h-[64px] items-center justify-between border-b border-[#eeeeee] bg-white px-5">
            <h2 className="text-[18px] font-black">{title}</h2>
            <div className="flex items-center gap-5">
              <div className="relative hidden md:block">
                <input
                  className="h-9 w-[230px] rounded-full border border-[#dddddd] pl-5 pr-10 text-xs font-medium outline-none focus:border-[#ff922b]"
                  placeholder="Search here..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <Search
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b8b8b]"
                  size={18}
                />
                {searchResults.length > 0 && (
                  <div className="absolute right-0 top-11 z-30 w-[310px] overflow-hidden rounded-[10px] bg-white shadow-[0_14px_36px_rgba(0,0,0,0.14)]">
                    {searchResults.map((result) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        className="block w-full border-b border-[#eeeeee] px-4 py-3 text-left last:border-b-0 hover:bg-orange-50"
                        onClick={() => selectSearchResult(result)}
                      >
                        <p className="text-sm font-black">{result.title}</p>
                        <p className="text-xs font-semibold text-[#8d8d8d]">
                          {result.type} / {result.meta}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                className="relative min-h-0"
                onClick={() => setActiveView("orders")}
              >
                <Bell size={20} />
                {orders.some((order) => order.status === "new") && (
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#ff922b]" />
                )}
              </button>
              <button
                className="min-h-0 rounded-full border border-[#eeeeee] p-2 text-[#8d8d8d]"
                onClick={() => loadAdminData()}
              >
                <RefreshCw size={17} />
              </button>
              <div className="flex items-center gap-3">
                <span className="hidden text-sm font-black md:inline">
                  {user?.name || "Thomas Harris"}
                </span>
              </div>
            </div>
          </header>

          <div className="p-4">
            {activeView === "dashboard" && (
              <DashboardView
                salesData={salesData}
                earningCategories={earningCategories}
                totalEarning={totalEarning}
                todayRevenue={todayRevenue}
                todayOrders={todayOrders}
                orderChange={orderChange}
                salesChange={salesChange}
                orders={orders}
                menuItems={menuItems}
                topSpecialties={topSpecialties}
                setActiveView={setActiveView}
              />
            )}

            {activeView === "restaurants" && (
              <RestaurantsView
                categories={categories}
                editingItemId={editingItemId}
                filteredMenu={filteredMenu}
                menuForm={menuForm}
                menuItems={menuItems}
                menuQuery={menuQuery}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                setMenuForm={setMenuForm}
                setMenuQuery={setMenuQuery}
                saveMenuItem={saveMenuItem}
                resetItemForm={resetItemForm}
                editItem={editItem}
                toggleItem={toggleItem}
              />
            )}

            {activeView === "orders" && (
              <OrdersView
                orders={filteredOrders}
                openOrderMenu={openOrderMenu}
                orderSort={orderSort}
                orderStatusFilter={orderStatusFilter}
                setOpenOrderMenu={setOpenOrderMenu}
                setOrderSort={setOrderSort}
                setOrderStatusFilter={setOrderStatusFilter}
                updateStatus={updateStatus}
                menuItems={menuItems}
              />
            )}

            {activeView === "transactions" && (
              <TransactionsView orders={filteredOrders} menuItems={menuItems} />
            )}
            {activeView === "delivery" && (
              <DeliveryView
                orders={orders.filter((order) =>
                  ["new", "preparing", "ready"].includes(order.status),
                )}
              />
            )}
            {activeView === "users" && (
              <UsersView staff={staff} orders={orders} />
            )}
            {activeView === "staff" && (
              <UsersView staff={staff} orders={orders} staffMode />
            )}
            {activeView === "offers" && <OffersView promos={promos} />}
            {activeView === "banners" && <BannersView menuItems={menuItems} />}
          </div>
        </section>
      </div>
    </main>
  );
}

function DashboardView({
  salesData,
  earningCategories,
  totalEarning,
  todayRevenue,
  todayOrders,
  orderChange,
  salesChange,
  orders,
  menuItems,
  topSpecialties,
  setActiveView,
}: {
  salesData: Array<{ month: string; sales: number }>;
  earningCategories: Array<{
    day: string;
    Food: number;
    Drink: number;
    Desert: number;
  }>;
  totalEarning: number;
  todayRevenue: number;
  todayOrders: OrderDto[];
  orderChange: number;
  salesChange: number;
  orders: OrderDto[];
  menuItems: MenuItemDto[];
  topSpecialties: Array<{
    name: string;
    imageUrl: string;
    quantity: number;
    revenue: number;
  }>;
  setActiveView: (view: AdminView) => void;
}) {
  const hasOrders = orders.length > 0;
  const displaySalesData = hasOrders ? salesData : demoSalesData;
  const displayEarningCategories = hasOrders
    ? earningCategories
    : demoEarningCategories;
  const displayTotalEarning = hasOrders ? totalEarning : 425800;
  const displayTodayRevenue = hasOrders ? todayRevenue : 12400;
  const displayOrderCount = hasOrders ? orders.length : 487;
  const displaySalesChange = hasOrders ? salesChange : 18.6;
  const displayOrderChange = hasOrders ? orderChange : 12.4;
  const displayTopSpecialties = topSpecialties.length
    ? topSpecialties
    : demoSpecialties;
  const salesSparkData = hasOrders ? undefined : demoSparkSales;
  const orderSparkData = hasOrders ? undefined : demoSparkOrders;
  const recentOrders = orders.slice(0, 8);
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        <Panel className="p-4">
          <SectionTitle
            title="Sales Figures"
            action={
              <button className="flex min-h-0 items-center gap-1 rounded-[5px] border border-[#dddddd] px-3 py-2 text-xs font-bold">
                Monthly <ChevronDown size={13} />
              </button>
            }
          />
          <div className="h-[255px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={displaySalesData}
                margin={{ top: 14, right: 12, bottom: 0, left: 0 }}
              >
                <CartesianGrid stroke="#e8e8e8" vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#8d8d8d", fontSize: 12, fontWeight: 700 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#8d8d8d", fontSize: 12, fontWeight: 700 }}
                />
                <Tooltip
                  formatter={(value) => compactCurrency(Number(value))}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke={orange}
                  strokeWidth={2.3}
                  dot={{ r: 3, fill: orange, stroke: "white", strokeWidth: 2 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <div className="grid gap-4 xl:grid-cols-[1fr_230px]">
          <Panel className="p-4">
            <SectionTitle
              title="Earning Categories"
              action={
                <button className="flex min-h-0 items-center gap-1 rounded-[5px] border border-[#dddddd] px-3 py-2 text-xs font-bold">
                  Last week <ChevronDown size={13} />
                </button>
              }
            />
            <div className="h-[188px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displayEarningCategories} barCategoryGap={16}>
                  <CartesianGrid stroke="#ececec" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#8d8d8d", fontSize: 12, fontWeight: 700 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#8d8d8d", fontSize: 12, fontWeight: 700 }}
                  />
                  <Tooltip />
                  <Bar dataKey="Food" fill={blue} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Drink" fill={green} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Desert" fill={orange} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 text-xs font-bold">
              <span className="flex items-center gap-2">
                <i className="h-3 w-3 bg-[#3d7ff0]" />
                Food
              </span>
              <span className="flex items-center gap-2">
                <i className="h-3 w-3 bg-[#19c06b]" />
                Drink
              </span>
              <span className="flex items-center gap-2">
                <i className="h-3 w-3 bg-[#ff922b]" />
                Desert
              </span>
            </div>
          </Panel>

          <div className="grid gap-4">
            <SalesCard
              title="Total Sales"
              value={compactCurrency(displayTotalEarning || displayTodayRevenue)}
              change={displaySalesChange}
              positive
              orders={orders}
              metric="sales"
              sparkData={salesSparkData}
            />
            <SalesCard
              title="Total Orders"
              value={displayOrderCount || todayOrders.length}
              change={displayOrderChange}
              positive={false}
              orders={orders}
              metric="orders"
              sparkData={orderSparkData}
            />
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
          <Panel className="p-4">
            <h3 className="text-[17px] font-black">Specialties Sales</h3>
            <div className="mt-4 divide-y divide-[#eeeeee]">
              {displayTopSpecialties.slice(0, 3).map((item, index) => (
                <div
                  key={item.name}
                  className="grid grid-cols-[58px_1fr_82px_150px] items-center gap-4 py-4"
                >
                  <img
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-[#e8cfb9]"
                    src={item.imageUrl}
                    alt={item.name}
                  />
                  <div>
                    <p className="text-xs font-semibold text-[#999]">Food</p>
                    <p className="line-clamp-1 text-sm font-black">
                      {item.name}
                    </p>
                  </div>
                  <span className="rounded-[5px] border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-500">
                    Up 20.8 %
                  </span>
                  <div>
                    <div className="mb-1 flex justify-between text-xs font-semibold text-[#777]">
                      <span>Available</span>
                      <span>{85 - index * 7}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#f1f1f1]">
                      <span
                        className="block h-full bg-[#ff922b]"
                        style={{ width: `${85 - index * 7}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-4">
            <h3 className="text-[17px] font-black">Specialties Sales</h3>
            <div className="mt-7 grid grid-cols-3 gap-4">
              {displayTopSpecialties.slice(0, 3).map((item, index) => (
                <div key={item.name} className="text-center">
                  <div
                    className="mx-auto flex h-[118px] w-[118px] items-center justify-center rounded-full"
                    style={{
                      background: `conic-gradient(${[green, blue, orange][index]} ${280 - index * 42}deg, #ededed 0deg)`,
                    }}
                  >
                    <img
                      className="h-[86px] w-[86px] rounded-full border-[7px] border-white object-cover"
                      src={item.imageUrl}
                      alt={item.name}
                    />
                  </div>
                  <p className="mt-3 line-clamp-1 text-xs font-black">
                    {item.name}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <aside className="space-y-4">
        <section className="overflow-hidden rounded-[7px] bg-[#ff922b] p-4 text-white">
          <div className="grid min-w-0 grid-cols-1 gap-4 min-[1180px]:grid-cols-[minmax(0,1fr)_minmax(150px,180px)]">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white/80">
                Total earning
              </p>
              <div className="mt-2 flex min-w-0 items-start gap-2">
                <span className="shrink-0 text-[26px] font-black leading-none">
                  ₹
                </span>
                <p className="min-w-0 break-words text-[clamp(24px,2.3vw,30px)] font-black leading-none">
                  {Math.round(displayTotalEarning || displayTodayRevenue).toLocaleString(
                    "en-IN",
                  )}
                </p>
              </div>
              <button
                className="mt-10 min-h-0 rounded-[4px] bg-white px-3 py-2 text-xs font-black text-[#ff922b]"
                onClick={() => setActiveView("transactions")}
              >
                View More
              </button>
            </div>
            <div className="min-w-0 rounded-[7px] bg-white p-3 text-center text-[#202020]">
              <p className="text-xs font-black">Total Profit</p>
              <div className="mx-auto mt-3 h-16 w-full max-w-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesSparkData ?? sparkline(orders, "sales")}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={green}
                      strokeWidth={3}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <span className="mt-2 inline-block rounded-[4px] border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-500">
                Up {Math.abs(displaySalesChange).toFixed(1)} %
              </span>
            </div>
          </div>
        </section>
        <LastTransaction
          orders={orders.slice(0, 8)}
          menuItems={menuItems}
          demo={!hasOrders}
        />
      </aside>
    </div>
  );
}

function LastTransaction({
  orders,
  menuItems,
  demo,
}: {
  orders: OrderDto[];
  menuItems: MenuItemDto[];
  demo?: boolean;
}) {
  return (
    <Panel className="p-4">
      <SectionTitle
        title="Last Transaction"
        action={
          <button className="flex min-h-0 items-center gap-1 rounded-[5px] border border-[#dddddd] px-3 py-2 text-xs font-bold">
            Today <ChevronDown size={13} />
          </button>
        }
      />
      <div className="max-h-[360px] space-y-1 overflow-y-auto pr-2">
        {orders.length ? (
          orders.map((order) => {
            const first = order.items[0];
            return (
              <div
                key={order.id}
                className="grid grid-cols-[48px_1fr_auto] items-center gap-3 border-b border-[#eeeeee] py-3"
              >
                <img
                  className="h-11 w-11 rounded-full object-cover ring-2 ring-[#eeeeee]"
                  src={first ? itemImage(first.name, menuItems) : fallbackImage}
                  alt={first?.name ?? "Order"}
                />
                <div className="min-w-0">
                  <p className="line-clamp-1 text-sm font-black">
                    {first?.name ?? "Order request"}
                  </p>
                  <p className="text-xs font-semibold text-[#8d8d8d]">
                    {new Date(order.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <p className="text-sm font-black">
                  {compactCurrency(order.total)}
                </p>
              </div>
            );
          })
        ) : demo ? (
          demoTransactions.map((transaction) => (
            <div
              key={`${transaction.name}-${transaction.time}`}
              className="grid grid-cols-[48px_1fr_auto] items-center gap-3 border-b border-[#eeeeee] py-3"
            >
              <img
                className="h-11 w-11 rounded-full object-cover ring-2 ring-[#eeeeee]"
                src={transaction.imageUrl}
                alt={transaction.name}
              />
              <div className="min-w-0">
                <p className="line-clamp-1 text-sm font-black">
                  {transaction.name}
                </p>
                <p className="text-xs font-semibold text-[#8d8d8d]">
                  {transaction.time}
                </p>
              </div>
              <p className="text-sm font-black">
                {compactCurrency(transaction.total)}
              </p>
            </div>
          ))
        ) : (
          <EmptyState
            title="No transactions yet"
            text="Completed kiosk payments will appear here."
          />
        )}
      </div>
    </Panel>
  );
}

function RestaurantsView({
  categories,
  editingItemId,
  filteredMenu,
  menuForm,
  menuItems,
  menuQuery,
  categoryFilter,
  setCategoryFilter,
  setMenuForm,
  setMenuQuery,
  saveMenuItem,
  resetItemForm,
  editItem,
  toggleItem,
}: {
  categories: CategoryDto[];
  editingItemId: number | null;
  filteredMenu: MenuItemDto[];
  menuForm: MenuFormState;
  menuItems: MenuItemDto[];
  menuQuery: string;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  setMenuForm: (value: MenuFormState) => void;
  setMenuQuery: (value: string) => void;
  saveMenuItem: (event: FormEvent) => void;
  resetItemForm: () => void;
  editItem: (item: MenuItemDto) => void;
  toggleItem: (item: MenuItemDto) => void;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[350px_1fr]">
      <Panel className="p-4">
        <SectionTitle
          title={editingItemId ? "Edit Product" : "Add Product"}
          action={
            editingItemId ? (
              <button
                className="min-h-0 text-[#8d8d8d]"
                onClick={resetItemForm}
              >
                <XCircle size={18} />
              </button>
            ) : null
          }
        />
        <form className="space-y-3" onSubmit={saveMenuItem}>
          <input
            className="h-11 w-full rounded-[6px] border border-[#dddddd] px-3 text-sm font-semibold outline-none focus:border-[#ff922b]"
            placeholder="Product name"
            value={menuForm.name}
            onChange={(event) =>
              setMenuForm({ ...menuForm, name: event.target.value })
            }
            required
          />
          <textarea
            className="min-h-24 w-full rounded-[6px] border border-[#dddddd] p-3 text-sm font-semibold outline-none focus:border-[#ff922b]"
            placeholder="Description"
            value={menuForm.description}
            onChange={(event) =>
              setMenuForm({ ...menuForm, description: event.target.value })
            }
            required
          />
          <select
            className="h-11 w-full rounded-[6px] border border-[#dddddd] px-3 text-sm font-semibold outline-none focus:border-[#ff922b]"
            value={menuForm.categoryId}
            onChange={(event) =>
              setMenuForm({ ...menuForm, categoryId: event.target.value })
            }
            required
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <input
            className="h-11 w-full rounded-[6px] border border-[#dddddd] px-3 text-sm font-semibold outline-none focus:border-[#ff922b]"
            type="number"
            min="1"
            step="0.01"
            placeholder="Price"
            value={menuForm.price}
            onChange={(event) =>
              setMenuForm({ ...menuForm, price: event.target.value })
            }
            required
          />
          <input
            className="h-11 w-full rounded-[6px] border border-[#dddddd] px-3 text-sm font-semibold outline-none focus:border-[#ff922b]"
            placeholder="Image URL"
            value={menuForm.imageUrl}
            onChange={(event) =>
              setMenuForm({ ...menuForm, imageUrl: event.target.value })
            }
            required
          />
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center justify-between rounded-[6px] border border-[#dddddd] px-3 py-2 text-sm font-bold">
              Veg
              <input
                className="h-4 w-4 accent-[#ff922b]"
                type="checkbox"
                checked={menuForm.isVeg}
                onChange={(event) =>
                  setMenuForm({ ...menuForm, isVeg: event.target.checked })
                }
              />
            </label>
            <label className="flex items-center justify-between rounded-[6px] border border-[#dddddd] px-3 py-2 text-sm font-bold">
              Visible
              <input
                className="h-4 w-4 accent-[#ff922b]"
                type="checkbox"
                checked={menuForm.isAvailable}
                onChange={(event) =>
                  setMenuForm({
                    ...menuForm,
                    isAvailable: event.target.checked,
                  })
                }
              />
            </label>
          </div>
          <button className="flex w-full items-center justify-center gap-2 rounded-[6px] bg-[#ff922b] font-black text-white">
            <Save size={17} />
            {editingItemId ? "Save Changes" : "Create Product"}
          </button>
        </form>
      </Panel>

      <Panel className="p-4">
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px_120px]">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8d8d8d]"
              size={17}
            />
            <input
              className="h-11 w-full rounded-full border border-[#dddddd] pl-10 pr-4 text-sm font-semibold outline-none focus:border-[#ff922b]"
              placeholder="Search product..."
              value={menuQuery}
              onChange={(event) => setMenuQuery(event.target.value)}
            />
          </div>
          <select
            className="h-11 rounded-[6px] border border-[#dddddd] px-3 text-sm font-bold outline-none focus:border-[#ff922b]"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <button
            className="flex items-center justify-center gap-2 rounded-[6px] bg-[#ff922b] font-black text-white"
            onClick={resetItemForm}
          >
            <Plus size={17} />
            New
          </button>
        </div>
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <MetricCard label="Products" value={menuItems.length} />
          <MetricCard
            label="Visible"
            value={menuItems.filter((item) => item.isAvailable).length}
          />
          <MetricCard label="Categories" value={categories.length} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] table-fixed text-left">
            <thead className="text-xs font-black uppercase text-[#8d8d8d]">
              <tr>
                <th className="w-[42%] py-3">Product</th>
                <th className="w-[16%]">Category</th>
                <th className="w-[14%]">Price</th>
                <th className="w-[15%]">Status</th>
                <th className="w-[13%] text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredMenu.map((item) => (
                <tr key={item.id} className="border-t border-[#eeeeee]">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <img
                        className="h-11 w-11 rounded-full object-cover"
                        src={item.imageUrl}
                        alt={item.name}
                      />
                      <div>
                        <p className="line-clamp-1 text-sm font-black">
                          {item.name}
                        </p>
                        <p className="line-clamp-1 text-xs font-semibold text-[#8d8d8d]">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="truncate pr-2 text-sm font-bold text-[#8d8d8d]">
                    {item.category?.name ?? "Unassigned"}
                  </td>
                  <td className="truncate pr-2 font-black">
                    {compactCurrency(item.price)}
                  </td>
                  <td>
                    <button
                      className={`flex min-h-0 items-center gap-1 rounded-full border px-2 py-1.5 text-xs font-black ${item.isAvailable ? "border-emerald-100 bg-emerald-50 text-emerald-600" : "border-red-100 bg-red-50 text-red-600"}`}
                      onClick={() => toggleItem(item)}
                    >
                      {item.isAvailable ? (
                        <Eye size={15} />
                      ) : (
                        <EyeOff size={15} />
                      )}
                      {item.isAvailable ? "Visible" : "Hidden"}
                    </button>
                  </td>
                  <td className="text-right">
                    <button
                      className="inline-flex min-h-0 items-center gap-1 rounded-[5px] border border-[#ff922b] px-2 py-1.5 text-xs font-black text-[#ff922b]"
                      onClick={() => editItem(item)}
                    >
                      <Edit3 size={14} />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filteredMenu.length && (
            <EmptyState
              title="No products found"
              text="Create or search for menu items that appear on the customer kiosk."
            />
          )}
        </div>
      </Panel>
    </div>
  );
}

function OrdersView({
  orders,
  orderStatusFilter,
  orderSort,
  openOrderMenu,
  setOrderStatusFilter,
  setOrderSort,
  setOpenOrderMenu,
  updateStatus,
  menuItems,
}: {
  orders: OrderDto[];
  orderStatusFilter: OrderStatus | "all";
  orderSort: SortMode;
  openOrderMenu: number | null;
  setOrderStatusFilter: (value: OrderStatus | "all") => void;
  setOrderSort: (value: SortMode) => void;
  setOpenOrderMenu: (value: number | null) => void;
  updateStatus: (order: OrderDto, status: OrderStatus) => void;
  menuItems: MenuItemDto[];
}) {
  return (
    <Panel className="p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[17px] font-black">Orders</h3>
        <div className="flex gap-2">
          <select
            className="h-10 rounded-[6px] border border-[#dddddd] px-3 text-xs font-black"
            value={orderStatusFilter}
            onChange={(event) =>
              setOrderStatusFilter(event.target.value as OrderStatus | "all")
            }
          >
            <option value="all">All Status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {readableStatus(status)}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-[6px] border border-[#dddddd] px-3 text-xs font-black"
            value={orderSort}
            onChange={(event) => setOrderSort(event.target.value as SortMode)}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="status">By Status</option>
          </select>
        </div>
      </div>
      <div className="grid gap-3">
        {orders.length ? (
          orders.map((order) => {
            const first = order.items[0];
            return (
              <article
                key={order.id}
                className="grid gap-3 rounded-[10px] border border-[#eeeeee] bg-white p-3 md:grid-cols-[56px_1fr_130px_100px_44px] md:items-center"
              >
                <img
                  className="h-12 w-12 rounded-full object-cover"
                  src={first ? itemImage(first.name, menuItems) : fallbackImage}
                  alt={first?.name ?? "Order"}
                />
                <div>
                  <p className="font-black">
                    #{String(order.tokenNumber).padStart(4, "0")} /{" "}
                    {first?.name ?? "Order"}
                  </p>
                  <p className="text-xs font-semibold text-[#8d8d8d]">
                    {new Date(order.createdAt).toLocaleString()} /{" "}
                    {order.orderType}
                  </p>
                </div>
                <p className="font-black">{compactCurrency(order.total)}</p>
                <span
                  className={`w-fit rounded-full border px-3 py-2 text-xs font-black ${statusPill(order.status)}`}
                >
                  {readableStatus(order.status)}
                </span>
                <div className="relative">
                  <button
                    className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-orange-50"
                    onClick={() =>
                      setOpenOrderMenu(
                        openOrderMenu === order.id ? null : order.id,
                      )
                    }
                  >
                    <MoreVertical size={18} />
                  </button>
                  {openOrderMenu === order.id && (
                    <div className="absolute right-0 top-10 z-20 w-40 overflow-hidden rounded-[8px] bg-white shadow-[0_14px_36px_rgba(0,0,0,0.14)]">
                      {statusOptions.map((status) => (
                        <button
                          key={status}
                          className="block w-full px-4 py-3 text-left text-xs font-black hover:bg-orange-50"
                          onClick={() => updateStatus(order, status)}
                        >
                          {readableStatus(status)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <EmptyState
            title="No orders found"
            text="Orders placed from the kiosk will appear here."
          />
        )}
      </div>
    </Panel>
  );
}

function TransactionsView({
  orders,
  menuItems,
}: {
  orders: OrderDto[];
  menuItems: MenuItemDto[];
}) {
  return (
    <Panel className="p-4">
      <SectionTitle
        title="Transactions"
        action={<ArrowUpDown size={18} className="text-[#8d8d8d]" />}
      />
      <LastTransaction orders={orders} menuItems={menuItems} />
    </Panel>
  );
}

function DeliveryView({ orders }: { orders: OrderDto[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {["new", "preparing", "ready"].map((status) => (
        <Panel key={status} className="p-4">
          <h3 className="font-black">{readableStatus(status)}</h3>
          <p className="mt-4 text-4xl font-black text-[#ff922b]">
            {orders.filter((order) => order.status === status).length}
          </p>
          <p className="mt-2 text-xs font-semibold text-[#8d8d8d]">
            Live order queue
          </p>
        </Panel>
      ))}
    </div>
  );
}

function UsersView({
  staff,
  orders,
  staffMode = false,
}: {
  staff: Array<Record<string, unknown>>;
  orders: OrderDto[];
  staffMode?: boolean;
}) {
  return (
    <Panel className="p-4">
      <SectionTitle title={staffMode ? "Staff & Access" : "Users"} />
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <MetricCard label="Staff Accounts" value={staff.length} />
        <MetricCard label="Guest Orders" value={orders.length} />
        <MetricCard
          label="Active Orders"
          value={
            orders.filter((order) =>
              ["new", "preparing", "ready"].includes(order.status),
            ).length
          }
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {staff.map((member) => (
          <article
            key={String(member.id)}
            className="rounded-[10px] border border-[#eeeeee] p-4"
          >
            <p className="font-black">{String(member.name ?? "Staff")}</p>
            <p className="mt-1 text-sm font-semibold text-[#8d8d8d]">
              {String(member.email ?? "")}
            </p>
            <span className="mt-3 inline-block rounded-full bg-orange-50 px-3 py-2 text-xs font-black capitalize text-[#ff922b]">
              {String(member.role ?? "staff")}
            </span>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function OffersView({ promos }: { promos: Array<Record<string, unknown>> }) {
  return (
    <Panel className="p-4">
      <SectionTitle title="Offers & Discounts" />
      {promos.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {promos.map((promo) => (
            <article
              key={String(promo.id)}
              className="rounded-[10px] border border-orange-100 bg-orange-50 p-4"
            >
              <p className="text-2xl font-black text-[#ff922b]">
                {String(promo.code)}
              </p>
              <p className="mt-2 text-sm font-semibold text-[#8d8d8d]">
                {String(promo.discountType)} discount
              </p>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No offers configured"
          text="Create promo codes from the existing promo API when needed."
        />
      )}
    </Panel>
  );
}

function BannersView({ menuItems }: { menuItems: MenuItemDto[] }) {
  return (
    <Panel className="p-4">
      <SectionTitle
        title="Banners & Promotions"
        action={<PackagePlus className="text-[#ff922b]" size={19} />}
      />
      <div className="grid gap-3 md:grid-cols-3">
        {menuItems.slice(0, 3).map((item) => (
          <article
            key={item.id}
            className="overflow-hidden rounded-[10px] border border-[#eeeeee]"
          >
            <img
              className="h-36 w-full object-cover"
              src={item.imageUrl}
              alt={item.name}
            />
            <div className="p-3">
              <p className="line-clamp-1 font-black">{item.name}</p>
              <p className="mt-1 text-xs font-semibold text-[#8d8d8d]">
                Suggested promotion asset
              </p>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[10px] border border-[#eeeeee] bg-white p-4">
      <p className="text-xs font-black uppercase text-[#8d8d8d]">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}
