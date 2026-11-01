import { Schema, model, Types } from "mongoose";

export interface IMessage {
  _id: Types.ObjectId;
  from: Types.ObjectId;
  to: Types.ObjectId;
  text: string;
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    from: { type: Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, maxlength: 2000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
messageSchema.index({ from: 1, to: 1, createdAt: 1 });

export const Message = model<IMessage>("Message", messageSchema);

export interface PublicMessage {
  id: string;
  from: string;
  to: string;
  text: string;
  createdAt: string;
}

export function toPublicMessage(m: IMessage): PublicMessage {
  return {
    id: m._id.toString(),
    from: m.from.toString(),
    to: m.to.toString(),
    text: m.text,
    createdAt: m.createdAt.toISOString(),
  };
}
