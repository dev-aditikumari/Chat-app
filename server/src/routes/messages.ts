import { Router } from "express";
import type { Config } from "../config";
import { currentUserId, requireAuth } from "../middleware/auth";
import { sendMessageSchema } from "../schemas";
import { createMessage, getConversation } from "../services/messages";
import type { ChatHub } from "../socket/hub";

export function messagesRouter(config: Config, getHub: () => ChatHub | undefined): Router {
  const router = Router();
  router.use(requireAuth(config));

  router.post("/add", async (req, res) => {
    const { to, message } = sendMessageSchema.parse(req.body);
    const saved = await createMessage(currentUserId(req), to, message);
    getHub()?.deliver(saved);
    res.status(201).json({ status: true, message: saved });
  });

  router.get("/:userId", async (req, res) => {
    const messages = await getConversation(currentUserId(req), String(req.params.userId));
    res.json({ status: true, messages });
  });

  return router;
}
