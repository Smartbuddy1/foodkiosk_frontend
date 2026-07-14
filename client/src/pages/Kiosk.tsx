import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  CreditCard,
  Minus,
  Plus,
  QrCode,
  Search,
  ShoppingCart,
  Trash2,
  Utensils,
  Banknote,
} from "lucide-react";
import { getTranslation } from "../utils/translations";
import type {
  MenuItemDto,
  OrderDto,
  OrderType,
  PaymentMethod,
} from "@food/shared";
import { api, type OrderInput } from "../lib/api";
import { estimateTotals, formatRupees } from "../lib/format";
import { fallbackCategories, fallbackItems } from "../data/fallbackMenu";
import { useIdleReset } from "../hooks/useIdleReset";

type Step =
  | "welcome"
  | "language"
  | "orderType"
  | "menu"
  | "review"
  | "payment"
  | "placingOrder"
  | "receipt";
type SpiceLevel = "mild" | "medium" | "hot";

type CartLine = {
  lineId: string;
  item: MenuItemDto;
  quantity: number;
  variantId?: number;
  variantLabel?: string;
  variantDelta: number;
  addons: Array<{ id: number; label: string; price: number }>;
  flavor?: string;
  removeIngredients: string[];
  spiceLevel: SpiceLevel;
  specialInstructions?: string;
};

const removeOptions = ["lettuce", "onion", "pickle"];
const dessertFlavors = [
  "Vanilla",
  "Chocolate",
  "Strawberry",
  "Mango",
  "Butterscotch",
  "Pista",
  "Black Currant",
  "Kesar Pista",
];
const upiQrImage =
  import.meta.env.VITE_UPI_QR_IMAGE_URL ??
  "/images/payment/dairy-don-upi-qr.png";
const upiPayeeName =
  import.meta.env.VITE_UPI_PAYEE_NAME ?? "Dairy Don The Real Ice Cream";
const t = (text: string) => getTranslation("English", text);

function makeId() {
  return "line-" + Math.random().toString(16).slice(2) + Date.now();
}

function getLineUnitPrice(line: CartLine) {
  return (
    line.item.price +
    line.variantDelta +
    line.addons.reduce((sum, addon) => sum + addon.price, 0)
  );
}

function cartQuantity(cart: CartLine[]) {
  return cart.reduce((sum, line) => sum + line.quantity, 0);
}

function buildInstructions(line: CartLine) {
  return [line.flavor ? `Flavor: ${line.flavor}` : "", line.specialInstructions]
    .filter(Boolean)
    .join(" | ");
}

function toOrderInput(
  cart: CartLine[],
  orderType: OrderType,
  paymentMethod: PaymentMethod,
  promoCode: string,
): OrderInput {
  return {
    orderType,
    paymentMethod,
    promoCode: promoCode.trim() || undefined,
    items: cart.map((line) => ({
      menuItemId: line.item.id,
      quantity: line.quantity,
      variantId: line.variantId,
      addonIds: line.addons.map((addon) => addon.id),
      removeIngredients: line.removeIngredients,
      spiceLevel: line.spiceLevel,
      specialInstructions: buildInstructions(line) || undefined,
    })),
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(
        () => reject(new Error("Payment timed out. Please retry.")),
        ms,
      );
    }),
  ]);
}

