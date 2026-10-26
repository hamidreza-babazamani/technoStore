import express, { type Express } from "express";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { helmetMiddleware, securityHeaders } from "./middleware/securityHeaders";
import { apiRateLimiter } from "./middleware/rateLimit";
import healthRoutes from "./routes/health.routes";
import categoryRoutes from "./routes/category.routes";
import productRoutes from "./routes/product.routes";
import orderRoutes from "./routes/order.routes";
import authRoutes from "./routes/auth.routes";

const createApp = (): Express => {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(helmetMiddleware);
  app.use(securityHeaders);
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Public API is rate limited globally.
  app.use("/api/v1", apiRateLimiter);

  app.use("/api/v1", healthRoutes);
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/categories", categoryRoutes);
  app.use("/api/v1/products", productRoutes);
  app.use("/api/v1/orders", orderRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default createApp;