import { Router, Request, Response } from "express";
import { CollectionService } from "./services";
import { Database } from "../_services/databaseService";
import {
  createCollectionSchema,
  updateCollectionSchema,
  addProductToCollectionSchema,
  updateCollectionProductSchema,
  collectionFiltersSchema,
  bulkAddProductsSchema
} from "./schemas";
import { requireAuthAndRole } from "../_services/authService";
import "../_services/types"; // Extend Express Request interface for auth

const router = Router();
const collectionService = new CollectionService(Database.getDBInstance());

/**
 * @openapi
 * /collections:
 *   post:
 *     summary: Create collection
 *     description: Creates a new collection with optional initial products.
 *     tags:
 *       - Collections
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [product_id]
 *                   properties:
 *                     product_id:
 *                       type: integer
 *                     position:
 *                       type: integer
 *                       minimum: 0
 *     responses:
 *       201:
 *         description: Collection created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post("/", ...requireAuthAndRole("admin", "superAdmin"), async (req: Request, res: Response) => {
  try {
    const { error, value } = createCollectionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map(d => d.message)
      });
    }

    const collection = await collectionService.createCollection(value);
    res.status(201).json({
      success: true,
      message: "Collection created successfully",
      data: collection
    });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

/**
 * @openapi
 * /collections:
 *   get:
 *     summary: Get all collections
 *     tags:
 *       - Collections
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
 *           enum: [name, created_at, updated_at]
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Collections retrieved successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { error, value } = collectionFiltersSchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map(d => d.message)
      });
    }

    const result = await collectionService.getCollections(value);
    res.json({
      success: true,
      message: "Collections retrieved successfully",
      data: result.data,
      pagination: result.pagination
    });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

/**
 * @openapi
 * /collections/{id}:
 *   get:
 *     summary: Get collection by ID
 *     tags:
 *       - Collections
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Collection retrieved successfully
 *       400:
 *         description: Invalid collection ID
 *       404:
 *         description: Collection not found
 *       500:
 *         description: Server error
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "Invalid collection ID" });
    }
    const collection = await collectionService.getCollectionById(id);
    res.json({ success: true, message: "Collection retrieved successfully", data: collection });
  } catch (err) {
    const status = (err as Error).message === "Collection not found" ? 404 : 500;
    res.status(status).json({ success: false, message: (err as Error).message });
  }
});

/**
 * @openapi
 * /collections/{id}:
 *   put:
 *     summary: Update collection
 *     tags:
 *       - Collections
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
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Collection updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Collection not found
 *       500:
 *         description: Server error
 */
router.put("/:id", ...requireAuthAndRole("admin", "superAdmin"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "Invalid collection ID" });
    }

    const { error, value } = updateCollectionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map(d => d.message)
      });
    }

    const updated = await collectionService.updateCollection(id, value);
    res.json({ success: true, message: "Collection updated successfully", data: updated });
  } catch (err) {
    const status = (err as Error).message === "Collection not found" ? 404 : 500;
    res.status(status).json({ success: false, message: (err as Error).message });
  }
});

/**
 * @openapi
 * /collections/{id}:
 *   delete:
 *     summary: Delete collection
 *     tags:
 *       - Collections
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
 *         description: Collection deleted successfully
 *       400:
 *         description: Invalid collection ID
 *       404:
 *         description: Collection not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", ...requireAuthAndRole("admin", "superAdmin"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "Invalid collection ID" });
    }

    const result = await collectionService.deleteCollection(id);
    res.json({ success: true, message: result.message });
  } catch (err) {
    const status = (err as Error).message === "Collection not found" ? 404 : 500;
    res.status(status).json({ success: false, message: (err as Error).message });
  }
});

/**
 * @openapi
 * /collections/{id}/products:
 *   post:
 *     summary: Add product to collection
 *     tags:
 *       - Collections
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
 *             required: [product_id]
 *             properties:
 *               product_id:
 *                 type: integer
 *               position:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       201:
 *         description: Product added to collection successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Collection or Product not found
 *       409:
 *         description: Product already in collection
 *       500:
 *         description: Server error
 */
