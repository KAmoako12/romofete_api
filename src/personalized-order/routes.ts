// This file defines the API routes/endpoints for Personalized Orders operations.

import { Router } from "express";
import {
  createPersonalizedOrderSchema,
  updatePersonalizedOrderSchema,
  personalizedOrderFiltersSchema
} from "./schemas";
import {
  createPersonalizedOrder,
  getPersonalizedOrderById,
  getAllPersonalizedOrders,
  updatePersonalizedOrder,
  deletePersonalizedOrder
} from "./services";
import { requireAuthAndUserType } from "../_services/authService";

const router = Router();

/**
 * @openapi
 * /personalized-orders:
 *   post:
 *     summary: Create a new personalized order
 *     description: Creates a new personalized order and sends notification email to admin
 *     tags: [Personalized Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - custom_message
 *               - product_type
 *             properties:
 *               custom_message:
 *                 type: string
 *                 description: Custom message for the order
 *               selected_colors:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of selected colors (optional)
 *               product_type:
 *                 type: string
 *                 description: Type of product being ordered
 *               metadata:
 *                 type: object
 *                 description: Additional metadata (optional)
 *               amount:
 *                 type: number
 *                 format: float
 *                 description: Order amount (optional)
 *             example:
 *               custom_message: "Please add my company logo"
 *               selected_colors: ["red", "blue", "white"]
 *               product_type: "Custom T-Shirt"
 *               metadata: { size: "XL", quantity: 50 }
 *               amount: 750.00
 *     responses:
 *       201:
 *         description: Personalized order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 custom_message:
 *                   type: string
 *                 selected_colors:
 *                   type: array
 *                   items:
 *                     type: string
 *                 product_type:
 *                   type: string
 *                 metadata:
 *                   type: object
 *                 amount:
 *                   type: string
 *                 order_status:
 *                   type: string
 *                 delivery_status:
 *                   type: string
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Internal server error
 */
// POST /personalized-orders - Create a new personalized order (public)
router.post("/personalized-orders", async (req, res) => {
  try {
    const { error, value } = createPersonalizedOrderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const order = await createPersonalizedOrder(value);
    res.status(201).json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /personalized-orders:
 *   get:
 *     summary: Get all personalized orders
 *     description: Retrieves all personalized orders with pagination and filtering. Admin access required.
 *     tags: [Personalized Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: order_status
 *         schema:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *         description: Filter by order status
 *       - in: query
 *         name: delivery_status
 *         schema:
 *           type: string
 *           enum: [pending, in_transit, delivered, failed]
 *         description: Filter by delivery status
 *       - in: query
 *         name: product_type
 *         schema:
 *           type: string
 *         description: Filter by product type
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter orders created after this date
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter orders created before this date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
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
 *           enum: [created_at, amount, order_status, delivery_status]
 *           default: created_at
 *         description: Field to sort by
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of personalized orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
// GET /personalized-orders - Get all personalized orders (admin only)
router.get("/personalized-orders", ...requireAuthAndUserType("admin"), async (req, res) => {
  try {
    const { error, value } = personalizedOrderFiltersSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const result = await getAllPersonalizedOrders(value);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /personalized-orders/{id}:
 *   get:
 *     summary: Get a personalized order by ID
 *     description: Retrieves a single personalized order by its ID. Admin access required.
 *     tags: [Personalized Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Personalized order ID
 *     responses:
 *       200:
 *         description: Personalized order retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 custom_message:
 *                   type: string
 *                 selected_colors:
 *                   type: array
 *                   items:
 *                     type: string
 *                 product_type:
 *                   type: string
 *                 metadata:
 *                   type: object
 *                 amount:
 *                   type: string
 *                 order_status:
 *                   type: string
 *                 delivery_status:
 *                   type: string
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Personalized order not found
 *       500:
 *         description: Internal server error
 */
// GET /personalized-orders/:id - Get a personalized order by ID (admin only)
router.get("/personalized-orders/:id", ...requireAuthAndUserType("admin"), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }
    const order = await getPersonalizedOrderById(id);
    res.json(order);
  } catch (err: any) {
    if (err.message === 'Personalized order not found') {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /personalized-orders/{id}:
 *   put:
 *     summary: Update a personalized order
 *     description: Updates a personalized order by its ID. Admin access required.
 *     tags: [Personalized Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Personalized order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               custom_message:
 *                 type: string
 *                 description: Custom message for the order
 *               selected_colors:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of selected colors
 *               product_type:
 *                 type: string
 *                 description: Type of product being ordered
 *               metadata:
 *                 type: object
 *                 description: Additional metadata
 *               amount:
 *                 type: number
 *                 format: float
 *                 description: Order amount
 *               order_status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 *                 description: Order status
 *               delivery_status:
 *                 type: string
 *                 enum: [pending, in_transit, delivered, failed]
 *                 description: Delivery status
 *             example:
 *               order_status: "processing"
 *               delivery_status: "pending"
 *     responses:
 *       200:
 *         description: Personalized order updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 custom_message:
 *                   type: string
 *                 selected_colors:
 *                   type: array
 *                   items:
 *                     type: string
 *                 product_type:
 *                   type: string
 *                 metadata:
 *                   type: object
 *                 amount:
 *                   type: string
 *                 order_status:
 *                   type: string
 *                 delivery_status:
 *                   type: string
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Personalized order not found
 *       500:
 *         description: Internal server error
 */
// PUT /personalized-orders/:id - Update a personalized order (admin only)
router.put("/personalized-orders/:id", ...requireAuthAndUserType("admin"), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }
    const { error, value } = updatePersonalizedOrderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const order = await updatePersonalizedOrder(id, value);
    res.json(order);
  } catch (err: any) {
    if (err.message === 'Personalized order not found') {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /personalized-orders/{id}:
 *   delete:
 *     summary: Delete a personalized order
 *     description: Soft deletes a personalized order by its ID. Admin access required.
 *     tags: [Personalized Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Personalized order ID
 *     responses:
 *       200:
 *         description: Personalized order deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "Personalized order deleted successfully"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Personalized order not found
 *       500:
 *         description: Internal server error
 */
// DELETE /personalized-orders/:id - Delete a personalized order (admin only)
router.delete("/personalized-orders/:id", ...requireAuthAndUserType("admin"), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }
    const result = await deletePersonalizedOrder(id);
    res.json(result);
  } catch (err: any) {
    if (err.message === 'Personalized order not found') {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

export default router;