function VegBadge({ isVeg }: { isVeg: boolean }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold text-white ${isVeg ? "bg-leaf" : "bg-ember"}`}
    >
      {isVeg ? "VEG" : "NON-VEG"}
    </span>
  );
}

function TotalsTable({
  totals,
}: {
  totals: {
    subtotal: number;
    tax: number;
    packagingCharge: number;
    discount: number;
    total: number;
  };
}) {
  return (
    <div className="space-y-2 text-lg">
      <div className="flex justify-between">
        <span>Subtotal</span>
        <strong>{formatRupees(totals.subtotal)}</strong>
      </div>
      <div className="flex justify-between">
        <span>Taxes</span>
        <strong>{formatRupees(totals.tax)}</strong>
      </div>
      <div className="flex justify-between">
        <span>Packaging</span>
        <strong>{formatRupees(totals.packagingCharge)}</strong>
      </div>
      <div className="flex justify-between">
        <span>Discount</span>
        <strong>-{formatRupees(totals.discount)}</strong>
      </div>
      <div className="flex justify-between border-t border-amber-200 pt-3 text-2xl">
        <span>{t("Total")}</span>
        <strong>{formatRupees(totals.total)}</strong>
      </div>
    </div>
  );
}

function ItemDetailModal({
  item,
  onClose,
  onAdd,
}: {
  item: MenuItemDto;
  onClose: () => void;
  onAdd: (line: CartLine) => void;
}) {
  const defaultVariant = item.variants[0];
  const [variantId, setVariantId] = useState(defaultVariant?.id);
  const [addonIds, setAddonIds] = useState<number[]>(
    item.addons.filter((addon) => addon.isDefault).map((a) => a.id),
  );
  const [removeIngredients, setRemoveIngredients] = useState<string[]>([]);
  const [spiceLevel, setSpiceLevel] = useState<SpiceLevel>("medium");
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState("");

  const variant = item.variants.find((candidate) => candidate.id === variantId);
  const addons = item.addons.filter((addon) => addonIds.includes(addon.id));
  const unitPrice =
    item.price +
    (variant?.priceDelta ?? 0) +
    addons.reduce((sum, addon) => sum + addon.price, 0);
  const isDessert = item.category?.name.toLowerCase() === "desserts";
  const [flavor, setFlavor] = useState(dessertFlavors[0]);

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/40 p-3 sm:items-center sm:justify-center">
      <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-kiosk">
        <div className="grid gap-4 p-4 sm:grid-cols-[240px_1fr]">
          <img
            className="h-60 w-full rounded-md object-cover"
            src={item.imageUrl}
            alt={item.name}
          />
          <div>
            <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
              <h2 className="text-3xl font-bold">{item.name}</h2>
              <VegBadge isVeg={item.isVeg} />
            </div>
            <p className="text-lg text-steel">{item.description}</p>
            <p className="mt-2 text-sm font-bold text-steel">
              Allergens:{" "}
              {item.allergens?.length ? item.allergens.join(", ") : "None"}
            </p>

            <section className="mt-5">
              <h3 className="mb-2 text-xl font-bold">Size</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {item.variants.map((candidate) => (
                  <button
                    key={candidate.id}
                    className={`rounded-md border px-3 py-3 text-left font-bold ${
                      variantId === candidate.id
                        ? "border-ember bg-red-50"
                        : "border-amber-200 bg-white"
                    }`}
                    onClick={() => setVariantId(candidate.id)}
                  >
                    {candidate.label}
                    <span className="block text-sm text-steel">
                      +{formatRupees(candidate.priceDelta)}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-5">
              <h3 className="mb-2 text-xl font-bold">Add-ons</h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {item.addons.length ? (
                  item.addons.map((addon) => (
                    <button
                      key={addon.id}
                      className={`rounded-md border px-3 py-3 text-left font-bold ${
                        addonIds.includes(addon.id)
                          ? "border-leaf bg-green-50"
                          : "border-amber-200 bg-white"
                      }`}
                      onClick={() =>
                        setAddonIds((current) =>
                          current.includes(addon.id)
                            ? current.filter((id) => id !== addon.id)
                            : [...current, addon.id],
                        )
                      }
                    >
                      {addon.label}
                      <span className="block text-sm text-steel">
                        +{formatRupees(addon.price)}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="rounded-md bg-amber-50 p-3 text-steel">
                    No add-ons available
                  </p>
                )}
              </div>
            </section>

            {!isDessert && (
              <>
                <section className="mt-5">
                  <h3 className="mb-2 text-xl font-bold">Remove</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {removeOptions.map((option) => (
                      <button
                        key={option}
                        className={`rounded-md border px-3 py-3 font-bold capitalize ${
                          removeIngredients.includes(option)
                            ? "border-ember bg-red-50"
                            : "border-amber-200 bg-white"
                        }`}
                        onClick={() =>
                          setRemoveIngredients((current) =>
                            current.includes(option)
                              ? current.filter(
                                  (ingredient) => ingredient !== option,
                                )
                              : [...current, option],
                          )
                        }
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="mt-5">
                  <h3 className="mb-2 text-xl font-bold">Spice</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {(["mild", "medium", "hot"] as SpiceLevel[]).map(
                      (level) => (
                        <button
                          key={level}
                          className={`rounded-md border px-3 py-3 font-bold capitalize ${
                            spiceLevel === level
                              ? "border-ember bg-red-50"
                              : "border-amber-200 bg-white"
                          }`}
                          onClick={() => setSpiceLevel(level)}
                        >
                          {level}
                        </button>
                      ),
                    )}
                  </div>
                </section>
              </>
            )}

            {isDessert && (
              <section className="mt-5">
                <h3 className="mb-2 text-xl font-bold">Flavor</h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {dessertFlavors.map((option) => (
                    <button
                      key={option}
                      className={`rounded-md border px-3 py-3 font-bold ${
                        flavor === option
                          ? "border-ember bg-red-50"
                          : "border-amber-200 bg-white"
                      }`}
                      onClick={() => setFlavor(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <textarea
              className="mt-5 min-h-24 w-full rounded-md border border-amber-200 p-3 outline-none focus:border-ember"
              placeholder="Special instructions"
              value={specialInstructions}
              onChange={(event) => setSpecialInstructions(event.target.value)}
              maxLength={160}
            />
          </div>
        </div>

        <div className="sticky bottom-0 flex flex-col gap-3 border-t border-amber-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <button
              className="rounded-md border border-amber-200 px-4"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Minus size={22} />
            </button>
            <span className="w-12 text-center text-2xl font-bold">
              {quantity}
            </span>
            <button
              className="rounded-md border border-amber-200 px-4"
              onClick={() => setQuantity(quantity + 1)}
            >
              <Plus size={22} />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              className="rounded-md border border-amber-200 px-5 font-bold"
              onClick={onClose}
            >
              Close
            </button>
            <button
              className="rounded-md bg-ember px-5 font-bold text-white"
              onClick={() => {
                onAdd({
                  lineId: makeId(),
                  item,
                  quantity,
                  variantId,
                  variantLabel: variant?.label,
                  variantDelta: variant?.priceDelta ?? 0,
                  addons,
                  flavor: isDessert ? flavor : undefined,
                  removeIngredients: isDessert ? [] : removeIngredients,
                  spiceLevel: isDessert ? "medium" : spiceLevel,
                  specialInstructions: specialInstructions.trim() || undefined,
                });
                onClose();
              }}
            >
              Add {formatRupees(unitPrice * quantity)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartDrawer({
  open,
  cart,
  onClose,
  onQuantity,
  onRemove,
  onInstructions,
  onReview,
}: {
  open: boolean;
  cart: CartLine[];
  onClose: () => void;
  onQuantity: (lineId: string, quantity: number) => void;
  onRemove: (lineId: string) => void;
  onInstructions: (lineId: string, value: string) => void;
  onReview: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/40">
      <aside className="h-full w-full max-w-xl overflow-y-auto bg-white p-4 shadow-kiosk">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-3xl font-bold">{t("Cart")}</h2>
          <button
            className="rounded-md border border-amber-200 px-5 font-bold"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="space-y-3">
          {cart.map((line) => (
            <article
              key={line.lineId}
              className="rounded-lg border border-amber-200 p-3"
            >
              <div className="flex gap-3">
                <img
                  className="h-24 w-24 rounded-md object-cover"
                  src={line.item.imageUrl}
                  alt={line.item.name}
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-bold">{line.item.name}</h3>
                  <p className="text-sm text-steel">
                    {line.variantLabel ?? "Regular"}{" "}
                    {line.addons.length
                      ? `+ ${line.addons.map((a) => a.label).join(", ")}`
                      : ""}
                  </p>
                  {line.flavor && (
                    <p className="text-sm font-bold text-ember">
                      Flavor: {line.flavor}
                    </p>
                  )}
                  <p className="font-bold">
                    {formatRupees(getLineUnitPrice(line) * line.quantity)}
                  </p>
                </div>
                <button
                  className="rounded-md border border-red-200 px-3 text-red-700"
                  onClick={() => onRemove(line.lineId)}
                >
                  <Trash2 size={20} />
                </button>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  className="rounded-md border border-amber-200 px-4"
                  onClick={() =>
                    onQuantity(line.lineId, Math.max(1, line.quantity - 1))
                  }
                >
                  <Minus size={20} />
                </button>
                <span className="w-10 text-center text-xl font-bold">
                  {line.quantity}
                </span>
                <button
                  className="rounded-md border border-amber-200 px-4"
                  onClick={() => onQuantity(line.lineId, line.quantity + 1)}
                >
                  <Plus size={20} />
                </button>
              </div>

              <textarea
                className="mt-3 min-h-20 w-full rounded-md border border-amber-200 p-3 outline-none focus:border-ember"
                placeholder="Special instructions"
                value={line.specialInstructions ?? ""}
                onChange={(event) =>
                  onInstructions(line.lineId, event.target.value)
                }
                maxLength={160}
              />
            </article>
          ))}
        </div>

        <button
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-ink px-5 py-3 text-xl font-bold text-white disabled:opacity-50"
          disabled={!cart.length}
          onClick={onReview}
        >
          <Check size={24} />
          Review Order
        </button>
      </aside>
    </div>
  );
}

export default function Kiosk() {
  const [step, setStep] = useState<Step>("welcome");
  const [language, setLanguage] = useState("English");
  const t = (text: string) => getTranslation(language, text);
  const [orderType, setOrderType] = useState<OrderType>("dine_in");
  const [categories, setCategories] = useState(fallbackCategories);
  const [items, setItems] = useState(fallbackItems);
  const [activeCategory, setActiveCategory] = useState<number | "all">("all");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItemDto | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [paymentError, setPaymentError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<OrderDto | null>(null);
  const [receiptCountdown, setReceiptCountdown] = useState(15);
  const [toast, setToast] = useState("");

  const reset = useCallback(() => {
    setStep("welcome");
    setOrderType("dine_in");
    setCart([]);
    setSearch("");
    setCartOpen(false);
    setPromoCode("");
    setPaymentError("");
    setProcessing(false);
    setCreatedOrder(null);
    setReceiptCountdown(15);
  }, []);

  useIdleReset(step !== "welcome" && step !== "receipt", 60_000, reset);

  useEffect(() => {
    api
      .categories()
      .then((response) =>
        setCategories(
          response.categories.length ? response.categories : fallbackCategories,
        ),
      )
      .catch(() => setCategories(fallbackCategories));
    api
      .items()
      .then((response) =>
        setItems(response.items.length ? response.items : fallbackItems),
      )
      .catch(() => setItems(fallbackItems));
  }, []);

  useEffect(() => {
    if (step !== "receipt" || !createdOrder) return;
    setReceiptCountdown(15);
    api
      .printReceipt(createdOrder.id)
      .catch(() => setToast("Printer offline. Receipt queued."));
    const timer = window.setInterval(() => {
      setReceiptCountdown((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          reset();
          return 15;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [createdOrder, reset, step]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const categoryMatch =
        activeCategory === "all" || item.categoryId === activeCategory;
      const query = search.trim().toLowerCase();
      const searchMatch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category?.name.toLowerCase().includes(query);
      return categoryMatch && searchMatch;
    });
  }, [activeCategory, items, search]);

  const totals = useMemo(
    () =>
      estimateTotals(
        cart.map((line) => ({
          item: line.item,
          quantity: line.quantity,
          unitPrice: getLineUnitPrice(line),
        })),
        orderType,
        promoCode,
      ),
    [cart, orderType, promoCode],
  );

  function addLine(line: CartLine) {
    setCart((current) => [...current, line]);
    setToast("Added to cart");
  }

  function updateQuantity(lineId: string, quantity: number) {
    setCart((current) =>
      current.map((line) =>
        line.lineId === lineId ? { ...line, quantity } : line,
      ),
    );
  }

  function updateInstructions(lineId: string, value: string) {
    setCart((current) =>
      current.map((line) =>
        line.lineId === lineId ? { ...line, specialInstructions: value } : line,
      ),
    );
  }

  async function confirmPayment() {
    setProcessing(true);
    setPaymentError("");
    try {
      const payload = toOrderInput(cart, orderType, paymentMethod, promoCode);
      const response =
        paymentMethod === "cash"
          ? await withTimeout(api.cashOrder(payload), 15_000)
          : await withTimeout(api.placeOrder(payload), 15_000);
      setCreatedOrder(response.order);
      setStep("placingOrder");
      window.setTimeout(() => setStep("receipt"), 2600);
    } catch (error) {
      setPaymentError(
        error instanceof Error ? error.message : "Payment failed",
      );
    } finally {
      setProcessing(false);
    }
  }

  return (
    <main className="min-h-screen bg-cream font-cambria text-ink">
      {toast && (
        <div className="fixed left-1/2 top-5 z-50 -translate-x-1/2 rounded-md bg-ink px-5 py-3 text-white shadow-kiosk">
          {toast}
        </div>
      )}

      {step === "welcome" && (
        <section className="page-transition relative flex min-h-screen items-center justify-center overflow-hidden bg-ink text-white">
          <img
            className="absolute inset-0 h-full w-full object-cover opacity-55"
            src="/images/photos/sundae-photo.jpg"
            alt="Dairy Don Sundae"
          />
          <div className="relative mx-auto w-full max-w-4xl px-6 text-center">
            <img
              className="mx-auto mb-6 h-36 w-full max-w-[420px] object-contain drop-shadow-[0_20px_38px_rgba(0,0,0,0.5)] sm:mb-8 sm:h-44 sm:max-w-[560px]"
              src="/images/brand/dairy-don-logo.png"
              alt="Dairy Don"
            />
            <h1 className="dairy-don-hero-title mx-auto max-w-5xl text-5xl leading-[0.92] sm:text-7xl md:text-[96px]">
              Dairy Don The Real Ice Cream
            </h1>
            <button
              className="mt-8 rounded-md bg-bun px-8 py-4 text-2xl sm:mt-12 sm:px-12 sm:py-5 sm:text-3xl font-bold text-ink shadow-kiosk"
              onClick={() => setStep("language")}
            >
              {t("Tap to Start")}
            </button>
          </div>
        </section>
      )}

      {step === "language" && (
        <section className="page-transition mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-5">
          <h1 className="mb-6 text-4xl font-bold sm:mb-8 sm:text-6xl">
            {t("Select Language")}
          </h1>
          <div className="grid gap-4 sm:grid-cols-2">
            {["English", "Hindi"].map((option) => (
              <button
                key={option}
                className="rounded-lg border border-amber-200 bg-white p-5 text-2xl sm:p-8 sm:text-4xl font-bold shadow-kiosk"
                onClick={() => {
                  setLanguage(option);
                  setStep("orderType");
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </section>
      )}

      {step === "orderType" && (
        <section className="page-transition mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-5 py-8">
          <button
            className="mb-6 flex w-fit items-center gap-2 rounded-md border border-amber-200 bg-white px-4 py-2 font-bold sm:px-5"
            onClick={() => setStep("language")}
          >
            <ChevronLeft size={22} />
            {t("Back")}
          </button>
          <p className="text-lg font-bold text-steel sm:text-xl">{language}</p>
          <h1 className="mb-6 text-4xl font-bold sm:mb-8 sm:text-6xl">
            {t("Choose Order Type")}
          </h1>
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              className="rounded-lg bg-white p-6 sm:p-8 text-left shadow-kiosk"
              onClick={() => {
                setOrderType("dine_in");
                setStep("menu");
              }}
            >
              <Utensils className="mb-3 sm:mb-5 text-ember" size={40} />
              <span className="block text-2xl sm:text-4xl font-bold">
                {t("Dine In")}
              </span>
            </button>
            <button
              className="rounded-lg bg-white p-6 sm:p-8 text-left shadow-kiosk"
              onClick={() => {
                setOrderType("takeaway");
                setStep("menu");
              }}
            >
              <ShoppingCart className="mb-3 sm:mb-5 text-ember" size={40} />
              <span className="block text-2xl sm:text-4xl font-bold">
                {t("Takeaway")}
              </span>
            </button>
          </div>
        </section>
      )}

      {step === "menu" && (
        <section className="page-transition pb-28">
          <header className="sticky top-0 z-20 border-b border-amber-200 bg-cream/95 px-4 py-4 backdrop-blur">
            <div className="mx-auto flex max-w-7xl flex-col gap-4">
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-base font-bold text-steel sm:text-lg">
                    {orderType === "dine_in" ? "Dine In" : "Takeaway"}
                  </p>
                  <h1 className="text-3xl font-bold sm:text-4xl">
                    {t("Menu")}
                  </h1>
                </div>
                <div className="relative w-full sm:max-w-md">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-steel"
                    size={20}
                  />
                  <input
                    className="h-12 w-full rounded-md border border-amber-200 bg-white pl-12 pr-4 text-base sm:h-14 sm:text-lg outline-none focus:border-ember"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={t("Search")}
                  />
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-soft">
                <button
                  className={`shrink-0 rounded-md px-5 font-bold ${activeCategory === "all" ? "bg-ink text-white" : "bg-white text-ink"}`}
                  onClick={() => setActiveCategory("all")}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    className={`shrink-0 rounded-md px-5 font-bold ${activeCategory === category.id ? "bg-ink text-white" : "bg-white text-ink"}`}
                    onClick={() => setActiveCategory(category.id)}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </header>

          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <article
                key={item.id}
                className={`overflow-hidden rounded-lg border bg-white shadow-sm ${item.isAvailable ? "border-amber-200" : "border-slate-200 opacity-55 grayscale"}`}
              >
                <img
                  className="h-52 w-full object-cover"
                  src={item.imageUrl}
                  alt={item.name}
                />
                <div className="p-4">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <h2 className="text-xl sm:text-2xl font-bold">
                      {item.name}
                    </h2>
                    <VegBadge isVeg={item.isVeg} />
                  </div>
                  <p className="min-h-12 text-sm sm:text-base text-steel">
                    {item.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <strong className="text-xl sm:text-2xl">
                      {formatRupees(item.price)}
                    </strong>
                    <button
                      className="flex items-center gap-1 sm:gap-2 rounded-md bg-ember px-4 py-2 sm:px-5 font-bold text-white disabled:bg-slate-400"
                      disabled={!item.isAvailable}
                      onClick={() => setSelectedItem(item)}
                    >
                      <Plus size={20} />
                      {item.isAvailable ? t("Add") : t("Out")}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-amber-200 bg-white p-4 shadow-kiosk">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-lg sm:text-xl font-bold">
                {cartQuantity(cart)} {t("items")}{" "}
                <span className="text-steel">|</span>{" "}
                {formatRupees(totals.total)}
              </div>
              <div className="flex gap-2">
                <button
                  className="flex-1 rounded-md border border-amber-200 px-4 py-2 sm:flex-none sm:px-5 font-bold"
                  onClick={() => setStep("orderType")}
                >
                  {t("Back")}
                </button>
                <button
                  className="flex flex-1 items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 sm:flex-none sm:px-5 font-bold text-white"
                  onClick={() => setCartOpen(true)}
                >
                  <ShoppingCart size={20} />
                  {t("Cart")}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {step === "review" && (
        <section className="page-transition mx-auto min-h-screen max-w-5xl px-4 sm:px-5 py-6 sm:py-8">
          <button
            className="mb-4 sm:mb-6 flex w-fit items-center gap-2 rounded-md border border-amber-200 bg-white px-4 py-2 sm:px-5 font-bold"
            onClick={() => setStep("menu")}
          >
            <ChevronLeft size={20} />
            {t("Menu")}
          </button>
          <h1 className="mb-4 sm:mb-6 text-3xl sm:text-5xl font-bold">
            {t("Order Review")}
          </h1>
          <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
            <div className="space-y-3">
              {cart.map((line) => (
                <article
                  key={line.lineId}
                  className="rounded-lg border border-amber-200 bg-white p-4"
                >
                  <div className="flex justify-between gap-4">
                    <div>
                      <h2 className="text-lg sm:text-2xl font-bold">
                        {line.item.name}
                      </h2>
                      <p className="text-sm sm:text-base text-steel">
                        {line.quantity} x {line.variantLabel ?? "Regular"}
                      </p>
                      {line.addons.length > 0 && (
                        <p className="text-sm sm:text-base text-steel">
                          {line.addons.map((a) => a.label).join(", ")}
                        </p>
                      )}
                      {line.flavor && (
                        <p className="text-sm sm:text-base font-bold text-ember">
                          Flavor: {line.flavor}
                        </p>
                      )}
                      {line.removeIngredients.length > 0 && (
                        <p className="text-sm sm:text-base text-steel">
                          {t("Remove")} {line.removeIngredients.join(", ")}
                        </p>
                      )}
                    </div>
                    <strong className="text-lg sm:text-2xl">
                      {formatRupees(getLineUnitPrice(line) * line.quantity)}
                    </strong>
                  </div>
                </article>
              ))}
            </div>
            <aside className="rounded-lg border border-amber-200 bg-white p-5">
              <label className="mb-2 block text-lg font-bold" htmlFor="promo">
                Coupon
              </label>
              <input
                id="promo"
                className="mb-4 h-14 w-full rounded-md border border-amber-200 px-4 outline-none focus:border-ember"
                value={promoCode}
                onChange={(event) =>
                  setPromoCode(event.target.value.toUpperCase())
                }
                placeholder="WELCOME10"
              />
              <TotalsTable totals={totals} />
              <button
                className="mt-6 w-full rounded-md bg-ember px-5 py-3 text-xl font-bold text-white"
                onClick={() => setStep("payment")}
              >
                Continue to Payment
              </button>
            </aside>
          </div>
        </section>
      )}

      {step === "payment" && (
        <section className="page-transition mx-auto min-h-screen max-w-6xl px-4 sm:px-5 py-6 sm:py-8">
          <button
            className="mb-4 sm:mb-6 flex w-fit items-center gap-2 rounded-md border border-amber-200 bg-white px-4 py-2 sm:px-5 font-bold"
            onClick={() => setStep("review")}
          >
            <ChevronLeft size={20} />
            {t("Review")}
          </button>
          <h1 className="mb-4 sm:mb-6 text-3xl sm:text-5xl font-bold">
            {t("Payment")}
          </h1>
          <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { id: "card", label: t("Card"), icon: CreditCard },
                { id: "upi", label: t("UPI"), icon: QrCode },
                { id: "cash", label: t("Cash"), icon: Banknote },
              ].map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    className={`rounded-lg border p-6 text-left shadow-sm ${
                      paymentMethod === option.id
                        ? "border-ember bg-red-50"
                        : "border-amber-200 bg-white"
                    }`}
                    onClick={() => setPaymentMethod(option.id as PaymentMethod)}
                  >
                    <Icon className="mb-2 sm:mb-4 text-ember" size={36} />
                    <span className="text-2xl sm:text-3xl font-bold">
                      {option.label}
                    </span>
                  </button>
                );
              })}
              {paymentMethod === "upi" && (
                <div className="col-span-full flex flex-col items-center rounded-lg border border-amber-200 bg-white p-6 text-center">
                  <div className="rounded-lg border border-amber-100 bg-white p-3 shadow-inner">
                    <img
                      className="h-64 w-64 object-contain"
                      src={upiQrImage}
                      alt={`UPI QR code for ${upiPayeeName}`}
                    />
                  </div>
                  <p className="mt-4 text-lg font-bold">{upiPayeeName}</p>
                  <p className="text-sm font-bold text-steel">
                    Scan and pay {formatRupees(totals.total)}
                  </p>
                </div>
              )}
            </div>
            <aside className="rounded-lg border border-amber-200 bg-white p-5">
              <h2 className="mb-4 text-3xl font-bold">{t("Summary")}</h2>
              <TotalsTable totals={totals} />
              {paymentError && (
                <p className="mt-4 rounded-md bg-red-50 p-3 text-red-700">
                  {paymentError}
                </p>
              )}
              <button
                className="mt-6 flex w-full items-center justify-center gap-3 rounded-md bg-ink px-5 py-3 text-xl font-bold text-white disabled:opacity-60"
                onClick={confirmPayment}
                disabled={processing}
              >
                {processing && (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                {processing
                  ? t("Processing")
                  : `${t("Pay")} ${formatRupees(totals.total)}`}
              </button>
            </aside>
          </div>
        </section>
      )}

      {step === "placingOrder" && createdOrder && (
        <section className="page-transition mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-4 py-8 text-center">
          <div className="relative mb-8 flex h-56 w-56 items-center justify-center rounded-full bg-white shadow-kiosk">
            <div className="payment-success-ring absolute inset-5 rounded-full border-4 border-amber-100" />
            <div className="payment-success-check flex h-28 w-28 items-center justify-center rounded-full bg-leaf text-white shadow-lg">
              <Check size={58} strokeWidth={4} />
            </div>
            <span className="food-bubble food-bubble-one" />
            <span className="food-bubble food-bubble-two" />
            <span className="food-bubble food-bubble-three" />
          </div>
          <p className="text-xl font-bold text-steel">Payment received</p>
          <h1 className="mt-2 text-4xl font-bold sm:text-6xl">
            Placing your order
          </h1>
          <p className="mt-4 max-w-xl text-xl text-steel">
            Sending it to the kitchen. Your token is almost ready.
          </p>
          <div className="mt-8 flex w-full max-w-md items-center gap-2">
            <span className="order-progress-dot" />
            <span className="order-progress-dot order-progress-dot-delay-1" />
            <span className="order-progress-dot order-progress-dot-delay-2" />
          </div>
        </section>
      )}

      {step === "receipt" && createdOrder && (
        <section className="page-transition mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-4 sm:px-5 py-8 text-center">
          <p className="text-xl sm:text-2xl font-bold text-steel">
            {t("Order Token")}
          </p>
          <h1 className="text-[80px] sm:text-[120px] font-bold leading-none text-ember">
            #{String(createdOrder.tokenNumber).padStart(3, "0")}
          </h1>
          <div className="mt-5 w-full max-w-2xl rounded-lg border border-amber-200 bg-white p-4 sm:p-5 text-left">
            {createdOrder.items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between border-b border-amber-100 py-2 text-base sm:text-lg last:border-b-0"
              >
                <span>
                  {item.quantity} x {item.name}
                </span>
                <strong>{formatRupees(item.quantity * item.unitPrice)}</strong>
              </div>
            ))}
            <div className="mt-4 flex justify-between text-2xl font-bold">
              <span>{t("Total")}</span>
              <span>{formatRupees(createdOrder.total)}</span>
            </div>
          </div>
          <p className="mt-6 text-3xl font-bold">
            {t("Estimated wait time: 8-12 minutes")}
          </p>
          <p className="mt-2 text-2xl text-steel">
            Thank you. Made fresh, served fast.
          </p>
          <p className="mt-6 rounded-full bg-white px-5 py-3 text-xl font-bold text-steel">
            Returning home in {receiptCountdown}s
          </p>
        </section>
      )}

      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAdd={addLine}
        />
      )}
      <CartDrawer
        open={cartOpen}
        cart={cart}
        onClose={() => setCartOpen(false)}
        onQuantity={updateQuantity}
        onRemove={(lineId) =>
          setCart((current) => current.filter((line) => line.lineId !== lineId))
        }
        onInstructions={updateInstructions}
        onReview={() => {
          setCartOpen(false);
          if (cart.length) setStep("review");
        }}
      />
    </main>
  );
}
