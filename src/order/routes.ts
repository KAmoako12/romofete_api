// This file defines the API routes/endpoints for Order-related operations.

import { Router } from "express";
import { 
  createOrderSchema, 
  updateOrderSchema, 
  orderFiltersSchema,
  orderStatsFiltersSchema
} from "./schemas";
import {
  createOrder,
  getOrderById,
  getOrderByReference,
  listOrders,
  updateOrder,
  cancelOrder,
  getOrdersByUser,
  getOrdersByStatus,
  getOrdersByPaymentStatus,
  getOrderStats
} from "./services";
import { 
  requireAuthAndRole,
  requireAuthAndUserType,
  authenticateToken
} from "../_services/authService";
import "../_services/types"; // Import to extend Express Request interface

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier for the order
 *         user_id:
 *           type: integer
 *           description: ID of the user who placed the order
 *         quantity:
 *           type: integer
 *           description: Total quantity of items in the order
 *         subtotal:
 *           type: string
 *           description: Subtotal amount before delivery cost
 *         delivery_cost:
 *           type: string
 *           description: Delivery cost amount
 *         total_price:
 *           type: string
 *           description: Total order amount including delivery
 *         delivery_option_id:
 *           type: integer
 *           description: ID of selected delivery option
 *         delivery_option_name:
 *           type: string
 *           description: Name of selected delivery option
 *         status:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *           description: Order status
 *         payment_status:
 *           type: string
 *           enum: [pending, processing, completed, failed, refunded]
 *           description: Payment status
 *         payment_reference:
 *           type: string
 *           description: Payment gateway reference
 *         reference:
 *           type: string
 *           description: Unique order reference
 *         delivery_address:
 *           type: string
 *           description: Delivery address
 *         customer_email:
 *           type: string
 *           description: Customer email
 *         customer_phone:
 *           type: string
 *           description: Customer phone number
 *         customer_name:
 *           type: string
 *           description: Customer name
 *         metadata:
 *           type: object
 *           additionalProperties: true
 *           nullable: true
 *           description: Flexible metadata field for storing any client-specific data (e.g., gift messages, special instructions, tracking IDs, campaign information)
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Order creation timestamp
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *       example:
 *         id: 1
 *         user_id: 1
 *         quantity: 3
 *         subtotal: "299.97"
 *         delivery_cost: "15.00"
 *         total_price: "314.97"
 *         delivery_option_id: 1
 *         delivery_option_name: "Express Delivery"
 *         status: "pending"
 *         payment_status: "pending"
 *         reference: "ORD-1234567890-001"
 *         delivery_address: "123 Main St, City"
 *         customer_email: "customer@example.com"
 *         customer_phone: "+1234567890"
 *         customer_name: "John Doe"
 *         metadata:
 *           gift_message: "Happy Birthday!"
 *           source: "mobile_app"
 *         created_at: "2023-01-01T00:00:00.000Z"
 *     
 *     OrderItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         order_id:
 *           type: integer
 *         product_id:
 *           type: integer
 *         product_name:
 *           type: string
 *         product_description:
 *           type: string
 *         product_images:
 *           type: array
 *           items:
 *             type: string
 *         product_type_name:
 *           type: string
 *         quantity:
 *           type: integer
 *         price:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *     
 *     CreateOrderRequest:
 *       type: object
 *       required:
 *         - items
 *       properties:
 *         user_id:
 *           type: integer
 *           description: ID of the user placing the order (optional for guest orders)
 *         items:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: object
 *             required:
 *               - product_id
 *               - quantity
 *             properties:
 *               product_id:
 *                 type: integer
 *                 minimum: 1
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *         delivery_option_id:
 *           type: integer
 *           description: ID of selected delivery option
 *         delivery_address:
 *           type: string
 *           maxLength: 500
 *           description: Delivery address (required for guest orders)
 *         customer_email:
 *           type: string
 *           format: email
 *           description: Customer email address (required for guest orders)
 *         customer_phone:
 *           type: string
 *           maxLength: 20
 *           description: Customer phone number (required for guest orders)
 *         customer_name:
 *           type: string
 *           maxLength: 160
 *           description: Customer full name (required for guest orders)
 *         customer_password:
 *           type: string
 *           minLength: 8
 *           maxLength: 120
 *           description: Password for automatic customer registration (optional)
 *         register_customer:
 *           type: boolean
 *           default: false
 *           description: Whether to automatically register the guest as a customer
 *         metadata:
 *           type: object
 *           additionalProperties: true
 *           nullable: true
 *           description: Flexible metadata field for storing any client-specific data such as gift messages, special instructions, tracking IDs, campaign information, or any custom data your application needs
 *       example:
 *         items:
 *           - product_id: 1
 *             quantity: 2
 *           - product_id: 3
 *             quantity: 1
 *         delivery_option_id: 1
 *         delivery_address: "123 Main St, City, State"
 *         customer_email: "customer@example.com"
 *         customer_phone: "+1234567890"
 *         customer_name: "John Doe"
 *         customer_password: "securepassword123"
 *         register_customer: true
 *         metadata:
 *           gift_message: "Happy Birthday!"
 *           special_instructions: "Please call before delivery"
 *           source: "mobile_app"
 *           campaign_id: "SUMMER2023"
 *     
 *     PaystackInitializeResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             authorization_url:
 *               type: string
 *             access_code:
 *               type: string
 *             reference:
 *               type: string
 */

