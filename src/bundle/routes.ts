import { Router, Request, Response } from "express";
import { BundleService } from "./services";
import { Database } from "../_services/databaseService";
import {
  createBundleSchema,
  updateBundleSchema,
  addProductToBundleSchema,
  updateBundleProductSchema,
  bundleFiltersSchema,
  bulkAddProductsSchema
} from "./schemas";

const router = Router();
const bundleService = new BundleService(Database.getDBInstance());

/**
 * @openapi
 * /bundles:
 *   post:
 *     summary: Create bundle
 *     description: Creates a new bundle with optional discount and initial products.
 *     tags:
 *       - Bundles
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, products]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               discount_percentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               is_active:
 *                 type: boolean
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [product_id, quantity]
 *                   properties:
 *                     product_id:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *     responses:
 *       201:
 *         description: Bundle created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
 // Create a new bundle
router.post("/", async (req: Request, res: Response) => {
  try {
    const { error, value } = createBundleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map(detail => detail.message)
      });
    }

    const bundle = await bundleService.createBundle(value);
    res.status(201).json({
      success: true,
      message: "Bundle created successfully",
      data: bundle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
});

/**
 * @openapi
 * /bundles:
 *   get:
 *     summary: Get all bundles
 *     tags:
 *       - Bundles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [name, created_at, discount_percentage]
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Bundles retrieved successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
 // Get all bundles with optional filters
router.get("/", async (req: Request, res: Response) => {
  try {
    const { error, value } = bundleFiltersSchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map(detail => detail.message)
      });
    }

    const result = await bundleService.getBundles(value);
    res.json({
      success: true,
      message: "Bundles retrieved successfully",
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
});

/**
 * @openapi
 * /bundles/{id}:
 *   get:
 *     summary: Get bundle by ID
 *     tags:
 *       - Bundles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Bundle retrieved successfully
 *       400:
 *         description: Invalid bundle ID
 *       404:
 *         description: Bundle not found
 *       500:
 *         description: Server error
 */
 // Get bundle by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const bundleId = parseInt(req.params.id);
    if (isNaN(bundleId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid bundle ID"
      });
    }

    const bundle = await bundleService.getBundleById(bundleId);
    res.json({
      success: true,
      message: "Bundle retrieved successfully",
      data: bundle
    });
  } catch (error) {
    const statusCode = (error as Error).message === "Bundle not found" ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: (error as Error).message
    });
  }
});

/**
 * @openapi
 * /bundles/{id}:
 *   put:
 *     summary: Update bundle
 *     tags:
 *       - Bundles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               discount_percentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Bundle updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Bundle not found
 *       500:
 *         description: Server error
 */
 // Update bundle
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const bundleId = parseInt(req.params.id);
    if (isNaN(bundleId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid bundle ID"
      });
    }

    const { error, value } = updateBundleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map(detail => detail.message)
      });
    }

    const bundle = await bundleService.updateBundle(bundleId, value);
    res.json({
      success: true,
      message: "Bundle updated successfully",
      data: bundle
    });
  } catch (error) {
    const statusCode = (error as Error).message === "Bundle not found" ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: (error as Error).message
    });
  }
});

/**
 * @openapi
 * /bundles/{id}:
 *   delete:
 *     summary: Delete bundle
 *     tags:
 *       - Bundles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Bundle deleted successfully
 *       400:
 *         description: Invalid bundle ID
 *       404:
 *         description: Bundle not found
 *       500:
 *         description: Server error
 */
 // Delete bundle
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const bundleId = parseInt(req.params.id);
    if (isNaN(bundleId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid bundle ID"
      });
    }

    const result = await bundleService.deleteBundle(bundleId);
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    const statusCode = (error as Error).message === "Bundle not found" ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: (error as Error).message
    });
  }
});

/**
 * @openapi
 * /bundles/{id}/products:
 *   post:
 *     summary: Add product to bundle
 *     tags:
 *       - Bundles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [product_id, quantity]
 *             properties:
 *               product_id:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       201:
 *         description: Product added to bundle successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Bundle or Product not found
 *       409:
 *         description: Product already in bundle
 *       500:
 *         description: Server error
 */
 // Add a product to a bundle
router.post("/:id/products", async (req: Request, res: Response) => {
  try {
    const bundleId = parseInt(req.params.id);
    if (isNaN(bundleId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid bundle ID"
      });
    }

    const { error, value } = addProductToBundleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map(detail => detail.message)
      });
    }

    const bundle = await bundleService.addProductToBundle(bundleId, value);
    res.status(201).json({
      success: true,
      message: "Product added to bundle successfully",
      data: bundle
    });
  } catch (error) {
    let statusCode = 500;
    const errorMessage = (error as Error).message;
    if (errorMessage === "Bundle not found" || errorMessage === "Product not found") {
      statusCode = 404;
    } else if (errorMessage === "Product is already in this bundle") {
      statusCode = 409;
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage
    });
  }
});

/**
 * @openapi
 * /bundles/{id}/products/bulk:
 *   post:
 *     summary: Bulk add products to bundle
 *     tags:
 *       - Bundles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [products]
 *             properties:
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [product_id, quantity]
 *                   properties:
 *                     product_id:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *     responses:
 *       201:
 *         description: Products added to bundle successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Bundle or Product not found
 *       409:
 *         description: One or more products already in bundle
 *       500:
 *         description: Server error
 */
 // Bulk add products to a bundle
