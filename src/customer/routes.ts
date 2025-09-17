// This file defines the API routes/endpoints for Customer-related operations.

import { Router } from "express";
import { createCustomerSchema, updateCustomerSchema, loginCustomerSchema } from "./schemas";
import {
  registerCustomer,
  getCustomerById,
  listCustomers,
  updateCustomer,
  deleteCustomer,
  loginCustomer,
} from "./services";
import { 
  authenticateToken, 
  requireRole, 
  requireUserType, 
  requireAuthAndRole, 
  requireAuthAndUserType,
  requireAuthRoleAndUserType 
} from "../_services/authService";
import "../_services/types"; // Import to extend Express Request interface

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Customer:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier for the customer
 *         first_name:
 *           type: string
 *           maxLength: 80
 *           description: First name of the customer
 *         last_name:
 *           type: string
 *           maxLength: 80
 *           description: Last name of the customer
 *         phone:
 *           type: string
 *           maxLength: 20
 *           description: Phone number of the customer
 *         address:
 *           type: string
 *           maxLength: 255
 *           description: Address of the customer
 *         city:
 *           type: string
 *           maxLength: 80
 *           description: City of the customer
 *         state:
 *           type: string
 *           maxLength: 80
 *           description: State of the customer
 *         zip_code:
 *           type: string
 *           maxLength: 20
 *           description: Zip code of the customer
 *         country:
 *           type: string
 *           maxLength: 80
 *           description: Country of the customer
 *         email:
 *           type: string
 *           format: email
 *           maxLength: 120
 *           description: Email address of the customer
 *         is_active:
 *           type: boolean
 *           description: Whether the customer account is active
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the customer was created
 *       example:
 *         id: 1
 *         first_name: "John"
 *         last_name: "Doe"
 *         phone: "+1234567890"
 *         address: "123 Main St"
 *         city: "New York"
 *         state: "NY"
 *         zip_code: "10001"
 *         country: "USA"
 *         email: "john.doe@example.com"
 *         is_active: true
 *         created_at: "2023-01-01T00:00:00.000Z"
 *     
 *     CreateCustomerRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         first_name:
 *           type: string
 *           maxLength: 80
 *           description: First name of the customer
 *         last_name:
 *           type: string
 *           maxLength: 80
 *           description: Last name of the customer
 *         phone:
 *           type: string
 *           maxLength: 20
 *           description: Phone number of the customer
 *         address:
 *           type: string
 *           maxLength: 255
 *           description: Address of the customer
 *         city:
 *           type: string
 *           maxLength: 80
 *           description: City of the customer
 *         state:
 *           type: string
 *           maxLength: 80
 *           description: State of the customer
 *         zip_code:
 *           type: string
 *           maxLength: 20
 *           description: Zip code of the customer
 *         country:
 *           type: string
 *           maxLength: 80
 *           description: Country of the customer
 *         email:
 *           type: string
 *           format: email
 *           maxLength: 120
 *           description: Email address for the new customer
 *         password:
 *           type: string
 *           minLength: 8
 *           maxLength: 120
 *           description: Password for the new customer
 *       example:
 *         first_name: "John"
 *         last_name: "Doe"
 *         email: "john.doe@example.com"
 *         password: "securepassword123"
 *         phone: "+1234567890"
 *     
 *     UpdateCustomerRequest:
 *       type: object
 *       properties:
 *         first_name:
 *           type: string
 *           maxLength: 80
 *           description: First name of the customer
 *         last_name:
 *           type: string
 *           maxLength: 80
 *           description: Last name of the customer
 *         phone:
 *           type: string
 *           maxLength: 20
 *           description: Phone number of the customer
 *         address:
 *           type: string
 *           maxLength: 255
 *           description: Address of the customer
 *         city:
 *           type: string
 *           maxLength: 80
 *           description: City of the customer
 *         state:
 *           type: string
 *           maxLength: 80
 *           description: State of the customer
 *         zip_code:
 *           type: string
 *           maxLength: 20
 *           description: Zip code of the customer
 *         country:
 *           type: string
 *           maxLength: 80
 *           description: Country of the customer
 *         email:
 *           type: string
 *           format: email
 *           maxLength: 120
 *           description: Email address of the customer
 *         password:
 *           type: string
 *           minLength: 8
 *           maxLength: 120
 *           description: New password for the customer
 *       example:
 *         first_name: "John"
 *         last_name: "Smith"
 *         phone: "+1234567890"
 *     
 *     CustomerLoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email for login
 *         password:
 *           type: string
 *           description: Password for login
 *       example:
 *         email: "john.doe@example.com"
 *         password: "securepassword123"
 *     
 *     CustomerLoginResponse:
 *       type: object
 *       properties:
 *         customer:
 *           $ref: '#/components/schemas/Customer'
 *         token:
 *           type: string
 *           description: JWT authentication token
 *       example:
 *         customer:
 *           id: 1
 *           first_name: "John"
 *           last_name: "Doe"
 *           email: "john.doe@example.com"
 *         token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 */

