import { Router } from "express";
import { postOrder, listAllOrders, getOrder, patchOrder } from "../controllers/order.controller";
import { requireAdmin } from "../middleware/adminAuth";

const router = Router();

/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     summary: Place a new order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customer, items]
 *             properties:
 *               customer:
 *                 type: object
 *                 required: [name, phone, address]
 *                 properties:
 *                   name: { type: string, example: Jane Doe }
 *                   phone: { type: string, example: "+14155551234" }
 *                   address: { type: string, example: "123 Main St, Springfield" }
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 50
 *                 items:
 *                   type: object
 *                   required: [productId, quantity]
 *                   properties:
 *                     productId: { type: string }
 *                     quantity: { type: integer, minimum: 1, maximum: 20 }
 *     responses:
 *       201:
 *         description: Order placed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { $ref: "#/components/schemas/Order" }
 *       400:
 *         $ref: "#/components/responses/BadRequest"
 *       409:
 *         description: Product unavailable or insufficient stock
 */
router.post("/", postOrder);

/**
 * @swagger
 * /api/v1/orders:
 *   get:
 *     summary: List all orders (admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items: { $ref: "#/components/schemas/Order" }
 *                     pagination: { $ref: "#/components/schemas/Pagination" }
 *       401:
 *         $ref: "#/components/responses/Unauthorized"
 */
router.get("/", requireAdmin, listAllOrders);

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   get:
 *     summary: Get a single order (admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *       400:
 *         $ref: "#/components/responses/BadRequest"
 *       401:
 *         $ref: "#/components/responses/Unauthorized"
 *       404:
 *         $ref: "#/components/responses/NotFound"
 */
router.get("/:id", requireAdmin, getOrder);

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   patch:
 *     summary: Update order status or payment status (admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, processing, shipped, delivered, cancelled]
 *               paymentStatus:
 *                 type: string
 *                 enum: [unpaid, paid, failed, refunded]
 *     responses:
 *       200:
 *         description: Order updated successfully
 *       400:
 *         $ref: "#/components/responses/BadRequest"
 *       401:
 *         $ref: "#/components/responses/Unauthorized"
 *       404:
 *         $ref: "#/components/responses/NotFound"
 */
router.patch("/:id", requireAdmin, patchOrder);

export default router;