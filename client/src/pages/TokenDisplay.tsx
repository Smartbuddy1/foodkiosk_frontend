import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import type { OrderStatus } from "@food/shared";
import { api, SOCKET_URL } from "../lib/api";

type Token = {
  id: number;
  tokenNumber: number;
  status: OrderStatus;
  updatedAt: string;
};

export default function TokenDisplay() {
  const [tokens, setTokens] = useState<Token[]>([]);

  useEffect(() => {
    api
      .readyTokens()
      .then((response) => setTokens(response.tokens))
      .catch(() => setTokens([]));
    const socket = io(SOCKET_URL, { auth: { publicDisplay: true } });
    socket.on("order:status", (token: Token) => {
      setTokens((current) => {
        if (token.status !== "ready")
          return current.filter((candidate) => candidate.id !== token.id);
        return [
          token,
          ...current.filter((candidate) => candidate.id !== token.id),
        ].slice(0, 12);
      });
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <main className="min-h-screen bg-ink p-6 font-cambria text-white">
      <header className="mb-8 flex items-end justify-between border-b border-white/20 pb-5">
        <div>
          <p className="text-2xl font-bold text-bun">
            Dairy Don The Real Ice Cream
          </p>
          <h1 className="text-6xl font-bold">Ready Orders</h1>
        </div>
        <p className="text-3xl font-bold">
          {new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </header>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {tokens.length ? (
          tokens.map((token) => (
            <article
              key={token.id}
              className="rounded-lg bg-green-700 p-8 text-center shadow-kiosk"
            >
              <p className="text-[120px] font-bold leading-none">
                #{String(token.tokenNumber).padStart(3, "0")}
              </p>
              <p className="mt-2 text-3xl font-bold">Ready</p>
            </article>
          ))
        ) : (
          <div className="col-span-full flex min-h-[55vh] items-center justify-center rounded-lg border border-white/20 bg-white/5">
            <p className="text-5xl font-bold text-white/80">
              Preparing fresh orders
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
