import { isValidObjectId } from "mongoose";
import { HttpError } from "../errors";
import { Message, toPublicMessage, type PublicMessage } from "../models/Message";
import { User } from "../models/User";

export async function createMessage(from: string, to: string, text: string): Promise<PublicMessage> {
  if (!isValidObjectId(to)) throw new HttpError(400, "Invalid recipient id");
  if (to === from) throw new HttpError(400, "You cannot message yourself");
  const trimmed = text.trim();
  if (!trimmed) throw new HttpError(400, "Message cannot be empty");
  if (trimmed.length > 2000) throw new HttpError(400, "Message is too long (max 2000 characters)");
  const recipient = await User.exists({ _id: to });
  if (!recipient) throw new HttpError(404, "Recipient not found");
  const doc = await Message.create({ from, to, text: trimmed });
  return toPublicMessage(doc);
}

export async function getConversation(me: string, other: string): Promise<PublicMessage[]> {
  if (!isValidObjectId(other)) throw new HttpError(400, "Invalid user id");
  const docs = await Message.find({
    $or: [
      { from: me, to: other },
      { from: other, to: me },
    ],
  }).sort({ createdAt: 1, _id: 1 });
  return docs.map(toPublicMessage);
}