/**
 * @openapi
 * /orders:
 *   get:
 *     summary: Get all orders with filtering and pagination
 *     description: Retrieves a paginated list of orders with optional filtering. Requires admin role.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *         description: Filter by order status
 *       - in: query
 *         name: payment_status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed, refunded]
 *         description: Filter by payment status
 *       - in: query
 *         name: customer_email
 *         schema:
 *           type: string
 *         description: Filter by customer email
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter orders from this date
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter orders to this date
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [created_at, total_price, status, payment_status]
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
 *         description: Orders retrieved successfully
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
// GET /orders - List orders with filtering and pagination (admin only)
router.get("/", ...requireAuthAndRole("admin", "superAdmin"), async (req, res) => {
  try {
    const { error, value } = orderFiltersSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { page, limit, sort_by, sort_order, ...filters } = value;
    const pagination = { page, limit, sort_by, sort_order };

    // Regular admins can only see orders containing their products
    if (req.user!.role === 'admin') {
      filters.admin_user_id = req.user!.id;
    }

    const result = await listOrders(filters, pagination);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /orders:
 *   post:
 *     summary: Create a new order
 *     description: |
 *       Creates a new order with items and calculates total including delivery cost.
 *       
 *       **For authenticated users:** Only the `items` field is required. User information is taken from the authentication token.
 *       
 *       **For guest orders:** The following fields are required:
 *       - `items` (array of products and quantities)
 *       - `customer_email` (email address)
 *       - `customer_name` (full name)
 *       - `customer_phone` (phone number)
 *       - `delivery_address` (delivery address)
 *       
 *       **Guest customer registration:** 
 *       - If `register_customer` is set to `true`, the guest will be automatically registered as a customer
 *       - If `customer_password` is provided, it will be used for registration; otherwise a random password is generated
 *       - If a customer with the same email already exists, no new registration occurs
 *       
 *       The response will include `customer_registered: true` and `customer_id` if automatic registration occurred.
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderRequest'
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Order'
 *                 - type: object
 *                   properties:
 *                     customer_registered:
 *                       type: boolean
 *                       description: Whether the guest customer was automatically registered
 *                     customer_id:
 *                       type: integer
 *                       description: ID of the registered customer (if applicable)
 *                     paystack_authorization_url:
 *                       type: string
 *                       description: Paystack payment URL (if payment initialization succeeded)
 *                     paystack_access_code:
 *                       type: string
 *                       description: Paystack access code (if payment initialization succeeded)
 *       400:
 *         description: Invalid input data, insufficient stock, or missing required fields for guest orders
 *       404:
 *         description: Product or delivery option not found
 *       500:
 *         description: Internal server error
 */
