// This file defines the API routes/endpoints for Mailing List and Contact Us operations.

import { Router } from "express";
import { addToMailingListSchema, contactUsSchema } from "./schemas";
import {
  addEmailToMailingList,
  getAllMailingListEmails,
  sendContactUsEmail
} from "./services";
import { requireAuthAndUserType } from "../_services/authService";

const router = Router();

/**
 * @openapi
 * /contact-us:
 *   post:
 *     summary: Send contact us message
 *     description: Sends a contact form submission via email
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 120
 *                 description: Name of the person contacting
 *               email:
 *                 type: string
 *                 format: email
 *                 maxLength: 120
 *                 description: Email address of the person contacting
 *               company:
 *                 type: string
 *                 maxLength: 120
 *                 description: Company name (optional)
 *               message:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Message content
 *             example:
 *               name: "John Doe"
 *               email: "john.doe@example.com"
 *               company: "Acme Corp"
 *               message: "I would like to inquire about your services."
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "Message sent successfully"
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Internal server error
 */
// POST /contact-us - Send contact form message (public)
router.post("/contact-us", async (req, res) => {
  try {
    const { error, value } = contactUsSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const result = await sendContactUsEmail(value);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /mailing-list:
 *   post:
 *     summary: Add email to mailing list
 *     description: Adds an email address to the mailing list. If email already exists, returns success without error.
 *     tags: [Mailing List]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 maxLength: 120
 *                 description: Email address to add to mailing list
 *             example:
 *               email: "subscriber@example.com"
 *     responses:
 *       200:
 *         description: Email added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "Email added to mailing list successfully"
 *       400:
 *         description: Invalid email format
 *       500:
 *         description: Internal server error
 */
// POST /mailing-list - Add email to mailing list (public)
router.post("/mailing-list", async (req, res) => {
  try {
    const { error, value } = addToMailingListSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const result = await addEmailToMailingList(value.email);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /mailing-list:
 *   get:
 *     summary: Get all mailing list emails
 *     description: Retrieves all email addresses from the mailing list. Only accessible by admin users.
 *     tags: [Mailing List]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of mailing list emails retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   email:
 *                     type: string
 *                     format: email
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *             example:
 *               - id: 1
 *                 email: "subscriber1@example.com"
 *                 created_at: "2023-01-01T00:00:00.000Z"
 *               - id: 2
 *                 email: "subscriber2@example.com"
 *                 created_at: "2023-01-02T00:00:00.000Z"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
// GET /mailing-list - Get all mailing list emails (admin only)
router.get("/mailing-list", ...requireAuthAndUserType("admin"), async (req, res) => {
  try {
    const emails = await getAllMailingListEmails();
    res.json(emails);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