router.post("/:id/products/bulk", async (req: Request, res: Response) => {
  try {
    const bundleId = parseInt(req.params.id);
    if (isNaN(bundleId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid bundle ID"
      });
    }

    const { error, value } = bulkAddProductsSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map(detail => detail.message)
      });
    }

    const bundle = await bundleService.bulkAddProductsToBundle(bundleId, value.products);
    res.status(201).json({
      success: true,
      message: "Products added to bundle successfully",
      data: bundle
    });
  } catch (error) {
    let statusCode = 500;
    const errorMessage = (error as Error).message;
    if (errorMessage === "Bundle not found" || errorMessage.includes("does not exist")) {
      statusCode = 404;
    } else if (errorMessage.includes("already in this bundle")) {
      statusCode = 409;
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage
    });
  }
});

/**
 * @openapi
 * /bundles/{id}/products/{productId}:
 *   delete:
 *     summary: Remove product from bundle
 *     tags:
 *       - Bundles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product removed from bundle successfully
 *       400:
 *         description: Invalid IDs
 *       404:
 *         description: Bundle or product not found in bundle
 *       500:
 *         description: Server error
 */
 // Remove a product from a bundle
router.delete("/:id/products/:productId", async (req: Request, res: Response) => {
  try {
    const bundleId = parseInt(req.params.id);
    const productId = parseInt(req.params.productId);
    
    if (isNaN(bundleId) || isNaN(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid bundle ID or product ID"
      });
    }

    const bundle = await bundleService.removeProductFromBundle(bundleId, productId);
    res.json({
      success: true,
      message: "Product removed from bundle successfully",
      data: bundle
    });
  } catch (error) {
    let statusCode = 500;
    const errorMessage = (error as Error).message;
    if (errorMessage === "Bundle not found") {
      statusCode = 404;
    } else if (errorMessage === "Product is not in this bundle") {
      statusCode = 404;
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage
    });
  }
});

/**
 * @openapi
 * /bundles/{id}/products/{productId}:
 *   put:
 *     summary: Update bundle product quantity
 *     tags:
 *       - Bundles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Product quantity updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Bundle or Product not found/in bundle
 *       500:
 *         description: Server error
 */
 // Update product quantity in a bundle
router.put("/:id/products/:productId", async (req: Request, res: Response) => {
  try {
    const bundleId = parseInt(req.params.id);
    const productId = parseInt(req.params.productId);
    
    if (isNaN(bundleId) || isNaN(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid bundle ID or product ID"
      });
    }

    const { error, value } = updateBundleProductSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map(detail => detail.message)
      });
    }

    const bundle = await bundleService.updateBundleProductQuantity(bundleId, productId, value.quantity);
    res.json({
      success: true,
      message: "Product quantity updated successfully",
      data: bundle
    });
  } catch (error) {
    let statusCode = 500;
    const errorMessage = (error as Error).message;
    if (errorMessage === "Bundle not found") {
      statusCode = 404;
    } else if (errorMessage === "Product is not in this bundle") {
      statusCode = 404;
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage
    });
  }
});

/**
 * @openapi
 * /bundles/{id}/price:
 *   get:
 *     summary: Calculate bundle price
 *     tags:
 *       - Bundles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Bundle price calculated successfully
 *       400:
 *         description: Invalid bundle ID
 *       404:
 *         description: Bundle not found
 *       500:
 *         description: Server error
 */
 // Calculate bundle price with discount
router.get("/:id/price", async (req: Request, res: Response) => {
  try {
    const bundleId = parseInt(req.params.id);
    if (isNaN(bundleId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid bundle ID"
      });
    }

    const priceInfo = await bundleService.calculateBundlePrice(bundleId);
    res.json({
      success: true,
      message: "Bundle price calculated successfully",
      data: priceInfo
    });
  } catch (error) {
    const statusCode = (error as Error).message === "Bundle not found" ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: (error as Error).message
    });
  }
});

/**
 * @openapi
 * /bundles/stats/overview:
 *   get:
 *     summary: Get bundle statistics
 *     tags:
 *       - Bundles
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bundle statistics retrieved successfully
 *       500:
 *         description: Server error
 */
 // Get bundle statistics
router.get("/stats/overview", async (req: Request, res: Response) => {
  try {
    const stats = await bundleService.getBundleStats();
    res.json({
      success: true,
      message: "Bundle statistics retrieved successfully",
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
});

/**
 * @openapi
 * /bundles/similar-products/{productId}:
 *   get:
 *     summary: Get similar products based on shared bundles
 *     tags:
 *       - Bundles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Similar products retrieved successfully
 *       400:
 *         description: Invalid product ID
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
 // Get products in same bundles (for similar products feature)
router.get("/similar-products/:productId", async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.productId);
    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    const limit = parseInt(req.query.limit as string) || 10;
    const similarProducts = await bundleService.getProductsInSameBundles(productId, limit);
    
    res.json({
      success: true,
      message: "Similar products retrieved successfully",
      data: similarProducts
    });
  } catch (error) {
    const statusCode = (error as Error).message === "Product not found" ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: (error as Error).message
    });
  }
});

export default router;
