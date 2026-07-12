import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { KDS_ROLES, type OrderDto } from "@food/shared";
import { corsOrigin } from "./cors.js";
import { verifyAccessToken } from "../middleware/auth.js";
import { updateOrderStatus } from "../services/orderService.js";
import { logger } from "../utils/logger.js";

let io: Server | null = null;

function publicStatus(order: OrderDto) {
  return {
    id: order.id,
    tokenNumber: order.tokenNumber,
    status: order.status,
    updatedAt: order.updatedAt,
  };
}

export function initSocket(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: corsOrigin,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    if (socket.handshake.auth?.publicDisplay === true) {
      socket.data.publicDisplay = true;
      return next();
    }

    const token = socket.handshake.auth?.token;
    if (!token || typeof token !== "string")
      return next(new Error("Missing token"));

    try {
      const user = verifyAccessToken(token);
      socket.data.user = user;
      return next();
    } catch {
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    if (socket.data.publicDisplay) {
      socket.join("ready-display");
      return;
    }

    const user = socket.data.user as Express.User | undefined;
    if (!user || !KDS_ROLES.includes(user.role)) {
      socket.disconnect(true);
      return;
    }

    socket.join("kds");
    socket.on("order:ready", async (payload: { orderId: number }) => {
      try {
        const order = await updateOrderStatus(
          Number(payload.orderId),
          user.restaurantId!,
          "ready",
          user,
        );
        broadcastOrderStatus(order);
      } catch (error) {
        socket.emit("error:toast", {
          message:
            error instanceof Error
              ? error.message
              : "Unable to mark order ready",
        });
      }
    });
  });

  logger.info("Socket.io initialized");
  return io;
}

export function broadcastNewOrder(order: OrderDto) {
  io?.to("kds").emit("order:new", order);
  io?.to("ready-display").emit("order:status", publicStatus(order));
}

export function broadcastOrderStatus(order: OrderDto) {
  io?.to("kds").emit("order:status", order);
  io?.to("ready-display").emit("order:status", publicStatus(order));
}
