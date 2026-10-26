import { Router } from "express";
import {
  listCategories,
  listCategoriesAdmin,
  getCategory,
  createCategory,
  updateCategory,
  deactivateCategory,
  activateCategory,
} from "../controllers/category.controller";
import { requireAdmin } from "../middleware/adminAuth";

const router = Router();

/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     summary: List active categories
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *     responses:
 *       200:
 *         description: Active categories retrieved successfully
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
 *                       items: { $ref: "#/components/schemas/Category" }
 *                     pagination: { $ref: "#/components/schemas/Pagination" }
 *       400:
 *         $ref: "#/components/responses/BadRequest"
 */
router.get("/", listCategories);

/**
 * @swagger
 * /api/v1/categories/admin:
 *   get:
 *     summary: List all categories including inactive ones (admin only)
 *     tags: [Categories]
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
 *         description: All categories retrieved successfully
 *       401:
 *         $ref: "#/components/responses/Unauthorized"
 */
router.get("/admin", requireAdmin, listCategoriesAdmin);

/**
 * @swagger
 * /api/v1/categories:
 *   post:
 *     summary: Create a new category (admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, minLength: 2, maxLength: 80 }
 *               description: { type: string, maxLength: 500 }
 *               sortOrder: { type: integer, minimum: 0 }
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         $ref: "#/components/responses/BadRequest"
 *       401:
 *         $ref: "#/components/responses/Unauthorized"
 */
router.post("/", requireAdmin, createCategory);

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   get:
 *     summary: Get a category by id
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *       400:
 *         $ref: "#/components/responses/BadRequest"
 *       404:
 *         $ref: "#/components/responses/NotFound"
 */
router.get("/:id", getCategory);

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   patch:
 *     summary: Update a category (admin only)
 *     tags: [Categories]
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
 *               name: { type: string, minLength: 2, maxLength: 80 }
 *               description: { type: string, maxLength: 500 }
 *               sortOrder: { type: integer, minimum: 0 }
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         $ref: "#/components/responses/BadRequest"
 *       401:
 *         $ref: "#/components/responses/Unauthorized"
 *       404:
 *         $ref: "#/components/responses/NotFound"
 */
router.patch("/:id", requireAdmin, updateCategory);

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   delete:
 *     summary: Deactivate a category (admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Category deactivated
 *       400:
 *         $ref: "#/components/responses/BadRequest"
 *       401:
 *         $ref: "#/components/responses/Unauthorized"
 *       404:
 *         $ref: "#/components/responses/NotFound"
 */
router.delete("/:id", requireAdmin, deactivateCategory);

/**
 * @swagger
 * /api/v1/categories/{id}/activate:
 *   patch:
 *     summary: Activate a category (admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Category activated
 *       400:
 *         $ref: "#/components/responses/BadRequest"
 *       401:
 *         $ref: "#/components/responses/Unauthorized"
 *       404:
 *         $ref: "#/components/responses/NotFound"
 */
router.patch("/:id/activate", requireAdmin, activateCategory);

export default router;