import type { Server as HttpServer } from "http";
import { Server, type Socket } from "socket.io";
import { z } from "zod";
import type { Config } from "../config";
import { HttpError } from "../errors";
import type { PublicMessage } from "../models/Message";
import { User } from "../models/User";
import { createMessage } from "../services/messages";
import { verifyToken } from "../services/tokens";

const sendSchema = z.object({ to: z.string(), message: z.string() });

type Ack = (res: { status: boolean; msg?: string; message?: PublicMessage }) => void;

export class ChatHub {
  readonly io: Server;
  private online = new Map<string, Set<string>>();

  constructor(server: HttpServer, private config: Config) {
    this.io = new Server(server, { cors: { origin: config.clientOrigins } });
    this.io.use(async (socket, next) => {
      const token = socket.handshake.auth?.token;
      const payload = typeof token === "string" ? verifyToken(config, token) : null;
      if (!payload) return next(new Error("Authentication required"));
      const exists = await User.exists({ _id: payload.sub }).catch(() => null);
      if (!exists) return next(new Error("Authentication required"));
      socket.data.userId = payload.sub;
      next();
    });
    this.io.on("connection", (socket) => this.onConnection(socket));
  }

  onlineUserIds(): string[] {
    return [...this.online.keys()];
  }

  deliver(message: PublicMessage): void {
    this.io.to(room(message.to)).emit("msg-receive", message);
    this.io.to(room(message.from)).emit("msg-sent", message);
  }

  async close(): Promise<void> {
    await this.io.close();
  }

  private onConnection(socket: Socket): void {
    const userId = socket.data.userId as string;
    socket.join(room(userId));
    const sockets = this.online.get(userId) ?? new Set<string>();
    sockets.add(socket.id);
    this.online.set(userId, sockets);
    this.broadcastPresence();

    socket.on("msg-send", async (payload: unknown, ack?: Ack) => {
      const reply: Ack = typeof ack === "function" ? ack : () => undefined;
      try {
        const { to, message } = sendSchema.parse(payload);
        const saved = await createMessage(userId, to, message);
        this.deliver(saved);
        reply({ status: true, message: saved });
      } catch (err) {
        const msg = err instanceof HttpError ? err.message : "Invalid message payload";
        reply({ status: false, msg });
      }
    });

    socket.on("disconnect", () => {
      const set = this.online.get(userId);
      if (!set) return;
      set.delete(socket.id);
      if (set.size === 0) this.online.delete(userId);
      this.broadcastPresence();
    });
  }

  private broadcastPresence(): void {
    this.io.emit("online-users", this.onlineUserIds());
  }
}

function room(userId: string): string {
  return `user:${userId}`;
}
