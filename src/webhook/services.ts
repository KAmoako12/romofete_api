// This file contains the business logic for handling webhook events

import { Query as OrderQuery } from "../order/query";
import { Query as PersonalizedOrderQuery } from "../personalized-order/query";
import { SmsService } from "../_services/smsService";
import { EmailService } from "../_services/emailService";

// Interface for Paystack webhook event data
export interface PaystackWebhookData {
  id: number;
  domain: string;
  status: string;
  reference: string;
  amount: number;
  message?: string;
  gateway_response: string;
  paid_at?: string;
  created_at: string;
  channel: string;
  currency: string;
  ip_address?: string;
  metadata?: {
    order_id?: string;
    [key: string]: any;
  };
  customer: {
    id: number;
    first_name?: string;
    last_name?: string;
    email: string;
    customer_code: string;
    phone?: string;
    metadata?: any;
    risk_action: string;
  };
  authorization?: {
    authorization_code: string;
    bin: string;
    last4: string;
    exp_month: string;
    exp_year: string;
    channel: string;
    card_type: string;
    bank: string;
    country_code: string;
    brand: string;
    reusable: boolean;
    signature: string;
  };
}

export interface WebhookResult {
  processed: boolean;
  message: string;
  order_id?: number;
  order_reference?: string;
  previous_status?: string;
  new_status?: string;
}

/**
 * Main handler for Paystack webhook events
 * @param event - The event type from Paystack
 * @param data - The event data from Paystack
 * @returns Promise<WebhookResult>
 */
export async function handlePaystackWebhook(event: string, data: PaystackWebhookData): Promise<WebhookResult> {
  switch (event) {
    case 'charge.success':
      return await handleChargeSuccess(data);
    
    case 'charge.failed':
      return await handleChargeFailed(data);
    
    case 'transfer.success':
      return await handleTransferSuccess(data);
    
    case 'transfer.failed':
      return await handleTransferFailed(data);
    
    default:
      console.log(`Unhandled Paystack event: ${event}`);
      return {
        processed: false,
        message: `Event ${event} not handled`
      };
  }
}

/**
 * Handle successful payment charge
 * @param data - Paystack charge success data
 * @returns Promise<WebhookResult>
 */
