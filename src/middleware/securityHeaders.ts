import helmet from "helmet";
import type { Request, Response, NextFunction } from "express";

/**
 * Apply Helmet with a strict-but-practical policy for a JSON API.
 * CSP is disabled because the API does not serve HTML.
 */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

/**
 * Additional security headers that Helmet does not set by default
 * for API responses.
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "no-store");
  next();
} 