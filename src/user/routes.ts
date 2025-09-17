// This file defines the API routes/endpoints for User-related operations.

import { Router } from "express";
import { createUserSchema } from "./schemas";
import {
  addUser,
  getUserById,
  listUsers,
  deleteUser,
  loginUser,
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
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier for the user
 *         username:
 *           type: string
 *           maxLength: 80
 *           description: Username for the user
 *         email:
 *           type: string
 *           format: email
 *           maxLength: 120
 *           description: Email address of the user
 *         role:
 *           type: string
 *           enum: [superAdmin, admin]
 *           description: Role of the user
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the user was created
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the user was last updated
 *       example:
 *         id: 1
 *         username: "john_doe"
 *         email: "john@example.com"
 *         role: "admin"
 *         created_at: "2023-01-01T00:00:00.000Z"
 *         updated_at: "2023-01-01T00:00:00.000Z"
 *     
 *     CreateUserRequest:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *         - role
 *       properties:
 *         username:
 *           type: string
 *           maxLength: 80
 *           description: Username for the new user
 *         email:
 *           type: string
 *           format: email
 *           maxLength: 120
 *           description: Email address for the new user
 *         password:
 *           type: string
 *           minLength: 8
 *           maxLength: 120
 *           description: Password for the new user
 *         role:
 *           type: string
 *           enum: [superAdmin, admin]
 *           description: Role to assign to the new user
 *       example:
 *         username: "john_doe"
 *         email: "john@example.com"
 *         password: "securepassword123"
 *         role: "admin"
 *     
 *     LoginRequest:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: Username for login
 *         password:
 *           type: string
 *           description: Password for login
 *       example:
 *         username: "john_doe"
 *         password: "securepassword123"
 *     
 *     LoginResponse:
 *       type: object
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/User'
 *         token:
 *           type: string
 *           description: JWT authentication token
 *       example:
 *         user:
 *           id: 1
 *           username: "john_doe"
 *           email: "john@example.com"
 *           role: "admin"
 *         token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Error message
 *       example:
 *         error: "User not found"
 *     
 *     DeleteResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message
 *         user:
 *           $ref: '#/components/schemas/User'
 *       example:
 *         message: "User deleted"
 *         user:
 *           id: 1
 *           username: "john_doe"
 *           email: "john@example.com"
 *           role: "admin"
 *   
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @openapi
 * /users:
 *   post:
 *     summary: Create a new user
 *     description: Creates a new user with the provided information
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "\"username\" is required"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Database connection failed"
 */
// POST /users - Add user (superAdmin only)
router.post("/", ...requireAuthAndRole("superAdmin"), async (req, res) => {
  try {
    const { error, value } = createUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const user = await addUser(value);
    res.status(201).json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Retrieves a list of all users. Requires authentication.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Access denied. No token provided."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Database connection failed"
 */
 // GET /users - List users (admin user type only)
router.get("/", ...requireAuthAndUserType("admin"), async (req, res) => {
  try {
    const users = await listUsers();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieves a specific user by their ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric ID of the user to retrieve
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 1
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid user ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Invalid user id"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "User not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Database connection failed"
 */
// GET /users/:id - Get user by id (admin user type only)
router.get("/:id", ...requireAuthAndUserType("admin"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    const user = await getUserById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /users/{id}:
 *   delete:
 *     summary: Delete user by ID
 *     description: Deletes a specific user by their ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric ID of the user to delete
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 1
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeleteResponse'
 *       400:
 *         description: Invalid user ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Invalid user id"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "User not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Database connection failed"
 */
// DELETE /users/:id - Delete user (admin user type only)
router.delete("/:id", ...requireAuthAndUserType("admin"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    const user = await deleteUser(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "User deleted", user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /users/login:
 *   post:
 *     summary: User login
 *     description: Authenticates a user with username and password, returns user info and JWT token
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Missing username or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Username and password required"
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Invalid username or password"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Database connection failed"
 */
 // POST /users/login - Login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }
    const { user, token } = await loginUser({ username, password });
    res.json({ user, token });
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

// Example routes demonstrating the new decorators

/**
 * @openapi
 * /users/admin-only:
 *   get:
 *     summary: Admin only endpoint
 *     description: Only accessible by users with admin or superAdmin role
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied - insufficient role
 */
// GET /users/admin-only - Only accessible by admin or superAdmin roles
router.get("/admin-only", ...requireAuthAndRole("admin", "superAdmin"), async (req, res) => {
  res.json({ 
    message: "This endpoint is only accessible by admin or superAdmin users",
    user: req.user 
  });
});

/**
 * @openapi
 * /users/super-admin-only:
 *   get:
 *     summary: Super admin only endpoint
 *     description: Only accessible by users with superAdmin role
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied - insufficient role
 */
// GET /users/super-admin-only - Only accessible by superAdmin role
router.get("/super-admin-only", ...requireAuthAndRole("superAdmin"), async (req, res) => {
  res.json({ 
    message: "This endpoint is only accessible by superAdmin users",
    user: req.user 
  });
});

/**
 * @openapi
 * /users/admin-type-only:
 *   get:
 *     summary: Admin user type only endpoint
 *     description: Only accessible by users with admin user type
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied - insufficient user type
 */
// GET /users/admin-type-only - Only accessible by admin user type
router.get("/admin-type-only", ...requireAuthAndUserType("admin"), async (req, res) => {
  res.json({ 
    message: "This endpoint is only accessible by admin user type",
    user: req.user 
  });
});

/**
 * @openapi
 * /users/customer-type-only:
 *   get:
 *     summary: Customer user type only endpoint
 *     description: Only accessible by users with customer user type
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied - insufficient user type
 */
// GET /users/customer-type-only - Only accessible by customer user type
router.get("/customer-type-only", ...requireAuthAndUserType("customer"), async (req, res) => {
  res.json({ 
    message: "This endpoint is only accessible by customer user type",
    user: req.user 
  });
});

/**
 * @openapi
 * /users/admin-role-and-admin-type:
 *   get:
 *     summary: Admin role and admin type endpoint
 *     description: Only accessible by users with admin role AND admin user type
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied - insufficient role or user type
 */
// GET /users/admin-role-and-admin-type - Only accessible by admin role AND admin user type
router.get("/admin-role-and-admin-type", ...requireAuthRoleAndUserType(["admin"], ["admin"]), async (req, res) => {
  res.json({ 
    message: "This endpoint requires both admin role and admin user type",
    user: req.user 
  });
});

export default router;
