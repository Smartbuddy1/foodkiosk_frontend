import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, LogOut, RefreshCw, Utensils } from "lucide-react";
import { io } from "socket.io-client";
import type { OrderDto, OrderStatus } from "@food/shared";
import Login from "./Login";
import { api, clearAuth, getStoredToken, getStoredUser, SOCKET_URL } from "../lib/api";
import { elapsedMinutes, formatRupees, statusTone, urgencyClass } from "../lib/format";

const stations = ["All", "Grill", "Fry", "Assembly", "Drinks"] as const;

function nextStatus(status: OrderStatus): OrderStatus | null {
  if (status === "new") return "preparing";
  if (status === "preparing") return "ready";
  if (status === "ready") return "collected";
  return null;
}

function labelFor(status: OrderStatus) {
  if (status === "new") return "Start";
  if (status === "preparing") return "Ready";
  if (status === "ready") return "Collected";
  return "Done";
}

function playAlert() {
  const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
  if (!AudioContext) return;
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.frequency.value = 880;
  gain.gain.value = 0.08;
  oscillator.start();
  oscillator.stop(context.currentTime + 0.16);
}

export default function Kds() {
  const [token, setToken] = useState(getStoredToken());
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [station, setStation] = useState<(typeof stations)[number]>("All");
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const user = getStoredUser();

  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 15_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!token) return;
    api
      .adminOrders(token, "?active=true")
      .then((response) => setOrders(response.orders))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load orders"));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const socket = io(SOCKET_URL, { auth: { token } });
    socket.on("order:new", (order: OrderDto) => {
      setOrders((current) => [order, ...current.filter((candidate) => candidate.id !== order.id)]);
      playAlert();
    });
    socket.on("order:status", (order: OrderDto) => {
      setOrders((current) => {
        if (["collected", "cancelled"].includes(order.status)) {
          return current.filter((candidate) => candidate.id !== order.id);
        }
        return [order, ...current.filter((candidate) => candidate.id !== order.id)];
      });
    });
    socket.on("error:toast", (payload: { message: string }) => setError(payload.message));
    return () => {
      socket.disconnect();
    };
  }, [token]);

  const filteredOrders = useMemo(() => {
    void tick;
    if (station === "All") return orders;
    return orders.filter((order) => order.items.some((item) => item.station === station));
  }, [orders, station, tick]);

  const readyOrders = orders.filter((order) => order.status === "ready");

  async function moveOrder(order: OrderDto) {
    if (!token) return;
    const next = nextStatus(order.status);
    if (!next) return;
    try {
      const response = await api.updateOrderStatus(token, order.id, next);
      setOrders((current) => {
        if (["collected", "cancelled"].includes(response.order.status)) {
          return current.filter((candidate) => candidate.id !== response.order.id);
        }
        return [response.order, ...current.filter((candidate) => candidate.id !== response.order.id)];
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update order");
    }
  }

  if (!token) {
    return <Login title="Kitchen Login" onLogin={(nextToken) => setToken(nextToken)} />;
  }

  return (
    <main className="min-h-screen bg-cream p-4 font-cambria text-ink">
      {error && (
        <div className="fixed left-1/2 top-4 z-30 -translate-x-1/2 rounded-md bg-red-700 px-5 py-3 text-white shadow-kiosk">
          {error}
        </div>
      )}

      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ember text-white">
            <Utensils size={28} />
          </div>
          <div>
            <p className="text-sm font-bold uppercase text-steel">{user?.name ?? "Kitchen"}</p>
            <h1 className="text-4xl font-bold">Kitchen Display</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="flex items-center gap-2 rounded-md border border-amber-200 bg-white px-4 font-bold"
            onClick={() => token && api.adminOrders(token, "?active=true").then((response) => setOrders(response.orders))}
          >
            <RefreshCw size={20} />
            Refresh
          </button>
          <button
            className="flex items-center gap-2 rounded-md bg-ink px-4 font-bold text-white"
            onClick={() => {
              clearAuth();
              setToken(null);
            }}
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </header>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {stations.map((candidate) => (
          <button
            key={candidate}
            className={`shrink-0 rounded-md px-5 font-bold ${station === candidate ? "bg-ink text-white" : "bg-white text-ink"}`}
            onClick={() => setStation(candidate)}
          >
            {candidate}
          </button>
        ))}
      </div>

      <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filteredOrders.map((order) => {
            const next = nextStatus(order.status);
            return (
              <article key={order.id} className={`rounded-lg border-4 p-4 shadow-sm ${urgencyClass(order.createdAt)}`}>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold uppercase text-steel">{order.orderType === "dine_in" ? "Dine In" : "Takeaway"}</p>
                    <h2 className="text-5xl font-bold">#{String(order.tokenNumber).padStart(3, "0")}</h2>
                  </div>
                  <span className={`rounded-full px-3 py-2 text-sm font-bold ${statusTone(order.status)}`}>{order.status}</span>
                </div>

                <div className="mb-3 flex items-center gap-2 text-lg font-bold text-steel">
                  <Clock size={20} />
                  {elapsedMinutes(order.createdAt)} min
                </div>

                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="rounded-md bg-white/80 p-3">
                      <div className="flex justify-between gap-3 text-xl font-bold">
                        <span>
                          {item.quantity} x {item.name}
                        </span>
                        <span>{item.station}</span>
                      </div>
                      <p className="text-steel">
                        {item.variant ?? "Regular"}
                        {item.customisations.addons?.length ? ` + ${item.customisations.addons.join(", ")}` : ""}
                      </p>
                      {item.customisations.removeIngredients?.length ? (
                        <p className="text-steel">Remove {item.customisations.removeIngredients.join(", ")}</p>
                      ) : null}
                      {item.customisations.specialInstructions ? (
                        <p className="font-bold text-ember">{item.customisations.specialInstructions}</p>
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <strong className="text-xl">{formatRupees(order.total)}</strong>
                  {next && (
                    <button className="flex items-center gap-2 rounded-md bg-ember px-5 font-bold text-white" onClick={() => moveOrder(order)}>
                      <CheckCircle2 size={22} />
                      {labelFor(order.status)}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <aside className="rounded-lg border border-amber-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-3xl font-bold">Ready Queue</h2>
          <div className="space-y-3">
            {readyOrders.length ? (
              readyOrders.map((order) => (
                <div key={order.id} className="rounded-lg bg-green-700 p-4 text-center text-white">
                  <p className="text-[120px] font-bold leading-none">#{String(order.tokenNumber).padStart(3, "0")}</p>
                </div>
              ))
            ) : (
              <p className="rounded-md bg-amber-50 p-4 text-xl font-bold text-steel">No ready orders</p>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
