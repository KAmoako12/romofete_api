import { Router } from "express";
import {
  createHomepageSettingsSchema,
  updateHomepageSettingsSchema,
} from "./schemas";
import {
  Query,
} from "./query";
import { getProductById } from "../product/services";
import {
  requireAuthAndRole,
} from "../_services/authService";
import "../_services/types"; // Import to extend Express Request interface

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     HomepageSettings:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         section_title:
 *           type: string
 *         section_position:
 *           type: integer
 *         is_active:
 *           type: boolean
 *         section_images:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *         product_ids:
 *           type: array
 *           items:
 *             type: integer
 *           description: List of product IDs associated with this homepage setting
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Product'
 *           description: List of product objects associated with this homepage setting (GET only)
 *         created_at:
 *           type: string
 *           format: date-time
 *       example:
 *         id: 1
 *         section_title: "Featured Products"
 *         section_position: 1
 *         is_active: true
 *         section_images: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
 *         product_ids: [101, 102]
 *         products:
 *           - id: 101
 *             name: "Product 1"
 *             price: "10.00"
 *           - id: 102
 *             name: "Product 2"
 *             price: "20.00"
 *         created_at: "2025-10-28T21:00:00.000Z"
 *     CreateHomepageSettingsRequest:
 *       type: object
 *       properties:
 *         section_title:
 *           type: string
 *         section_position:
 *           type: integer
 *         is_active:
 *           type: boolean
 *         section_images:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *         product_ids:
 *           type: array
 *           items:
 *             type: integer
 *           description: List of product IDs to associate (optional)
 *       required:
 *         - section_title
 *         - section_position
 *       example:
 *         section_title: "Featured Products"
 *         section_position: 1
 *         is_active: true
 *         section_images: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
 *         product_ids: [101, 102]
 *     UpdateHomepageSettingsRequest:
 *       type: object
 *       minProperties: 1
 *       properties:
 *         section_title:
 *           type: string
 *         section_position:
 *           type: integer
 *         is_active:
 *           type: boolean
 *         section_images:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *         product_ids:
 *           type: array
 *           items:
 *             type: integer
 *           description: List of product IDs to associate (optional)
 *       example:
 *         section_title: "Updated Title"
 *         is_active: false
 *         product_ids: [101, 102]
 */

