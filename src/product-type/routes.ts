// This file defines the API routes/endpoints for ProductType-related operations.

import { Router } from "express";
import { createProductTypeSchema, updateProductTypeSchema } from "./schemas";
import {
  addProductType,
  getProductTypeById,
  listProductTypes,
  updateProductType,
  deleteProductType,
} from "./services";
import { requireAuthAndRole, requireAuthAndUserType } from "../_services/authService";
import "../_services/types"; // Import to extend Express Request interface

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     ProductType:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier for the product type
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: Name of the product type
 *         allowed_types:
 *           type: array
 *           nullable: true
 *           items:
 *             type: string
 *           description: Optional list of allowed sub-types
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the product type was created
 *       example:
 *         id: 1
 *         name: "Electronics"
 *         allowed_types: ["phones", "laptops"]
 *         created_at: "2023-01-01T00:00:00.000Z"
 * 
 *     CreateProductTypeRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: Name of the product type
 *         allowed_types:
 *           type: array
 *           items:
 *             type: string
 *           description: Optional list of allowed sub-types
 *       example:
 *         name: "Electronics"
 *         allowed_types: ["phones", "laptops"]
 * 
 *     UpdateProductTypeRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: Name of the product type
 *         allowed_types:
 *           type: array
 *           nullable: true
 *           items:
 *             type: string
 *           description: Optional list of allowed sub-types (set null to clear)
 *       example:
 *         name: "Consumer Electronics"
 *         allowed_types: ["audio", "tv"]
 * 
 *     DeleteProductTypeResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message
 *         productType:
 *           $ref: '#/components/schemas/ProductType'
 *       example:
 *         message: "Product type deleted"
 *         productType:
 *           id: 1
 *           name: "Electronics"
 *           allowed_types: ["phones", "laptops"]
 *           created_at: "2023-01-01T00:00:00.000Z"
 */

/**
 * @openapi
 * /product-types:
 *   get:
 *     summary: Get all product types
 *     description: Retrieves a list of all available product types
 *     tags: [Product Types]
 *     responses:
 *       200:
 *         description: List of product types retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProductType'
 *       500:
 *         description: Internal server error
 */
// GET /product-types - List all product types (public endpoint)
router.get("/", async (req, res) => {
  try {
    const productTypes = await listProductTypes();
    res.json(productTypes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /product-types:
 *   post:
 *     summary: Create a new product type
 *     description: Creates a new product type. Requires admin role.
 *     tags: [Product Types]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductTypeRequest'
 *     responses:
 *       201:
 *         description: Product type created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductType'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Product type with same name exists
 *       500:
 *         description: Internal server error
 */
// POST /product-types - Add product type (admin role only)
router.post("/", ...requireAuthAndRole("admin", "superAdmin"), async (req, res) => {
  try {
    const { error, value } = createProductTypeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const productType = await addProductType(value);
    res.status(201).json(productType);
  } catch (err: any) {
    if (err.message.includes("already exists")) {
      return res.status(409).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /product-types/{id}:
 *   get:
 *     summary: Get product type by ID
 *     description: Retrieves a specific product type by its ID
 *     tags: [Product Types]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric ID of the product type to retrieve
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 1
 *     responses:
 *       200:
 *         description: Product type retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductType'
 *       400:
 *         description: Invalid product type ID
 *       404:
 *         description: Product type not found
 *       500:
 *         description: Internal server error
 */
// GET /product-types/:id - Get product type by id (public endpoint)
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid product type id" });
    }
    const productType = await getProductTypeById(id);
    if (!productType) {
      return res.status(404).json({ error: "Product type not found" });
    }
    res.json(productType);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /product-types/{id}:
 *   put:
 *     summary: Update product type by ID
 *     description: Updates a specific product type by its ID. Requires admin role.
 *     tags: [Product Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric ID of the product type to update
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProductTypeRequest'
 *     responses:
 *       200:
 *         description: Product type updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductType'
 *       400:
 *         description: Invalid input data or product type ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Product type not found
 *       409:
 *         description: Product type with same name exists
 *       500:
 *         description: Internal server error
 */
// PUT /product-types/:id - Update product type (admin role only)
router.put("/:id", ...requireAuthAndRole("admin", "superAdmin"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid product type id" });
    }
    
    const { error, value } = updateProductTypeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const productType = await updateProductType(id, value);
    res.json(productType);
  } catch (err: any) {
    if (err.message === "Product type not found") {
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
 * /product-types/{id}:
 *   delete:
 *     summary: Delete product type by ID
 *     description: Deletes a specific product type by its ID (soft delete). Requires admin role.
 *     tags: [Product Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric ID of the product type to delete
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 1
 *     responses:
 *       200:
 *         description: Product type deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeleteProductTypeResponse'
 *       400:
 *         description: Invalid product type ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Product type not found
 *       500:
 *         description: Internal server error
 */
// DELETE /product-types/:id - Delete product type (admin role only)
router.delete("/:id", ...requireAuthAndRole("admin", "superAdmin"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid product type id" });
    }
    const productType = await deleteProductType(id);
    res.json({ message: "Product type deleted", productType });
  } catch (err: any) {
    if (err.message === "Product type not found") {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

export default router;