router.post("/:id/products", ...requireAuthAndRole("admin", "superAdmin"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "Invalid collection ID" });
    }

    const { error, value } = addProductToCollectionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map(d => d.message)
      });
    }

    const data = await collectionService.addProductToCollection(id, value);
    res.status(201).json({ success: true, message: "Product added to collection successfully", data });
  } catch (err) {
    let status = 500;
    const msg = (err as Error).message;
    if (msg === "Collection not found" || msg === "Product not found") status = 404;
    else if (msg === "Product is already in this collection") status = 409;
    res.status(status).json({ success: false, message: msg });
  }
});

/**
 * @openapi
 * /collections/{id}/products/bulk:
 *   post:
 *     summary: Bulk add products to collection
 *     tags:
 *       - Collections
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
 *                   required: [product_id]
 *                   properties:
 *                     product_id:
 *                       type: integer
 *                     position:
 *                       type: integer
 *                       minimum: 0
 *     responses:
 *       201:
 *         description: Products added to collection successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Collection or Product not found
 *       409:
 *         description: One or more products already in collection
 *       500:
 *         description: Server error
 */
router.post("/:id/products/bulk", ...requireAuthAndRole("admin", "superAdmin"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "Invalid collection ID" });
    }

    const { error, value } = bulkAddProductsSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map(d => d.message)
      });
    }

    const data = await collectionService.bulkAddProductsToCollection(id, value.products);
    res.status(201).json({ success: true, message: "Products added to collection successfully", data });
  } catch (err) {
    let status = 500;
    const msg = (err as Error).message;
    if (msg === "Collection not found" || msg.includes("does not exist")) status = 404;
    else if (msg.includes("already in this collection")) status = 409;
    res.status(status).json({ success: false, message: msg });
  }
});

/**
 * @openapi
 * /collections/{id}/products/{productId}:
 *   delete:
 *     summary: Remove product from collection
 *     tags:
 *       - Collections
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
 *         description: Product removed from collection successfully
 *       400:
 *         description: Invalid IDs
 *       404:
 *         description: Collection or product not in collection
 *       500:
 *         description: Server error
 */
router.delete("/:id/products/:productId", ...requireAuthAndRole("admin", "superAdmin"), async (req: Request, res: Response) => {
  try {
    const collectionId = parseInt(req.params.id);
    const productId = parseInt(req.params.productId);
    if (isNaN(collectionId) || isNaN(productId)) {
      return res.status(400).json({ success: false, message: "Invalid collection ID or product ID" });
    }

    const data = await collectionService.removeProductFromCollection(collectionId, productId);
    res.json({ success: true, message: "Product removed from collection successfully", data });
  } catch (err) {
    let status = 500;
    const msg = (err as Error).message;
    if (msg === "Collection not found" || msg === "Product is not in this collection") status = 404;
    res.status(status).json({ success: false, message: msg });
  }
});

/**
 * @openapi
 * /collections/{id}/products/{productId}:
 *   put:
 *     summary: Update product position in collection
 *     tags:
 *       - Collections
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
 *             required: [position]
 *             properties:
 *               position:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Product position updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Collection or Product not found/in collection
 *       500:
 *         description: Server error
 */
router.put("/:id/products/:productId", ...requireAuthAndRole("admin", "superAdmin"), async (req: Request, res: Response) => {
  try {
    const collectionId = parseInt(req.params.id);
    const productId = parseInt(req.params.productId);
    if (isNaN(collectionId) || isNaN(productId)) {
      return res.status(400).json({ success: false, message: "Invalid collection ID or product ID" });
    }

    const { error, value } = updateCollectionProductSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map(d => d.message)
      });
    }

    const data = await collectionService.updateCollectionProductPosition(collectionId, productId, value.position);
    res.json({ success: true, message: "Product position updated successfully", data });
  } catch (err) {
    let status = 500;
    const msg = (err as Error).message;
    if (msg === "Collection not found" || msg === "Product is not in this collection") status = 404;
    res.status(status).json({ success: false, message: msg });
  }
});

export default router;
