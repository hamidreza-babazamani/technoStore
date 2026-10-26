import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import envConfig from "../config/env";

export const tokenLifetimeSeconds = envConfig.ADMIN_TOKEN_TTL_SECONDS;

export function signAdminToken(username: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      sub: username,
      exp: Math.floor(Date.now() / 1000) + tokenLifetimeSeconds,
    }),
  ).toString("base64url");

  const signature = createHmac("sha256", envConfig.ADMIN_TOKEN_SECRET)
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  const [payload, signature, extra] = token.split(".");

  if (!payload || !signature || extra) {
    res.status(401).json({ success: false, message: "Administrator login required" });
    return;
  }

  const expected = createHmac("sha256", envConfig.ADMIN_TOKEN_SECRET)
    .update(payload)
    .digest();

  let supplied: Buffer;

  try {
    supplied = Buffer.from(signature, "base64url");
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired administrator token" });
    return;
  }

  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    res.status(401).json({ success: false, message: "Invalid or expired administrator token" });
    return;
  }

  try {
    const decoded: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));

    if (
      typeof decoded !== "object" ||
      decoded === null ||
      !("sub" in decoded) ||
      !("exp" in decoded) ||
      decoded.sub !== envConfig.ADMIN_USERNAME ||
      typeof decoded.exp !== "number" ||
      decoded.exp <= Date.now() / 1000
    ) {
      res.status(401).json({ success: false, message: "Invalid or expired administrator token" });
      return;
    }
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired administrator token" });
    return;
  }

  next();
}