/**
 * @openapi
 * /homepage-settings:
 *   post:
 *     summary: Create a new homepage setting
 *     description: Creates a new homepage setting. Requires admin or superAdmin role.
 *     tags: [Homepage Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateHomepageSettingsRequest'
 *     responses:
 *       201:
 *         description: Homepage setting created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HomepageSettings'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

/**
 * @openapi
 * /homepage-settings/{id}:
 *   get:
 *     summary: Get homepage setting by ID
 *     description: Retrieves a specific homepage setting by its ID
 *     tags: [Homepage Settings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric ID of the homepage setting to retrieve
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 1
 *     responses:
 *       200:
 *         description: Homepage setting retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HomepageSettings'
 *       400:
 *         description: Invalid homepage setting ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       404:
 *         description: Homepage setting not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

/**
 * @openapi
 * /homepage-settings/{id}:
 *   put:
 *     summary: Update homepage setting by ID
 *     description: Updates a specific homepage setting by its ID. Requires admin or superAdmin role.
 *     tags: [Homepage Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric ID of the homepage setting to update
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateHomepageSettingsRequest'
 *     responses:
 *       200:
 *         description: Homepage setting updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HomepageSettings'
 *       400:
 *         description: Invalid input data or homepage setting ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       404:
 *         description: Homepage setting not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

/**
 * @openapi
 * /homepage-settings/{id}:
 *   delete:
 *     summary: Delete homepage setting by ID
 *     description: Hard deletes a specific homepage setting by its ID. Requires admin or superAdmin role.
 *     tags: [Homepage Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric ID of the homepage setting to delete
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 1
 *     responses:
 *       200:
 *         description: Homepage setting deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid homepage setting ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       404:
 *         description: Homepage setting not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

/**
 * @openapi
 * /homepage-settings:
 *   get:
 *     summary: Get all homepage settings
 *     description: Retrieves a list of all homepage settings, optionally filtered by is_active. Results are ordered by section_position ascending.
 *     tags: [Homepage Settings]
 *     parameters:
 *       - in: query
 *         name: is_active
 *         required: false
 *         description: Filter by active status
 *         schema:
 *           type: boolean
 *         example: true
 *     responses:
 *       200:
 *         description: List of homepage settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/HomepageSettings'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get("/", async (req, res) => {
  try {
    const isActive = req.query.is_active !== undefined
      ? req.query.is_active === "true"
      : undefined;
    const homepageSettings = await Query.listHomepageSettings(isActive);

    // For each homepage setting, fetch product objects if product_ids is present
    const homepageSettingsWithProducts = await Promise.all(
      homepageSettings.map(async (setting: any) => {
        let productIds: number[] = Array.isArray(setting.product_ids)
          ? setting.product_ids
          : (setting.product_ids ? [setting.product_ids] : []);
        if (!productIds || productIds.length === 0) {
          return { ...setting, products: [] };
        }
        // Fetch all products in parallel
        const products = await Promise.all(
          productIds.map((id) => getProductById(id))
        );
        return {
          ...setting,
          products: products.filter(Boolean), // Remove nulls if any product not found
        };
      })
    );

    res.json({ data: homepageSettingsWithProducts });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /homepage-settings/{id}:
 *   get:
 *     summary: Get homepage setting by ID
 *     description: Retrieves a specific homepage setting by its ID
 *     tags: [Homepage Settings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric ID of the homepage setting to retrieve
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 1
 *     responses:
 *       200:
 *         description: Homepage setting retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HomepageSettings'
 *       400:
 *         description: Invalid homepage setting ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       404:
 *         description: Homepage setting not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid homepage setting id" });
    }
    const homepageSetting = await Query.getHomepageSettingsById(id);
    if (!homepageSetting) {
      return res.status(404).json({ error: "Homepage setting not found" });
    }
    let productIds: number[] = Array.isArray(homepageSetting.product_ids)
      ? homepageSetting.product_ids
      : (homepageSetting.product_ids ? [homepageSetting.product_ids] : []);
    let products: any[] = [];
    if (productIds && productIds.length > 0) {
      products = (await Promise.all(productIds.map((pid) => getProductById(pid)))).filter(Boolean);
    }
    res.json({ data: { ...homepageSetting, products } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /homepage-settings:
 *   post:
 *     summary: Create a new homepage setting
 *     description: Creates a new homepage setting. Requires admin or superAdmin role.
 *     tags: [Homepage Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateHomepageSettingsRequest'
 *     responses:
 *       201:
 *         description: Homepage setting created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HomepageSettings'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post(
  "/",
  ...requireAuthAndRole("admin", "superAdmin"),
  async (req, res) => {
    try {
      const { error, value } = createHomepageSettingsSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }
      const homepageSetting = await Query.createHomepageSettings(value);
      res.status(201).json({ data: homepageSetting });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * @openapi
 * /homepage-settings/{id}:
 *   put:
 *     summary: Update homepage setting by ID
 *     description: Updates a specific homepage setting by its ID. Requires admin or superAdmin role.
 *     tags: [Homepage Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric ID of the homepage setting to update
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateHomepageSettingsRequest'
 *     responses:
 *       200:
 *         description: Homepage setting updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HomepageSettings'
 *       400:
 *         description: Invalid input data or homepage setting ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       404:
 *         description: Homepage setting not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.put(
  "/:id",
  ...requireAuthAndRole("admin", "superAdmin"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid homepage setting id" });
      }
      const { error, value } = updateHomepageSettingsSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }
      const homepageSetting = await Query.updateHomepageSettings(id, value);
      res.json({ data: homepageSetting });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * @openapi
 * /homepage-settings/{id}:
 *   delete:
 *     summary: Delete homepage setting by ID
 *     description: Hard deletes a specific homepage setting by its ID. Requires admin or superAdmin role.
 *     tags: [Homepage Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric ID of the homepage setting to delete
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 1
 *     responses:
 *       200:
 *         description: Homepage setting deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid homepage setting ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       404:
 *         description: Homepage setting not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.delete(
  "/:id",
  ...requireAuthAndRole("admin", "superAdmin"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid homepage setting id" });
      }
      await Query.deleteHomepageSettings(id);
      res.json({ message: "Homepage setting deleted", id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;
