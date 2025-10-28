// This file contains the business logic for handling webhook events

import { Query as OrderQuery } from "../order/query";
import { SmsService } from "../_services/smsService";

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
    
    // Find the order by reference
    const order = await OrderQuery.getOrderByReference(reference);
    
    if (!order) {
      console.error(`Order not found for reference: ${reference}`);
      return {
        processed: false,
        message: `Order not found for reference: ${reference}`
      };
    }

    // Verify the amount matches (Paystack sends amount in kobo, convert to main currency)
    const expectedAmount = Math.round(parseFloat(order.total_price) * 100);
    if (amount !== expectedAmount) {
      console.error(`Amount mismatch for order ${reference}. Expected: ${expectedAmount}, Received: ${amount}`);
      return {
        processed: false,
        message: `Amount mismatch for order ${reference}`
      };
    }

    const previousStatus = order.payment_status;

    // Update the order payment status to completed
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
    
    // Find the order by reference
    const order = await OrderQuery.getOrderByReference(reference);
    
    if (!order) {
      console.error(`Order not found for reference: ${reference}`);
      return {
        processed: false,
        message: `Order not found for reference: ${reference}`
      };
    }

    const previousStatus = order.payment_status;

    // Update the order payment status to failed
    await OrderQuery.updateOrderPaymentStatus(
      order.id, 
      'failed', 
      `Failed: ${message || 'Payment failed'}`
    );

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
