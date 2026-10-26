import { Router } from "express";
import {
  listProducts,
  getProduct,
  postProduct,
  patchProduct,
  deleteProduct,
} from "../controllers/product.controller";
import { requireAdmin } from "../middleware/adminAuth";

const router = Router();

/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     summary: List active products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 12 }
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Full-text search query
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: Category ObjectId
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest, price_asc, price_desc]
 *     responses:
 *       200:
 *         description: Products retrieved successfully
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
 *                       items: { $ref: "#/components/schemas/Product" }
 *                     pagination: { $ref: "#/components/schemas/Pagination" }
 *       400:
 *         description: Invalid pagination, category, or sort
 */
router.get("/", listProducts);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   get:
 *     summary: Get a single product by id
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: "#/components/schemas/Product" }
 *       400:
 *         description: Invalid product id
 *       404:
 *         description: Product not found
 */
router.get("/:id", getProduct);

/**
 * @swagger
 * /api/v1/products:
 *   post:
 *     summary: Create a product (admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, price, category]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               price: { type: integer, minimum: 0 }
 *               category: { type: string }
 *               stock: { type: integer, minimum: 0 }
 *               media:
 *                 type: array
 *                 items: { $ref: "#/components/schemas/ProductMedia" }
 *               isFeatured: { type: boolean }
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         $ref: "#/components/responses/Unauthorized"
 *       409:
 *         description: Slug conflict
 */
router.post("/", requireAdmin, postProduct);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   patch:
 *     summary: Update a product (admin only)
 *     tags: [Products]
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
 *               title: { type: string }
 *               description: { type: string }
 *               price: { type: integer, minimum: 0 }
 *               category: { type: string }
 *               stock: { type: integer, minimum: 0 }
 *               media:
 *                 type: array
 *                 items: { $ref: "#/components/schemas/ProductMedia" }
 *               isFeatured: { type: boolean }
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         $ref: "#/components/responses/Unauthorized"
 *       404:
 *         $ref: "#/components/responses/NotFound"
 */
router.patch("/:id", requireAdmin, patchProduct);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   delete:
 *     summary: Deactivate a product (admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product deactivated
 *       400:
 *         description: Invalid product id
 *       401:
 *         $ref: "#/components/responses/Unauthorized"
 *       404:
 *         $ref: "#/components/responses/NotFound"
 */
router.delete("/:id", requireAdmin, deleteProduct);

export default router;