import swaggerJsdoc from "swagger-jsdoc";
import envConfig from "./env";

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "E-Commerce API",
      version: "1.0.0",
      description:
        "REST API for the online store. Includes authentication, categories, products, orders, and health checks.",
    },
    servers: [
      {
        url: `http://localhost:${envConfig.PORT}`,
        description: "Local server",
      },
    ],
    tags: [
      { name: "Health", description: "Service health checks" },
      { name: "Auth", description: "Administrator authentication" },
      { name: "Categories", description: "Store category management" },
      { name: "Products", description: "Product catalog management" },
      { name: "Orders", description: "Customer order management" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Administrator token obtained from POST /api/v1/auth/login",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Error message",
            },
          },
        },
        HealthResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string" },
            timestamp: { type: "string", format: "date-time" },
            version: { type: "string", example: "1.0.0" },
            environment: { type: "string", example: "development" },
            database: {
              type: "object",
              properties: {
                connected: { type: "boolean", example: true },
                status: { type: "string", example: "connected" },
              },
            },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            page: { type: "integer", example: 1 },
            limit: { type: "integer", example: 20 },
            total: { type: "integer", example: 42 },
            totalPages: { type: "integer", example: 3 },
          },
        },
        Category: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string", example: "Mobile Phones" },
            slug: { type: "string", example: "mobile-phones" },
            description: { type: "string" },
            isActive: { type: "boolean" },
            sortOrder: { type: "integer" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        ProductMedia: {
          type: "object",
          properties: {
            url: { type: "string" },
            type: { type: "string", enum: ["image", "video"] },
            alt: { type: "string" },
            sortOrder: { type: "integer" },
          },
        },
        Product: {
          type: "object",
          properties: {
            _id: { type: "string" },
            title: { type: "string" },
            slug: { type: "string" },
            description: { type: "string" },
            price: { type: "integer" },
            category: {
              oneOf: [
                { type: "string" },
                { $ref: "#/components/schemas/Category" },
              ],
            },
            stock: { type: "integer" },
            media: {
              type: "array",
              items: { $ref: "#/components/schemas/ProductMedia" },
            },
            isActive: { type: "boolean" },
            isFeatured: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        OrderItem: {
          type: "object",
          properties: {
            product: { type: "string" },
            title: { type: "string" },
            unitPrice: { type: "integer" },
            quantity: { type: "integer" },
            lineTotal: { type: "integer" },
          },
        },
        Order: {
          type: "object",
          properties: {
            _id: { type: "string" },
            orderNumber: { type: "string" },
            customer: {
              type: "object",
              properties: {
                name: { type: "string" },
                phone: { type: "string" },
                address: { type: "string" },
              },
            },
            items: {
              type: "array",
              items: { $ref: "#/components/schemas/OrderItem" },
            },
            total: { type: "integer" },
            status: {
              type: "string",
              enum: [
                "pending",
                "confirmed",
                "processing",
                "shipped",
                "delivered",
                "cancelled",
              ],
            },
            paymentStatus: {
              type: "string",
              enum: ["unpaid", "paid", "failed", "refunded"],
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: "Administrator login required",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        NotFound: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        BadRequest: {
          description: "Invalid input",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        TooManyRequests: {
          description: "Rate limit exceeded",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.ts", "./dist/src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

export default swaggerSpec;