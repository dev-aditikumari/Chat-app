import type { NextFunction, Request, Response } from "express";
import type { Config } from "../config";
import { HttpError } from "../errors";
import { verifyToken } from "../services/tokens";

declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
  }
}

export function requireAuth(config: Config) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const header = req.headers.authorization ?? "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      return next(new HttpError(401, "Authentication required"));
    }
    const payload = verifyToken(config, token);
    if (!payload) return next(new HttpError(401, "Invalid or expired token"));
    req.userId = payload.sub;
    next();
  };
}

export function currentUserId(req: Request): string {
  if (!req.userId) throw new HttpError(401, "Authentication required");
  return req.userId;
}
