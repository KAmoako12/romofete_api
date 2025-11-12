import { Router } from "express";
import {
  createHomepageSettingsSchema,
  updateHomepageSettingsSchema,
  heroSectionSchema,
} from "./schemas";
import { Query } from "./query";
import { getProductById } from "../product/services";
import { requireAuthAndRole } from "../_services/authService";
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
 *         section_description:
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
 *       required:
 *         - section_title
 *         - section_description
 *         - section_position
 *       example:
 *         id: 1
 *         section_title: "Featured Products"
 *         section_description: "A section for featured products"
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
 *         section_description:
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
 *         - section_description
 *         - section_position
 *       example:
 *         section_title: "Featured Products"
 *         section_description: "A section for featured products"
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
 *         section_description:
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
 *         section_description: "Updated description"
 *         is_active: false
 *         product_ids: [101, 102]
 *     HeroSection:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         section_name:
 *           type: string
 *           example: "hero-section"
 *         section_title:
 *           type: string
 *         section_description:
 *           type: string
 *         section_position:
 *           type: integer
 *           example: 0
 *         section_images:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *         created_at:
 *           type: string
 *           format: date-time
 *       required:
 *         - section_name
 *         - section_title
 *         - section_description
 *         - section_position
 *         - section_images
 *       example:
 *         id: 1
 *         section_name: "hero-section"
 *         section_title: "Hero Title"
 *         section_description: "Hero description"
 *         section_position: 0
 *         section_images: ["https://example.com/hero1.jpg", "https://example.com/hero2.jpg"]
 *         created_at: "2025-10-28T21:00:00.000Z"
 */

// --- HOMEPAGE SETTINGS ROUTES ---

/**
 * @openapi
 * /homepage-settings:
 *   get:
 *     summary: Get all homepage settings
 *     tags: [Homepage Settings]
 *     responses:
 *       200:
 *         description: List of homepage settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/HomepageSettings'
 */
router.get("/", async (req, res) => {
  // ...handler unchanged...
  try {
    const isActive = req.query.is_active !== undefined
      ? req.query.is_active === "true"
      : undefined;
    const homepageSettings = await Query.listHomepageSettings(isActive);

    const homepageSettingsWithProducts = await Promise.all(
      homepageSettings.map(async (setting: any) => {
        let productIds: number[] = Array.isArray(setting.product_ids)
          ? setting.product_ids
          : (setting.product_ids ? [setting.product_ids] : []);
        if (!productIds || productIds.length === 0) {
          return { ...setting, products: [] };
        }
        const products = await Promise.all(
          productIds.map((id) => getProductById(id))
        );
        return {
          ...setting,
          products: products.filter(Boolean),
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
 *     summary: Get homepage setting by ID or hero-section by string
 *     tags: [Homepage Settings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Homepage setting or hero-section
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   oneOf:
 *                     - $ref: '#/components/schemas/HomepageSettings'
 *                     - $ref: '#/components/schemas/HeroSection'
 */
router.get("/:id", async (req, res) => {
  // ...handler unchanged...
  try {
    if (req.params.id === "hero-section") {
      const hero = await Query.getHomepageSettingsBySectionName("hero-section");
      if (!hero) {
        return res.status(404).json({ error: "Hero section not found" });
      }
      return res.json({ data: hero });
    }
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
 *     description: Creates a new homepage setting. Requires admin role.
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
 *         description: Homepage setting created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HomepageSettings'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
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
 *     description: Updates a homepage setting by ID. Requires admin role.
 *     tags: [Homepage Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Homepage setting ID or 'hero-section'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateHomepageSettingsRequest'
 *     responses:
 *       200:
 *         description: Homepage setting updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HomepageSettings'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put(
  "/:id",
  ...requireAuthAndRole("admin", "superAdmin"),
  async (req, res) => {
    try {
      if (req.params.id === "hero-section") {
        const { error, value } = heroSectionSchema.validate(req.body);
        if (error) {
          return res.status(400).json({ error: error.details[0].message });
        }
        const data = {
          section_name: "hero-section",
          section_position: 0,
          section_title: value.section_title,
          section_description: value.section_description,
          section_images: value.section_images,
        };
        let hero = await Query.getHomepageSettingsBySectionName("hero-section");
        if (hero) {
          await Query.updateHomepageSettings(hero.id, data);
          hero = await Query.getHomepageSettingsBySectionName("hero-section");
        } else {
          [hero] = await Query.createHomepageSettings(data);
        }
        return res.json({ data: hero });
      }
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
 *     description: Deletes a homepage setting by ID. Requires admin role.
 *     tags: [Homepage Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Homepage setting ID
 *     responses:
 *       200:
 *         description: Homepage setting deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
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

// --- HERO SECTION ROUTES ---

/**
 * @openapi
 * /homepage-settings/hero-section:
 *   get:
 *     summary: Get the homepage hero section
 *     tags: [Homepage Settings]
 *     responses:
 *       200:
 *         description: Hero section retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/HeroSection'
 */
router.get("/hero-section", async (req, res) => {
  try {
    const hero = await Query.getHomepageSettingsBySectionName("hero-section");
    if (!hero) {
      return res.status(404).json({ error: "Hero section not found" });
    }
    res.json({ data: hero });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /homepage-settings/hero-section:
 *   put:
 *     summary: Create or update the homepage hero section
 *     description: Creates or updates the homepage hero section. Requires admin role.
 *     tags: [Homepage Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               section_title:
 *                 type: string
 *               section_description:
 *                 type: string
 *               section_images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *             required:
 *               - section_title
 *               - section_description
 *               - section_images
 *             example:
 *               section_title: "Hero Title"
 *               section_description: "Hero description"
 *               section_images: ["https://example.com/hero1.jpg", "https://example.com/hero2.jpg"]
 *     responses:
 *       200:
 *         description: Hero section created or updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/HeroSection'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put(
  "/hero-section",
  ...requireAuthAndRole("admin", "superAdmin"),
  async (req, res) => {
    try {
      const { error, value } = heroSectionSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }
      // Always set section_name and section_position
      const data = {
        section_name: "hero-section",
        section_position: 0,
        section_title: value.section_title,
        section_description: value.section_description,
        section_images: value.section_images,
      };
      // Upsert logic
      let hero = await Query.getHomepageSettingsBySectionName("hero-section");
      if (hero) {
        // Update
        await Query.updateHomepageSettings(hero.id, data);
        hero = await Query.getHomepageSettingsBySectionName("hero-section");
      } else {
        // Create
        [hero] = await Query.createHomepageSettings(data);
      }
      res.json({ data: hero });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;
