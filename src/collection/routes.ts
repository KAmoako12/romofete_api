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
 *                 minLength: 1
 *                 maxLength: 200
 *                 description: Collection name
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Collection description (optional, can be empty string)
 *               image:
 *                 type: string
 *                 maxLength: 500
 *                 description: Collection image URL (optional, can be empty string)
 *               product_type_id:
 *                 type: integer
 *                 minimum: 1
 *                 description: Associated product type ID (optional)
 *               is_active:
 *                 type: boolean
 *                 default: true
 *                 description: Whether the collection is active
 *               products:
 *                 type: array
 *                 minItems: 1
 *                 description: Initial products to add to collection (optional)
 *                 items:
 *                   type: object
 *                   required: [product_id]
 *                   properties:
 *                     product_id:
 *                       type: integer
 *                       minimum: 1
 *                       description: Product ID to add
 *                     position:
 *                       type: integer
 *                       minimum: 0
 *                       default: 0
 *                       description: Position of product in collection
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
 *     description: Retrieve collections with filtering, searching, pagination and sorting options.
 *     tags:
 *       - Collections
 *     parameters:
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by collection active status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         description: Search collections by name or description
 *       - in: query
 *         name: occasion
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         description: Search collections by occasion (searches product types and product metadata associated with collections)
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
 *           enum: [name, created_at, updated_at]
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
 *     description: Update collection properties. At least one field must be provided.
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
 *         description: Collection ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *                 description: Collection name
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Collection description (can be empty string)
 *               image:
 *                 type: string
 *                 maxLength: 500
 *                 description: Collection image URL (can be empty string)
 *               product_type_id:
 *                 type: integer
 *                 minimum: 1
 *                 nullable: true
 *                 description: Associated product type ID (can be set to null)
 *               is_active:
 *                 type: boolean
 *                 description: Whether the collection is active
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
 *     description: Add a single product to a collection with optional position.
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
 *         description: Collection ID
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
 *                 minimum: 1
 *                 description: Product ID to add to collection
 *               position:
 *                 type: integer
 *                 minimum: 0
 *                 default: 0
 *                 description: Position of product in collection
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
 *     description: Add multiple products to a collection at once (maximum 50 products).
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
 *         description: Collection ID
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
 *                 minItems: 1
 *                 maxItems: 50
 *                 description: Array of products to add to collection
 *                 items:
 *                   type: object
 *                   required: [product_id]
 *                   properties:
 *                     product_id:
 *                       type: integer
 *                       minimum: 1
 *                       description: Product ID to add to collection
 *                     position:
 *                       type: integer
 *                       minimum: 0
 *                       default: 0
 *                       description: Position of product in collection
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
 *     description: Remove a specific product from a collection.
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
 *         description: Collection ID
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID to remove from collection
 *     responses:
 *       200:
 *         description: Product removed from collection successfully
 *       400:
 *         description: Invalid collection ID or product ID
 *       404:
 *         description: Collection not found or product not in collection
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
 *     description: Update the position/order of a product within a collection.
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
 *         description: Collection ID
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID whose position to update
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
 *                 description: New position for the product in the collection
 *     responses:
 *       200:
 *         description: Product position updated successfully
 *       400:
 *         description: Validation error or invalid collection/product IDs
 *       404:
 *         description: Collection not found or product not in collection
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