// POST /orders - Create order (public endpoint for guest orders, or authenticated users)
router.post("/", async (req, res) => {
  try {
    const { error, value } = createOrderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // If user is authenticated, use their user_id
    if (req.user) {
      value.user_id = req.user.id;
    }

    const order = await createOrder(value);
    res.status(201).json(order);
  } catch (err: any) {
    if (err.message.includes("not found") || err.message.includes("Insufficient stock")) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /orders/my-orders:
 *   get:
 *     summary: Get current user's orders
 *     description: Retrieves orders for the authenticated user
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of orders to return
 *     responses:
 *       200:
 *         description: User orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
// GET /orders/my-orders - Get current user's orders (authenticated users only)
router.get("/my-orders", authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const orders = await getOrdersByUser(req.user!.id, Math.min(limit, 50));
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /orders/stats:
 *   get:
 *     summary: Get order statistics
 *     description: Retrieves order and payment statistics. Requires admin role.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_orders:
 *                   type: integer
 *                 pending_payments:
 *                   type: integer
 *                 completed_payments:
 *                   type: integer
 *                 pending_orders:
 *                   type: integer
 *                 processing_orders:
 *                   type: integer
 *                 completed_orders:
 *                   type: integer
 *                 total_revenue:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
// GET /orders/stats - Get order statistics (admin only)
router.get("/stats", ...requireAuthAndRole("admin", "superAdmin"), async (req, res) => {
  try {
    const stats = await getOrderStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /orders/status/{status}:
 *   get:
 *     summary: Get orders by status
 *     description: Retrieves orders with a specific status. Requires admin role.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *         description: Order status to filter by
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of orders to return
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
// GET /orders/status/:status - Get orders by status (admin only)
router.get("/status/:status", ...requireAuthAndRole("admin", "superAdmin"), async (req, res) => {
  try {
    const { status } = req.params;
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid order status" });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const orders = await getOrdersByStatus(status, Math.min(limit, 100));
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /orders/payment-status/{paymentStatus}:
 *   get:
 *     summary: Get orders by payment status
 *     description: Retrieves orders with a specific payment status. Requires admin role.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentStatus
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed, refunded]
 *         description: Payment status to filter by
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of orders to return
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       400:
 *         description: Invalid payment status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
// GET /orders/payment-status/:paymentStatus - Get orders by payment status (admin only)
router.get("/payment-status/:paymentStatus", ...requireAuthAndRole("admin", "superAdmin"), async (req, res) => {
  try {
    const { paymentStatus } = req.params;
    const validStatuses = ['pending', 'processing', 'completed', 'failed', 'refunded'];
    
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({ error: "Invalid payment status" });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const orders = await getOrdersByPaymentStatus(paymentStatus, Math.min(limit, 100));
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /orders/reference/{reference}:
 *   get:
 *     summary: Get order by reference
 *     description: Retrieves an order by its unique reference
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         description: Order reference
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
// GET /orders/reference/:reference - Get order by reference (public endpoint for payment callbacks)
router.get("/reference/:reference", async (req, res) => {
  try {
    const { reference } = req.params;
    const order = await getOrderByReference(reference);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     description: Retrieves a specific order by its ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid order ID
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
// GET /orders/:id - Get order by ID (public endpoint)
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }
    const order = await getOrderById(id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /orders/{id}:
 *   put:
 *     summary: Update order by ID
 *     description: Updates a specific order by its ID. Requires admin role.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 *               payment_status:
 *                 type: string
 *                 enum: [pending, processing, completed, failed, refunded]
 *               payment_reference:
 *                 type: string
 *               delivery_address:
 *                 type: string
 *               metadata:
 *                 type: object
 *                 additionalProperties: true
 *                 nullable: true
 *                 description: Flexible metadata field for storing any client-specific data. You can add new properties to existing metadata or replace it entirely.
 *     responses:
 *       200:
 *         description: Order updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid input data or order ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
// PUT /orders/:id - Update order (admin only)
router.put("/:id", ...requireAuthAndRole("admin", "superAdmin"), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }
    
    const { error, value } = updateOrderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const order = await updateOrder(id, value);
    res.json(order);
  } catch (err: any) {
    if (err.message === "Order not found") {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /orders/{id}/cancel:
 *   patch:
 *     summary: Cancel order
 *     description: Cancels an order and restores product stock if applicable
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid order ID or cannot cancel order
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
// PATCH /orders/:id/cancel - Cancel order (public endpoint, but with restrictions)
router.patch("/:id/cancel", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }
    
    const order = await cancelOrder(id);
    res.json(order);
  } catch (err: any) {
    if (err.message === "Order not found") {
      return res.status(404).json({ error: err.message });
    }
    if (err.message.includes("Cannot cancel") || err.message.includes("already cancelled")) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});


export default router;
