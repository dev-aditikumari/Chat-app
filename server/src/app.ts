import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import type { Config } from "./config";
import { errorHandler, notFound } from "./middleware/error";
import { authRouter } from "./routes/auth";
import { messagesRouter } from "./routes/messages";
import type { ChatHub } from "./socket/hub";

export function createApp(config: Config, getHub: () => ChatHub | undefined = () => undefined): Express {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: config.clientOrigins }));
  app.use(express.json({ limit: "300kb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: true, uptime: process.uptime() });
  });
  app.use("/api/auth", authRouter(config));
  app.use("/api/messages", messagesRouter(config, getHub));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
