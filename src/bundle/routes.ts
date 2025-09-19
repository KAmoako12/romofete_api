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