/**
 * @openapi
 * /customers/register:
 *   post:
 *     summary: Register a new customer
 *     description: Creates a new customer account with the provided information
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCustomerRequest'
 *     responses:
 *       201:
 *         description: Customer registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "\"email\" is required"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Database connection failed"
 */
// POST /customers/register - Register customer (public)
router.post("/register", async (req, res) => {
  try {
    const { error, value } = createCustomerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const customer = await registerCustomer(value);
    res.status(201).json(customer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /customers/login:
 *   post:
 *     summary: Customer login
 *     description: Authenticates a customer with email and password, returns customer info and JWT token
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomerLoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerLoginResponse'
 *       400:
 *         description: Missing email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Email and password required"
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Invalid email or password"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Database connection failed"
 */
// POST /customers/login - Login
router.post("/login", async (req, res) => {
  try {
    const { error, value } = loginCustomerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const { customer, token } = await loginCustomer(value);
    res.json({ customer, token });
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

/**
 * @openapi
 * /customers:
 *   get:
 *     summary: Get all customers
 *     description: Retrieves a list of all customers. Only accessible by admin users.
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of customers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Customer'
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
 *               error: "Access denied. Insufficient permissions."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Database connection failed"
 */
// GET /customers - List customers (admin user type only)
router.get("/", ...requireAuthAndUserType("admin"), async (req, res) => {
  try {
    const customers = await listCustomers();
    res.json(customers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /customers/{id}:
 *   get:
 *     summary: Get customer by ID
 *     description: Retrieves a specific customer by their ID. Accessible by admin users or the customer themselves.
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric ID of the customer to retrieve
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 1
 *     responses:
 *       200:
 *         description: Customer retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Invalid customer ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Invalid customer id"
 *       403:
 *         description: Forbidden - Can only access own profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Access denied. You can only access your own profile."
 *       404:
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Customer not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Database connection failed"
 */
// GET /customers/:id - Get customer by id (admin user type or self-customer)
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid customer id" });
    }

    // Check if user is admin or accessing their own profile
    const isAdmin = req.user?.user_type === "admin";
    const isSelfCustomer = req.user?.user_type === "customer" && req.user?.id === id;

    if (!isAdmin && !isSelfCustomer) {
      return res.status(403).json({ error: "Access denied. You can only access your own profile." });
    }

    const customer = await getCustomerById(id);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.json(customer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /customers/{id}:
 *   put:
 *     summary: Update customer by ID
 *     description: Updates a specific customer by their ID. Accessible by admin users or the customer themselves.
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric ID of the customer to update
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCustomerRequest'
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Invalid customer ID or input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Invalid customer id"
 *       403:
 *         description: Forbidden - Can only update own profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Access denied. You can only update your own profile."
 *       404:
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Customer not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Database connection failed"
 */
// PUT /customers/:id - Update customer (admin user type or self-customer)
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid customer id" });
    }

    // Check if user is admin or updating their own profile
    const isAdmin = req.user?.user_type === "admin";
    const isSelfCustomer = req.user?.user_type === "customer" && req.user?.id === id;

    if (!isAdmin && !isSelfCustomer) {
      return res.status(403).json({ error: "Access denied. You can only update your own profile." });
    }

    const { error, value } = updateCustomerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const customer = await updateCustomer(id, value);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.json(customer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /customers/{id}:
 *   delete:
 *     summary: Delete customer by ID
 *     description: Soft deletes a specific customer by their ID. Only accessible by admin users.
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric ID of the customer to delete
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 1
 *     responses:
 *       200:
 *         description: Customer deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *                 customer:
 *                   $ref: '#/components/schemas/Customer'
 *               example:
 *                 message: "Customer deleted"
 *                 customer:
 *                   id: 1
 *                   first_name: "John"
 *                   last_name: "Doe"
 *                   email: "john.doe@example.com"
 *       400:
 *         description: Invalid customer ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Invalid customer id"
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Access denied. Admin access required."
 *       404:
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Customer not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Database connection failed"
 */
// DELETE /customers/:id - Delete customer (admin user type only)
router.delete("/:id", ...requireAuthAndUserType("admin"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid customer id" });
    }
    const customer = await deleteCustomer(id);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.json({ message: "Customer deleted", customer });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
