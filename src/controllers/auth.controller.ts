import { promisify } from "node:util";
import { scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import { signAdminToken, tokenLifetimeSeconds } from "../middleware/adminAuth";
import envConfig from "../config/env";

const scrypt = promisify(scryptCallback);

export async function adminLogin(req: Request, res: Response): Promise<void> {
  const body: unknown = req.body;

  if (
    typeof body !== "object" ||
    body === null ||
    !("username" in body) ||
    !("password" in body) ||
    typeof body.username !== "string" ||
    typeof body.password !== "string"
  ) {
    res.status(400).json({ success: false, message: "Username and password are required" });
    return;
  }

  const [scheme, salt, expectedText] = envConfig.ADMIN_PASSWORD_HASH.split("$");

  if (scheme !== "scrypt" || !salt || !expectedText) {
    res.status(503).json({ success: false, message: "Administrator password hash is not configured correctly" });
    return;
  }

  let expected: Buffer;

  try {
    expected = Buffer.from(expectedText, "base64url");
  } catch {
    res.status(503).json({ success: false, message: "Administrator password hash is not configured correctly" });
    return;
  }

  const actual = (await scrypt(body.password, Buffer.from(salt, "base64url"), expected.length)) as Buffer;

  if (
    body.username !== envConfig.ADMIN_USERNAME ||
    actual.length !== expected.length ||
    !timingSafeEqual(actual, expected)
  ) {
    res.status(401).json({ success: false, message: "Incorrect username or password" });
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      token: signAdminToken(envConfig.ADMIN_USERNAME),
      expiresIn: tokenLifetimeSeconds,
    },
  });
}