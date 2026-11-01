import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "../errors";

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ status: false, msg: "Route not found" });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({ status: false, msg: err.message });
    return;
  }
  if (err instanceof ZodError) {
    const msg = err.issues.map((i) => i.message).join(", ");
    res.status(400).json({ status: false, msg });
    return;
  }
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ status: false, msg: "Malformed JSON body" });
    return;
  }
  console.error(err);
  res.status(500).json({ status: false, msg: "Internal server error" });
}
