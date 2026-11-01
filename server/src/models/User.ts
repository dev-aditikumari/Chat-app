import { Schema, model, Types } from "mongoose";

export interface IUser {
  _id: Types.ObjectId;
  username: string;
  email: string;
  passwordHash: string;
  isAvatarImageSet: boolean;
  avatarImage: string;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, minlength: 3, maxlength: 30 },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    isAvatarImageSet: { type: Boolean, default: false },
    avatarImage: { type: String, default: "" },
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema);

export interface PublicUser {
  _id: string;
  username: string;
  email: string;
  isAvatarImageSet: boolean;
  avatarImage: string;
}

export function toPublic(u: IUser): PublicUser {
  return {
    _id: u._id.toString(),
    username: u.username,
    email: u.email,
    isAvatarImageSet: u.isAvatarImageSet,
    avatarImage: u.avatarImage,
  };
}
