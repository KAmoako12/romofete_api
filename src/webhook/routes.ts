// This file defines webhook endpoints for payment gateway callbacks

import { Router } from "express";
import crypto from "crypto";
import { handlePaystackWebhook } from "./services";

const router = Router();

/**
 * @openapi
 * /webhooks/paystack:
 *   post:
 *     summary: Handle Paystack webhook events
 *     description: |
 *       Receives and processes Paystack webhook events for payment notifications.
 *       This endpoint handles various Paystack events including:
 *       - charge.success: Payment completed successfully
 *       - charge.failed: Payment failed
 *       - transfer.success: Transfer completed (if applicable)
 *       - transfer.failed: Transfer failed (if applicable)
 *       
 *       The webhook verifies the signature using the Paystack secret key to ensure authenticity.
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *                 description: The event type from Paystack
 *               data:
 *                 type: object
 *                 description: The event data from Paystack
 *             example:
 *               event: "charge.success"
 *               data:
 *                 id: 302961
 *                 domain: "live"
 *                 status: "success"
 *                 reference: "ORD-1234567890-001"
 *                 amount: 31497
 *                 message: "Approved"
 *                 gateway_response: "Successful"
 *                 paid_at: "2023-01-01T12:00:00.000Z"
 *                 created_at: "2023-01-01T11:55:00.000Z"
 *                 channel: "card"
 *                 currency: "GHS"
 *                 customer:
 *                   id: 12345
 *                   email: "customer@example.com"
 *                   customer_code: "CUS_xxxxxxxxxxxxx"
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Webhook processed successfully"
 *       400:
 *         description: Invalid webhook signature or payload
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid signature"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Webhook processing failed"
 */
// POST /webhooks/paystack - Handle Paystack webhook events
router.post("/paystack", async (req, res) => {
  try {
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || '')
      .update(JSON.stringify(req.body))
      .digest('hex');
    
    const signature = req.get('x-paystack-signature');
    
    if (hash !== signature) {
      console.error('Invalid Paystack webhook signature');
      return res.status(400).json({ error: "Invalid signature" });
    }

    const { event, data } = req.body;
    
    console.log(`Received Paystack webhook: ${event}`, data);

    const result = await handlePaystackWebhook(event, data);
    
    res.json({ 
      status: "success", 
      message: "Webhook processed successfully",
      result 
    });
    
  } catch (err: any) {
    console.error('Paystack webhook error:', err);
    res.status(500).json({ error: "Webhook processing failed", details: err.message });
  }
});

export default router;
