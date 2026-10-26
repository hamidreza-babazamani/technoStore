import { Router } from "express";
import { getDatabaseStatus } from "../config/database";

const API_VERSION = "1.0.0";

const router = Router();

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API and database are healthy
 *       503:
 *         description: Database is not connected
 */
router.get("/health", (_req, res) => {
  const dbStatus = getDatabaseStatus();
  const healthy = dbStatus.connected;

  res.status(healthy ? 200 : 503).json({
    success: healthy,
    message: healthy
      ? "API is healthy and running"
      : "API is running but the database is unavailable",
    timestamp: new Date().toISOString(),
    version: API_VERSION,
    environment: process.env.NODE_ENV,
    database: {
      connected: dbStatus.connected,
      status: dbStatus.status,
    },
  });
});

export default router;