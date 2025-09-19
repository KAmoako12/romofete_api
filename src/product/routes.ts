// This file defines the API routes/endpoints for Product-related operations.

import { Router } from "express";
import { 
  createProductSchema, 
  updateProductSchema, 
  productFiltersSchema,
  stockUpdateSchema,
  bulkStockUpdateSchema
} from "./schemas";
import {
  addProduct,
  getProductById,
  listProducts,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getProductsByType,
  updateProductStock,
  checkProductAvailability,
  getLowStockProducts,
  bulkUpdateStock,
  searchProducts,
  getProductStats
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
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier for the product
 *         name:
 *           type: string
 *           maxLength: 200
 *           description: Name of the product
 *         description:
 *           type: string
 *           maxLength: 2000
 *           description: Product description
 *         price:
 *           type: string
 *           description: Product price as a string (decimal)
 *         stock:
 *           type: integer
 *           description: Available stock quantity
 *         product_type_id:
 *           type: integer
 *           description: ID of the product type
 *         product_type_name:
 *           type: string
 *           description: Name of the product type
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of image URLs
 *         extra_properties:
 *           type: object
 *           description: Additional product properties
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the product was created
 *         in_stock:
 *           type: boolean
 *           description: Whether the product is in stock
 *         stock_status:
 *           type: string
 *           enum: [in_stock, low_stock, out_of_stock]
 *           description: Stock status indicator
 *       example:
 *         id: 1
 *         name: "Premium Headphones"
 *         description: "High-quality wireless headphones"
 *         price: "199.99"
 *         stock: 25
 *         product_type_id: 1
 *         product_type_name: "Electronics"
 *         images: ["https://example.com/image1.jpg"]
 *         extra_properties: {"color": "black", "warranty": "2 years"}
 *         created_at: "2023-01-01T00:00:00.000Z"
 *         in_stock: true
 *         stock_status: "in_stock"
 *     
 *     CreateProductRequest:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - stock
 *         - product_type_id
 *       properties:
 *         name:
 *           type: string
 *           maxLength: 200
 *           description: Name of the product
 *         description:
 *           type: string
 *           maxLength: 2000
 *           description: Product description
 *         price:
 *           type: number
 *           minimum: 0.01
 *           description: Product price
 *         stock:
 *           type: integer
 *           minimum: 0
 *           description: Initial stock quantity
 *         product_type_id:
 *           type: integer
 *           minimum: 1
 *           description: ID of the product type
 *         images:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *           maxItems: 10
 *           description: Array of image URLs
 *         extra_properties:
 *           type: object
 *           description: Additional product properties
 *       example:
 *         name: "Premium Headphones"
 *         description: "High-quality wireless headphones"
 *         price: 199.99
 *         stock: 25
 *         product_type_id: 1
 *         images: ["https://example.com/image1.jpg"]
 *         extra_properties: {"color": "black", "warranty": "2 years"}
 *     
 *     ProductListResponse:
 *       type: object
 *       properties:
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Product'
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *             limit:
 *               type: integer
 *             total:
 *               type: integer
 *             pages:
 *               type: integer
 *         filters_applied:
 *           type: object
 *           description: Filters that were applied to the query
 */

/**
 * @openapi
 * /products:
 *   get:
 *     summary: Get all products with filtering and pagination
 *     description: Retrieves a paginated list of products with optional filtering and search
 *     tags: [Products]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for product name, description, or type
 *       - in: query
 *         name: product_type_id
 *         schema:
 *           type: integer
 *         description: Filter by product type ID
 *       - in: query
 *         name: min_price
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: max_price
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: in_stock
 *         schema:
 *           type: boolean
 *         description: Filter by stock availability
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [name, price, created_at, stock, product_type_name]
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
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductListResponse'
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Internal server error
 */
// GET /products - List products with filtering and pagination (public endpoint)
router.get("/", async (req, res) => {
  try {
    const { error, value } = productFiltersSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { page, limit, sort_by, sort_order, ...filters } = value;
    const pagination = { page, limit, sort_by, sort_order };

    const result = await listProducts(filters, pagination);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /products:
 *   post:
 *     summary: Create a new product
 *     description: Creates a new product. Requires admin role.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductRequest'
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Product with same name exists
 *       500:
 *         description: Internal server error
 */
// POST /products - Create product (admin role only)
router.post("/", ...requireAuthAndRole("admin", "superAdmin"), async (req, res) => {
  try {
    const { error, value } = createProductSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const product = await addProduct(value);
    res.status(201).json(product);
  } catch (err: any) {
    if (err.message.includes("already exists")) {
      return res.status(409).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /products/featured:
 *   get:
 *     summary: Get featured products
 *     description: Retrieves a list of featured products (latest in-stock products)
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of featured products to return
 *     responses:
 *       200:
 *         description: Featured products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       500:
 *         description: Internal server error
 */
// GET /products/featured - Get featured products (public endpoint)
router.get("/featured", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const products = await getFeaturedProducts(Math.min(limit, 50));
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /products/low-stock:
 *   get:
 *     summary: Get low stock products
 *     description: Retrieves products with low stock levels. Requires admin role.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *         description: Stock threshold for low stock alert
 *     responses:
 *       200:
 *         description: Low stock products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
// GET /products/low-stock - Get low stock products (admin role only)
router.get("/low-stock", ...requireAuthAndRole("admin", "superAdmin"), async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold as string) || 10;
    const products = await getLowStockProducts(threshold);
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /products/stats:
 *   get:
 *     summary: Get product statistics
 *     description: Retrieves product inventory statistics. Requires admin role.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Product statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 low_stock_count:
 *                   type: integer
 *                 low_stock_threshold:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
// GET /products/stats - Get product statistics (admin role only)
router.get("/stats", ...requireAuthAndRole("admin", "superAdmin"), async (req, res) => {
  try {
    const stats = await getProductStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /products/search:
 *   get:
 *     summary: Search products
 *     description: Search products by name, description, or product type
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *         description: Search query
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
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductListResponse'
 *       400:
 *         description: Missing or invalid search query
 *       500:
 *         description: Internal server error
 */
// GET /products/search - Search products (public endpoint)
router.get("/search", async (req, res) => {
  try {
    const searchTerm = req.query.q as string;
    if (!searchTerm || searchTerm.trim().length === 0) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await searchProducts(searchTerm.trim(), {}, { page, limit });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /products/type/{typeId}:
 *   get:
 *     summary: Get products by type
 *     description: Retrieves products of a specific type
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: typeId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Product type ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of products to return
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid product type ID
 *       500:
 *         description: Internal server error
 */
// GET /products/type/:typeId - Get products by type (public endpoint)
router.get("/type/:typeId", async (req, res) => {
  try {
    const typeId = parseInt(req.params.typeId);
    if (isNaN(typeId)) {
      return res.status(400).json({ error: "Invalid product type ID" });
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const products = await getProductsByType(typeId, Math.min(limit, 100));
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /products/{id}:
 *   get:
 *     summary: Get product by ID
 *     description: Retrieves a specific product by its ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid product ID
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
// GET /products/:id - Get product by ID (public endpoint)
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }
    const product = await getProductById(id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /products/{id}:
 *   put:
 *     summary: Update product by ID
 *     description: Updates a specific product by its ID. Requires admin role.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *               price:
 *                 type: number
 *                 minimum: 0.01
 *               stock:
 *                 type: integer
 *                 minimum: 0
 *               product_type_id:
 *                 type: integer
 *                 minimum: 1
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *                 maxItems: 10
 *               extra_properties:
 *                 type: object
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid input data or product ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Product not found
 *       409:
 *         description: Product with same name exists
 *       500:
 *         description: Internal server error
 */
// PUT /products/:id - Update product (admin role only)
router.put("/:id", ...requireAuthAndRole("admin", "superAdmin"), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }
    
    const { error, value } = updateProductSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const product = await updateProduct(id, value);
    res.json(product);
  } catch (err: any) {
    if (err.message === "Product not found") {
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
 * /products/{id}:
 *   delete:
 *     summary: Delete product by ID
 *     description: Deletes a specific product by its ID (soft delete). Requires admin role.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid product ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
// DELETE /products/:id - Delete product (admin role only)
router.delete("/:id", ...requireAuthAndRole("admin", "superAdmin"), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }
    const product = await deleteProduct(id);
    res.json({ message: "Product deleted", product });
  } catch (err: any) {
    if (err.message === "Product not found") {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /products/{id}/stock:
 *   patch:
 *     summary: Update product stock
 *     description: Updates the stock quantity of a product. Requires admin role.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *               - operation
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Quantity to add or subtract
 *               operation:
 *                 type: string
 *                 enum: [increase, decrease]
 *                 description: Whether to increase or decrease stock
 *     responses:
 *       200:
 *         description: Stock updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid input data or product ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
// PATCH /products/:id/stock - Update product stock (admin role only)
router.patch("/:id/stock", ...requireAuthAndRole("admin", "superAdmin"), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }
    
    const { error, value } = stockUpdateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const product = await updateProductStock(id, value.quantity, value.operation);
    res.json(product);
  } catch (err: any) {
    if (err.message === "Product not found") {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /products/{id}/availability:
 *   get:
 *     summary: Check product availability
 *     description: Checks if a product has sufficient stock for a given quantity
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Product ID
 *       - in: query
 *         name: quantity
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Requested quantity
 *     responses:
 *       200:
 *         description: Availability check completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 available:
 *                   type: boolean
 *                 reason:
 *                   type: string
 *                 available_stock:
 *                   type: integer
 *       400:
 *         description: Invalid product ID or quantity
 *       500:
 *         description: Internal server error
 */
// GET /products/:id/availability - Check product availability (public endpoint)
router.get("/:id/availability", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const quantity = parseInt(req.query.quantity as string);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }
    
    if (isNaN(quantity) || quantity < 1) {
      return res.status(400).json({ error: "Invalid quantity" });
    }
    
    const availability = await checkProductAvailability(id, quantity);
    res.json(availability);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /products/stock/bulk-update:
 *   patch:
 *     summary: Bulk update product stock
 *     description: Updates stock for multiple products in a single request. Requires admin role.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - updates
 *             properties:
 *               updates:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 50
 *                 items:
 *                   type: object
 *                   required:
 *                     - product_id
 *                     - quantity
 *                     - operation
 *                   properties:
 *                     product_id:
 *                       type: integer
 *                       minimum: 1
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                     operation:
 *                       type: string
 *                       enum: [increase, decrease]
 *     responses:
 *       200:
 *         description: Bulk stock update completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 successful_updates:
 *                   type: array
 *                   items:
 *                     type: object
 *                 failed_updates:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total_processed:
 *                   type: integer
 *                 successful_count:
 *                   type: integer
 *                 failed_count:
 *                   type: integer
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
// PATCH /products/stock/bulk-update - Bulk update product stock (admin role only)
router.patch("/stock/bulk-update", ...requireAuthAndRole("admin", "superAdmin"), async (req, res) => {
  try {
    const { error, value } = bulkStockUpdateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const result = await bulkUpdateStock(value.updates);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
