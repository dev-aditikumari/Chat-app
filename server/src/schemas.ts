import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string({ error: "Username is required" })
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[A-Za-z0-9_.-]+$/, "Username may only contain letters, numbers, dots, dashes and underscores"),
  email: z.string({ error: "Email is required" }).trim().toLowerCase().pipe(z.email("Email is invalid")),
  password: z
    .string({ error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be at most 100 characters"),
});

export const loginSchema = z.object({
  username: z.string({ error: "Username is required" }).trim().min(1, "Username is required"),
  password: z.string({ error: "Password is required" }).min(1, "Password is required"),
});

export const avatarSchema = z.object({
  image: z
    .string({ error: "Avatar image is required" })
    .min(1, "Avatar image is required")
    .max(200_000, "Avatar image is too large")
    .regex(/^[A-Za-z0-9+/=]+$/, "Avatar image must be base64 encoded"),
});

export const sendMessageSchema = z.object({
  to: z.string({ error: "Recipient is required" }),
  message: z.string({ error: "Message is required" }),
});
