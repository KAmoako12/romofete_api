// This file defines the API routes/endpoints for SubCategory-related operations.

import { Router } from "express";
import { createSubCategorySchema, updateSubCategorySchema, subCategoryFiltersSchema } from "./schemas";
import {
  addSubCategory,
  getSubCategoryById,
  listSubCategories,
  updateSubCategory,
  deleteSubCategory,
} from "./services";
import { requireAuthAndRole } from "../_services/authService";
import "../_services/types"; // Import to extend Express Request interface

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     SubCategory:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier for the sub-category
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: Name of the sub-category
 *         product_type_id:
 *           type: integer
 *           description: ID of the parent product type
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the sub-category was created
 *       example:
 *         id: 1
 *         name: "Birthday Bouquets"
 *         product_type_id: 1
 *         created_at: "2023-01-01T00:00:00.000Z"
 * 
 *     CreateSubCategoryRequest:
 *       type: object
 *       required:
 *         - name
 *         - product_type_id
 *       properties:
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: Sub-category name (required, max 100 characters)
 *         product_type_id:
 *           type: integer
 *           minimum: 1
 *           description: ID of the parent product type (required)
 *       example:
 *         name: "Birthday Bouquets"
 *         product_type_id: 1
 * 
 *     UpdateSubCategoryRequest:
 *       type: object
 *       minProperties: 1
 *       properties:
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: Sub-category name (max 100 characters)
 *         product_type_id:
 *           type: integer
 *           minimum: 1
 *           description: ID of the parent product type
 *       example:
 *         name: "Wedding Bouquets"
 * 
 *     DeleteSubCategoryResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message
 *         subCategory:
 *           $ref: '#/components/schemas/SubCategory'
 *       example:
 *         message: "Sub-category deleted"
 *         subCategory:
 *           id: 1
 *           name: "Birthday Bouquets"
 *           product_type_id: 1
 *           created_at: "2023-01-01T00:00:00.000Z"
 */

/**
 * @openapi
 * /sub-categories:
 *   get:
 *     summary: Get all sub-categories with filtering and pagination
 *     description: Retrieves a paginated list of sub-categories with optional filtering and search
 *     tags: [Sub-Categories]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         description: Search term for sub-category name (1-100 characters)
 *       - in: query
 *         name: product_type_id
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Filter by product type ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [name, created_at]
 *           default: created_at
 *         description: Sort field
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Sub-categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SubCategory'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Internal server error
 */
// GET /sub-categories - List sub-categories with filtering and pagination (public endpoint)
router.get("/", async (req, res) => {
  try {
    const { error, value } = subCategoryFiltersSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { page, limit, sort_by, sort_order, ...filters } = value;
    const pagination = { page, limit, sort_by, sort_order };

    const result = await listSubCategories(filters, pagination);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /sub-categories:
 *   post:
 *     summary: Create a new sub-category
 *     description: Creates a new sub-category. Requires admin role.
 *     tags: [Sub-Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSubCategoryRequest'
 *     responses:
 *       201:
 *         description: Sub-category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubCategory'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Product type not found
 *       409:
 *         description: Sub-category with same name exists for this product type
 *       500:
 *         description: Internal server error
 */
// POST /sub-categories - Add sub-category (admin role only)
router.post("/", ...requireAuthAndRole("admin", "superAdmin"), async (req, res) => {
  try {
    const { error, value } = createSubCategorySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const subCategory = await addSubCategory(value);
    res.status(201).json(subCategory);
  } catch (err: any) {
    if (err.message.includes("not found")) {
      return res.status(404).json({ error: err.message });
    }
    if (err.message.includes("already exists")) {
      return res.status(409).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /sub-categories/{id}:
 *   get:
 *     summary: Get sub-category by ID
 *     description: Retrieves a specific sub-category by its ID
 *     tags: [Sub-Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric ID of the sub-category to retrieve
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 1
 *     responses:
 *       200:
 *         description: Sub-category retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubCategory'
 *       400:
 *         description: Invalid sub-category ID
 *       404:
 *         description: Sub-category not found
 *       500:
 *         description: Internal server error
 */
// GET /sub-categories/:id - Get sub-category by id (public endpoint)
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid sub-category id" });
    }
    const subCategory = await getSubCategoryById(id);
    if (!subCategory) {
      return res.status(404).json({ error: "Sub-category not found" });
    }
    res.json(subCategory);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /sub-categories/{id}:
 *   put:
 *     summary: Update sub-category by ID
 *     description: Updates a specific sub-category by its ID. Requires admin role.
 *     tags: [Sub-Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric ID of the sub-category to update
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSubCategoryRequest'
 *     responses:
 *       200:
 *         description: Sub-category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubCategory'
 *       400:
 *         description: Invalid input data or sub-category ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Sub-category or product type not found
 *       409:
 *         description: Sub-category with same name exists for this product type
 *       500:
 *         description: Internal server error
 */
// PUT /sub-categories/:id - Update sub-category (admin role only)
router.put("/:id", ...requireAuthAndRole("admin", "superAdmin"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid sub-category id" });
    }
    
    const { error, value } = updateSubCategorySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const subCategory = await updateSubCategory(id, value);
    res.json(subCategory);
  } catch (err: any) {
    if (err.message.includes("not found")) {
      return res.status(404).json({ error: err.message });
    }
    if (err.message.includes("already exists")) {
      return res.status(409).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /sub-categories/{id}:
 *   delete:
 *     summary: Delete sub-category by ID
 *     description: Deletes a specific sub-category by its ID (soft delete). Sets products' sub_category_id to null. Requires admin role.
 *     tags: [Sub-Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric ID of the sub-category to delete
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 1
 *     responses:
 *       200:
 *         description: Sub-category deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeleteSubCategoryResponse'
 *       400:
 *         description: Invalid sub-category ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Sub-category not found
 *       500:
 *         description: Internal server error
 */
// DELETE /sub-categories/:id - Delete sub-category (admin role only)
router.delete("/:id", ...requireAuthAndRole("admin", "superAdmin"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid sub-category id" });
    }
    const subCategory = await deleteSubCategory(id);
    res.json({ message: "Sub-category deleted", subCategory });
  } catch (err: any) {
    if (err.message === "Sub-category not found") {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

export default router;
