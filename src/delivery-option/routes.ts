// This file defines the API routes/endpoints for DeliveryOption-related operations.

import { Router } from "express";
import { createDeliveryOptionSchema, updateDeliveryOptionSchema } from "./schemas";
import {
  addDeliveryOption,
  getDeliveryOptionById,
  listDeliveryOptions,
  updateDeliveryOption,
  deleteDeliveryOption,
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
 *     DeliveryOption:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier for the delivery option
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: Name of the delivery option
 *         amount:
 *           type: string
 *           description: Delivery cost as a string (decimal)
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the delivery option was created
 *       example:
 *         id: 1
 *         name: "Standard Delivery"
 *         amount: "5.99"
 *         created_at: "2023-01-01T00:00:00.000Z"
 *     
 *     CreateDeliveryOptionRequest:
 *       type: object
 *       required:
 *         - name
 *         - amount
 *       properties:
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: Name of the delivery option
 *         amount:
 *           type: number
 *           minimum: 0.01
 *           description: Delivery cost
 *       example:
 *         name: "Express Delivery"
 *         amount: 12.99
 *     
 *     UpdateDeliveryOptionRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: Name of the delivery option
 *         amount:
 *           type: number
 *           minimum: 0.01
 *           description: Delivery cost
 *       example:
 *         name: "Updated Express Delivery"
 *         amount: 15.99
 *     
 *     DeleteDeliveryOptionResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message
 *         deliveryOption:
 *           $ref: '#/components/schemas/DeliveryOption'
 *       example:
 *         message: "Delivery option deleted"
 *         deliveryOption:
 *           id: 1
 *           name: "Standard Delivery"
 *           amount: "5.99"
 *           created_at: "2023-01-01T00:00:00.000Z"
 */

/**
 * @openapi
 * /delivery-options:
 *   get:
 *     summary: Get all delivery options
 *     description: Retrieves a list of all available delivery options
 *     tags: [Delivery Options]
 *     responses:
 *       200:
 *         description: List of delivery options retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DeliveryOption'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Database connection failed"
 */
// GET /delivery-options - List all delivery options (public endpoint)
router.get("/", async (req, res) => {
  try {
    const deliveryOptions = await listDeliveryOptions();
    res.json(deliveryOptions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /delivery-options:
 *   post:
 *     summary: Create a new delivery option
 *     description: Creates a new delivery option. Requires admin role.
 *     tags: [Delivery Options]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDeliveryOptionRequest'
 *     responses:
 *       201:
 *         description: Delivery option created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryOption'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "\"name\" is required"
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
 *       409:
 *         description: Conflict - Delivery option with same name exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Delivery option with this name already exists"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Database connection failed"
 */
// POST /delivery-options - Add delivery option (admin role only)
router.post("/", ...requireAuthAndRole("admin", "superAdmin"), async (req, res) => {
  try {
    const { error, value } = createDeliveryOptionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const deliveryOption = await addDeliveryOption(value);
    res.status(201).json(deliveryOption);
  } catch (err: any) {
    if (err.message.includes("already exists")) {
      return res.status(409).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /delivery-options/{id}:
 *   get:
 *     summary: Get delivery option by ID
 *     description: Retrieves a specific delivery option by its ID
 *     tags: [Delivery Options]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric ID of the delivery option to retrieve
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 1
 *     responses:
 *       200:
 *         description: Delivery option retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryOption'
 *       400:
 *         description: Invalid delivery option ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Invalid delivery option id"
 *       404:
 *         description: Delivery option not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Delivery option not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Database connection failed"
 */
// GET /delivery-options/:id - Get delivery option by id (public endpoint)
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid delivery option id" });
    }
    const deliveryOption = await getDeliveryOptionById(id);
    if (!deliveryOption) {
      return res.status(404).json({ error: "Delivery option not found" });
    }
    res.json(deliveryOption);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /delivery-options/{id}:
 *   put:
 *     summary: Update delivery option by ID
 *     description: Updates a specific delivery option by its ID. Requires admin role.
 *     tags: [Delivery Options]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric ID of the delivery option to update
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateDeliveryOptionRequest'
 *     responses:
 *       200:
 *         description: Delivery option updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryOption'
 *       400:
 *         description: Invalid input data or delivery option ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Invalid delivery option id"
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
 *         description: Delivery option not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Delivery option not found"
 *       409:
 *         description: Conflict - Delivery option with same name exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Delivery option with this name already exists"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Database connection failed"
 */
// PUT /delivery-options/:id - Update delivery option (admin role only)
router.put("/:id", ...requireAuthAndRole("admin", "superAdmin"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid delivery option id" });
    }
    
    const { error, value } = updateDeliveryOptionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const deliveryOption = await updateDeliveryOption(id, value);
    res.json(deliveryOption);
  } catch (err: any) {
    if (err.message === "Delivery option not found") {
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
 * /delivery-options/{id}:
 *   delete:
 *     summary: Delete delivery option by ID
 *     description: Deletes a specific delivery option by its ID. Requires admin role.
 *     tags: [Delivery Options]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric ID of the delivery option to delete
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 1
 *     responses:
 *       200:
 *         description: Delivery option deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeleteDeliveryOptionResponse'
 *       400:
 *         description: Invalid delivery option ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Invalid delivery option id"
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
 *         description: Delivery option not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Delivery option not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Database connection failed"
 */
// DELETE /delivery-options/:id - Delete delivery option (admin role only)
router.delete("/:id", ...requireAuthAndRole("admin", "superAdmin"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid delivery option id" });
    }
    const deliveryOption = await deleteDeliveryOption(id);
    res.json({ message: "Delivery option deleted", deliveryOption });
  } catch (err: any) {
    if (err.message === "Delivery option not found") {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

export default router;