async function handleChargeSuccess(data: PaystackWebhookData): Promise<WebhookResult> {
  try {
    const { reference, amount, customer } = data;
    
    console.log(`Processing successful charge for reference: ${reference}`);
    
    // Check if it's a personalized order (reference starts with PO-)
    const isPersonalizedOrder = reference.startsWith('PO-');
    
    // Find the order by reference
    let order: any;
    if (isPersonalizedOrder) {
      order = await PersonalizedOrderQuery.getPersonalizedOrderByReference(reference);
    } else {
      order = await OrderQuery.getOrderByReference(reference);
    }
    
    if (!order) {
      console.error(`Order not found for reference: ${reference}`);
      return {
        processed: false,
        message: `Order not found for reference: ${reference}`
      };
    }

    // Verify the amount matches (Paystack sends amount in kobo, convert to main currency)
    const orderAmount = isPersonalizedOrder ? order.amount : order.total_price;
    const expectedAmount = Math.round(parseFloat(orderAmount) * 100);
    if (amount !== expectedAmount) {
      console.error(`Amount mismatch for order ${reference}. Expected: ${expectedAmount}, Received: ${amount}`);
      return {
        processed: false,
        message: `Amount mismatch for order ${reference}`
      };
    }

    const previousStatus = order.payment_status;

    // Update the order payment status to completed
    if (isPersonalizedOrder) {
      await PersonalizedOrderQuery.updatePersonalizedOrder(order.id, {
        payment_status: 'completed',
        payment_reference: data.gateway_response || reference
      });
      
      // If order status is still pending, update it to processing
      if (order.order_status === 'pending') {
        await PersonalizedOrderQuery.updatePersonalizedOrder(order.id, {
          order_status: 'processing'
        });
      }
    } else {
      await OrderQuery.updateOrderPaymentStatus(
        order.id, 
        'completed', 
        data.gateway_response || reference
      );

      // If order status is still pending, update it to processing
      if (order.status === 'pending') {
        await OrderQuery.updateOrder(order.id, {
          status: 'processing'
        });
      }
    }

    // Send SMS to customer on payment success
    if (order.customer_phone) {
      const senderId = process.env.ARKESL_SMS_SENDER_ID || "ROMOFETE";
      const smsMessage = `Your payment for order ${reference} was successful. Thank you for your purchase!`;
      try {
        await SmsService.sendSms(order.customer_phone, smsMessage, senderId);
        console.log(`Success SMS sent to ${order.customer_phone}`);
      } catch (smsError) {
        console.error("Failed to send payment success SMS:", smsError);
      }
    } else {
      console.log(data.customer);
    }

    // Send email to customer on payment success
    if (order.customer_email) {
      // For personalized orders, handle email differently
      if (isPersonalizedOrder) {
        const emailSubject = `Payment Confirmed - Personalized Order ${reference}`;
        const emailText = `Dear ${order.customer_name || 'Customer'},\n\nYour payment for personalized order ${reference} was successful. Thank you for your purchase!\n\nOrder Total: GHS ${order.amount}\n\nWe will process your personalized order shortly.\n\nBest regards,\nRomofete Team`;
        
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <tr>
                      <td style="background-color: #4CAF50; padding: 30px 40px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Payment Confirmed ✓</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px;">
                        <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333;">Dear <strong>${order.customer_name || 'Customer'}</strong>,</p>
                        <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333;">Thank you for your purchase! Your payment has been successfully processed.</p>
                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9f9f9; border-radius: 6px; margin: 20px 0;">
                          <tr>
                            <td style="padding: 20px;">
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="padding: 8px 0;"><strong style="color: #555555;">Order Reference:</strong></td>
                                  <td style="padding: 8px 0; text-align: right;"><span style="color: #333333;">${reference}</span></td>
                                </tr>
                                <tr>
                                  <td style="padding: 8px 0;"><strong style="color: #555555;">Order Type:</strong></td>
                                  <td style="padding: 8px 0; text-align: right;"><span style="color: #333333;">Personalized Order</span></td>
                                </tr>
                                <tr>
                                  <td style="padding: 8px 0;"><strong style="color: #555555;">Product Type:</strong></td>
                                  <td style="padding: 8px 0; text-align: right;"><span style="color: #333333;">${order.product_type}</span></td>
                                </tr>
                                <tr>
                                  <td style="padding: 8px 0;"><strong style="color: #555555;">Payment Status:</strong></td>
                                  <td style="padding: 8px 0; text-align: right;"><span style="color: #4CAF50; font-weight: bold;">Completed</span></td>
                                </tr>
                                <tr>
                                  <td style="padding: 8px 0;"><strong style="color: #555555;">Amount:</strong></td>
                                  <td style="padding: 8px 0; text-align: right;"><strong style="color: #4CAF50; font-size: 18px;">GHS ${parseFloat(order.amount).toFixed(2)}</strong></td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                        <p style="margin: 30px 0 0 0; font-size: 16px; color: #333333;">We will process your personalized order shortly and keep you updated on its status.</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background-color: #f9f9f9; padding: 30px 40px; text-align: center; border-top: 1px solid #eeeeee;">
                        <p style="margin: 0 0 10px 0; font-size: 14px; color: #666666;">Best regards,</p>
                        <p style="margin: 0; font-size: 14px; color: #333333;"><strong>Romofete Team</strong></p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `;
        
        try {
          const fromEmail = process.env.SMTP2GO_FROM_EMAIL || 'orders@romofete.com';
          await EmailService.sendSimpleEmail(fromEmail, order.customer_email, emailSubject, emailText, emailHtml);
          console.log(`Payment confirmation email sent to ${order.customer_email}`);
        } catch (emailError) {
          console.error("Failed to send payment confirmation email:", emailError);
        }
      } else {
        // Handle regular order email
        // Fetch order items
        const orderItems = await OrderQuery.getOrderItems(order.id);
        
        // Build order items HTML for email (Gmail-friendly table format)
        let orderItemsHtml = '';
      if (orderItems && orderItems.length > 0) {
        orderItemsHtml = `
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Product</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
              </tr>
            </thead>
            <tbody>
        `;
        
        orderItems.forEach((item: any) => {
          const itemTotal = (parseFloat(item.price) * item.quantity).toFixed(2);
          orderItemsHtml += `
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">
                  <strong>${item.product_name}</strong><br>
                  <span style="color: #666; font-size: 12px;">${item.product_type_name || ''}</span>
                </td>
                <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee;">${item.quantity}</td>
                <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">GHS ${parseFloat(item.price).toFixed(2)}</td>
                <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">GHS ${itemTotal}</td>
              </tr>
          `;
        });
        
        orderItemsHtml += `
            </tbody>
          </table>
        `;
      }
      
      // Build order summary
      const subtotal = order.subtotal || order.total_price;
      const deliveryCost = order.delivery_cost || 0;
      
      const emailSubject = `Payment Confirmed - Order ${reference}`;
      const emailText = `Dear ${order.customer_name || 'Customer'},\n\nYour payment for order ${reference} was successful. Thank you for your purchase!\n\nOrder Total: GHS ${order.total_price}\n\nWe will process your order shortly.\n\nBest regards,\nRomofete Team`;
      
      // Gmail-friendly HTML with inline styles and table-based layout
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #4CAF50; padding: 30px 40px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Payment Confirmed ✓</h1>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333;">Dear <strong>${order.customer_name || 'Customer'}</strong>,</p>
                      <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333;">Thank you for your purchase! Your payment has been successfully processed.</p>
                      
                      <!-- Order Details Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9f9f9; border-radius: 6px; margin: 20px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="padding: 8px 0;">
                                  <strong style="color: #555555;">Order Reference:</strong>
                                </td>
                                <td style="padding: 8px 0; text-align: right;">
                                  <span style="color: #333333;">${reference}</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0;">
                                  <strong style="color: #555555;">Payment Status:</strong>
                                </td>
                                <td style="padding: 8px 0; text-align: right;">
                                  <span style="color: #4CAF50; font-weight: bold;">Completed</span>
                                </td>
                              </tr>
                              ${order.delivery_address ? `
                              <tr>
                                <td style="padding: 8px 0;">
                                  <strong style="color: #555555;">Delivery Address:</strong>
                                </td>
                                <td style="padding: 8px 0; text-align: right;">
                                  <span style="color: #333333;">${order.delivery_address}</span>
                                </td>
                              </tr>
                              ` : ''}
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Order Items -->
                      ${orderItemsHtml}
                      
                      <!-- Order Summary -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                        <tr>
                          <td style="padding: 8px 0; text-align: right;">
                            <strong style="color: #555555;">Subtotal:</strong>
                          </td>
                          <td style="padding: 8px 0 8px 20px; text-align: right; width: 120px;">
                            <span style="color: #333333;">GHS ${parseFloat(subtotal).toFixed(2)}</span>
                          </td>
                        </tr>
                        ${deliveryCost > 0 ? `
                        <tr>
                          <td style="padding: 8px 0; text-align: right;">
                            <strong style="color: #555555;">Delivery:</strong>
                          </td>
                          <td style="padding: 8px 0 8px 20px; text-align: right;">
                            <span style="color: #333333;">GHS ${parseFloat(deliveryCost).toFixed(2)}</span>
                          </td>
                        </tr>
                        ` : ''}
                        <tr>
                          <td style="padding: 12px 0 0 0; text-align: right; border-top: 2px solid #ddd;">
                            <strong style="color: #333333; font-size: 18px;">Total:</strong>
                          </td>
                          <td style="padding: 12px 0 0 20px; text-align: right; border-top: 2px solid #ddd;">
                            <strong style="color: #4CAF50; font-size: 18px;">GHS ${parseFloat(order.total_price).toFixed(2)}</strong>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 30px 0 0 0; font-size: 16px; color: #333333;">We will process your order shortly and keep you updated on its status.</p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9f9f9; padding: 30px 40px; text-align: center; border-top: 1px solid #eeeeee;">
                      <p style="margin: 0 0 10px 0; font-size: 14px; color: #666666;">Best regards,</p>
                      <p style="margin: 0; font-size: 14px; color: #333333;"><strong>Romofete Team</strong></p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;
      
        try {
          const fromEmail = process.env.SMTP2GO_FROM_EMAIL || 'orders@romofete.com';
          await EmailService.sendSimpleEmail(fromEmail, order.customer_email, emailSubject, emailText, emailHtml);
          console.log(`Payment confirmation email sent to ${order.customer_email}`);
        } catch (emailError) {
          console.error("Failed to send payment confirmation email:", emailError);
        }
      }
    } else {
      console.error(`Customer email not found for order ${reference}`);
    }

    console.log(`Payment completed for order ${reference}`);
    
    return {
      processed: true,
      message: 'Payment completed successfully',
      order_id: order.id,
      order_reference: reference,
      previous_status: previousStatus,
      new_status: 'completed'
    };
    
  } catch (error: any) {
    console.error('Error processing charge success:', error);
    throw error;
  }
}

/**
 * Handle failed payment charge
 * @param data - Paystack charge failed data
 * @returns Promise<WebhookResult>
 */
async function handleChargeFailed(data: PaystackWebhookData): Promise<WebhookResult> {
  try {
    const { reference, message } = data;
    
    console.log(`Processing failed charge for reference: ${reference}`);
    
    // Check if it's a personalized order
    const isPersonalizedOrder = reference.startsWith('PO-');
    
    // Find the order by reference
    let order: any;
    if (isPersonalizedOrder) {
      order = await PersonalizedOrderQuery.getPersonalizedOrderByReference(reference);
    } else {
      order = await OrderQuery.getOrderByReference(reference);
    }
    
    if (!order) {
      console.error(`Order not found for reference: ${reference}`);
      return {
        processed: false,
        message: `Order not found for reference: ${reference}`
      };
    }

    const previousStatus = order.payment_status;

    // Update the order payment status to failed
    if (isPersonalizedOrder) {
      await PersonalizedOrderQuery.updatePersonalizedOrder(order.id, {
        payment_status: 'failed',
        payment_reference: `Failed: ${message || 'Payment failed'}`
      });
    } else {
      await OrderQuery.updateOrderPaymentStatus(
        order.id, 
        'failed', 
        `Failed: ${message || 'Payment failed'}`
      );
    }

    console.log(`Payment failed for order ${reference}: ${message}`);
    
    return {
      processed: true,
      message: 'Payment failure recorded',
      order_id: order.id,
      order_reference: reference,
      previous_status: previousStatus,
      new_status: 'failed'
    };
    
  } catch (error: any) {
    console.error('Error processing charge failure:', error);
    throw error;
  }
}

/**
 * Handle successful transfer (for refunds, payouts, etc.)
 * @param data - Paystack transfer success data
 * @returns Promise<WebhookResult>
 */
async function handleTransferSuccess(data: PaystackWebhookData): Promise<WebhookResult> {
  console.log('Transfer success webhook received:', data);
  
  // For now, just log the event
  // In the future, you might want to handle refund completions here
  
  return {
    processed: true,
    message: 'Transfer success logged'
  };
}

/**
 * Handle failed transfer
 * @param data - Paystack transfer failed data
 * @returns Promise<WebhookResult>
 */
async function handleTransferFailed(data: PaystackWebhookData): Promise<WebhookResult> {
  console.log('Transfer failed webhook received:', data);
  
  // For now, just log the event
  // In the future, you might want to handle refund failures here
  
  return {
    processed: true,
    message: 'Transfer failure logged'
  };
}

/**
 * Verify Paystack transaction status by making API call
 * This can be used as a fallback to verify payment status directly with Paystack
 * @param reference - Transaction reference
 * @returns Promise<any>
 */
export async function verifyPaystackTransaction(reference: string): Promise<any> {
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
  
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("Paystack secret key not configured");
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`Paystack API error: ${result.message || 'Unknown error'}`);
    }

    return result;
    
  } catch (error) {
    console.error('Paystack transaction verification failed:', error);
    throw error;
  }
}
