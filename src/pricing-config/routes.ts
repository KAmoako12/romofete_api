// This file defines the API routes/endpoints for PricingConfig-related operations.

import { Router } from "express";
import { createPricingConfigSchema, updatePricingConfigSchema } from "./schemas";
import {
  addPricingConfig,
  getPricingConfigById,
  listPricingConfigs,
  updatePricingConfig,
  deletePricingConfig,
} from "./services";
import { 
  requireAuthAndRole,
  requireAuthAndUserType 
} from "../_services/authService";
import "../_services/types"; // Import to extend Express Request interface

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     PricingConfig:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier for the pricing config
 *         min_price:
 *           type: string
 *           description: Minimum price as a string (decimal)
 *         max_price:
 *           type: string
 *           nullable: true
 *           description: Maximum price as a string (decimal)
 *         product_type_id:
 *           type: integer
 *           nullable: true
 *           description: Optional product type ID
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the pricing config was created
 *       example:
 *         id: 1
 *         min_price: "0.00"
 *         max_price: "100.00"
 *         product_type_id: 1
 *         created_at: "2023-01-01T00:00:00.000Z"
 *     
 *     CreatePricingConfigRequest:
 *       type: object
 *       properties:
 *         min_price:
 *           type: number
 *           minimum: 0
 *           description: Minimum price (defaults to 0)
 *         max_price:
 *           type: number
 *           minimum: 0
 *           nullable: true
 *           description: Maximum price (optional)
 *         product_type_id:
 *           type: integer
 *           nullable: true
 *           description: Optional product type ID
 *       example:
 *         min_price: 10.00
 *         max_price: 500.00
 *         product_type_id: 1
 *     
 *     UpdatePricingConfigRequest:
 *       type: object
 *       minProperties: 1
 *       properties:
 *         min_price:
 *           type: number
 *           minimum: 0
 *           description: Minimum price
 *         max_price:
 *           type: number
 *           minimum: 0
 *           nullable: true
 *           description: Maximum price
 *         product_type_id:
 *           type: integer
 *           nullable: true
 *           description: Optional product type ID
 *       example:
 *         min_price: 15.00
 *         max_price: 600.00
 *     
 *     DeletePricingConfigResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message
 *         pricingConfig:
 *           $ref: '#/components/schemas/PricingConfig'
 *       example:
 *         message: "Pricing config deleted"
 *         pricingConfig:
 *           id: 1
 *           min_price: "0.00"
 *           max_price: "100.00"
 *           product_type_id: 1
 *           created_at: "2023-01-01T00:00:00.000Z"
 */

/**
 * @openapi
 * /pricing-config:
 *   get:
 *     summary: Get all pricing configs
 *     description: Retrieves a list of all pricing configurations, optionally filtered by product type
 *     tags: [Pricing Config]
 *     parameters:
 *       - in: query
 *         name: product_type_id
 *         required: false
 *         description: Filter by product type ID
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 1
 *     responses:
 *       200:
 *         description: List of pricing configs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PricingConfig'
 *       400:
 *         description: Invalid product_type_id parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Invalid product_type_id"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Database connection failed"
 */
// GET /pricing-config - List all pricing configs (public endpoint)
router.get("/", async (req, res) => {
  try {
    const productTypeId = req.query.product_type_id ? Number(req.query.product_type_id) : undefined;
    
    if (req.query.product_type_id && isNaN(productTypeId as number)) {
      return res.status(400).json({ error: "Invalid product_type_id" });
    }
    
    const pricingConfigs = await listPricingConfigs(productTypeId);
    res.json(pricingConfigs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /pricing-config:
 *   post:
 *     summary: Create a new pricing config
 *     description: Creates a new pricing configuration. Requires admin role.
 *     tags: [Pricing Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePricingConfigRequest'
 *     responses:
 *       201:
 *         description: Pricing config created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PricingConfig'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "\"min_price\" must be greater than or equal to 0"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Access denied. No token provided."
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Access denied. Insufficient role."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Database connection failed"
 */
// POST /pricing-config - Add pricing config (admin role only)
router.post("/", ...requireAuthAndRole("admin", "superAdmin"), async (req, res) => {
  try {
    const { error, value } = createPricingConfigSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const pricingConfig = await addPricingConfig(value);
    res.status(201).json(pricingConfig);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /pricing-config/{id}:
 *   get:
 *     summary: Get pricing config by ID
 *     description: Retrieves a specific pricing configuration by its ID
 *     tags: [Pricing Config]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric ID of the pricing config to retrieve
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 1
 *     responses:
 *       200:
 *         description: Pricing config retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PricingConfig'
 *       400:
 *         description: Invalid pricing config ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Invalid pricing config id"
 *       404:
 *         description: Pricing config not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Pricing config not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Database connection failed"
 */
// GET /pricing-config/:id - Get pricing config by id (public endpoint)
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid pricing config id" });
    }
    const pricingConfig = await getPricingConfigById(id);
    if (!pricingConfig) {
      return res.status(404).json({ error: "Pricing config not found" });
    }
    res.json(pricingConfig);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /pricing-config/{id}:
 *   put:
 *     summary: Update pricing config by ID
 *     description: Updates a specific pricing configuration by its ID. Requires admin role.
 *     tags: [Pricing Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric ID of the pricing config to update
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePricingConfigRequest'
 *     responses:
 *       200:
 *         description: Pricing config updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PricingConfig'
 *       400:
 *         description: Invalid input data or pricing config ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Invalid pricing config id"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Access denied. No token provided."
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Access denied. Insufficient role."
 *       404:
 *         description: Pricing config not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Pricing config not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Database connection failed"
 */
// PUT /pricing-config/:id - Update pricing config (admin role only)
router.put("/:id", ...requireAuthAndRole("admin", "superAdmin"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid pricing config id" });
    }
    
    const { error, value } = updatePricingConfigSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const pricingConfig = await updatePricingConfig(id, value);
    res.json(pricingConfig);
  } catch (err: any) {
    if (err.message === "Pricing config not found") {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /pricing-config/{id}:
 *   delete:
 *     summary: Delete pricing config by ID
 *     description: Deletes a specific pricing configuration by its ID. Requires admin role.
 *     tags: [Pricing Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric ID of the pricing config to delete
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 1
 *     responses:
 *       200:
 *         description: Pricing config deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeletePricingConfigResponse'
 *       400:
 *         description: Invalid pricing config ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Invalid pricing config id"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Access denied. No token provided."
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Access denied. Insufficient role."
 *       404:
 *         description: Pricing config not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Pricing config not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Database connection failed"
 */
// DELETE /pricing-config/:id - Delete pricing config (admin role only)
router.delete("/:id", ...requireAuthAndRole("admin", "superAdmin"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid pricing config id" });
    }
    const pricingConfig = await deletePricingConfig(id);
    res.json({ message: "Pricing config deleted", pricingConfig });
  } catch (err: any) {
    if (err.message === "Pricing config not found") {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

export default router;
