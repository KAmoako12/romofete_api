// This file contains service functions and business logic for Personalized Orders operations.
import { Query } from "./query";
import { EmailService } from "../_services/emailService";
import { 
  CreatePersonalizedOrderRequest, 
  UpdatePersonalizedOrderRequest,
  PersonalizedOrderResponse 
} from "../_services/modelTypes";

// Paystack configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// Helper function to format field names (convert snake_case to Title Case)
function formatFieldName(fieldName: string): string {
  return fieldName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper function to format order data for display
function formatOrderData(order: any): Record<string, any> {
  const formatted: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(order)) {
    if (key === 'id' || key === 'created_at' || key === 'updated_at' || key === 'deleted_at' || key === 'is_deleted') {
      continue; // Skip internal fields
    }
    
    const formattedKey = formatFieldName(key);
    
    if (value === null || value === undefined) {
      formatted[formattedKey] = 'N/A';
    } else if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
      // Parse JSON strings
      try {
        formatted[formattedKey] = JSON.parse(value);
      } catch {
        formatted[formattedKey] = value;
      }
    } else {
      formatted[formattedKey] = value;
    }
  }
  
  return formatted;
}

export async function createPersonalizedOrder(data: CreatePersonalizedOrderRequest) {
  const order = await Query.createPersonalizedOrder(data);
  
  // Initialize Paystack charge for payment
  let paystackResponse = null;
  try {
    paystackResponse = await initializePaystackCharge(order, data.customer_email);
    
    // Update order with payment reference
    if (paystackResponse && paystackResponse.status) {
      await Query.updatePersonalizedOrder(order.id, { 
        payment_reference: paystackResponse.data.reference,
        payment_status: 'processing' // Payment is initialized but not yet completed
      });
    }
  } catch (error) {
    console.error('Paystack charge initialization failed:', error);
    // Don't fail the order creation if payment initialization fails
  }
  
  // Send notification email to admin
  await sendAdminNotification(order);
  
  // Get updated order with payment details
  const fullOrder = await Query.getPersonalizedOrderById(order.id);
  const formattedOrder = formatOrderResponse(fullOrder);
  
  // Add Paystack response to the order response if available
  if (paystackResponse && paystackResponse.status) {
    (formattedOrder as any).paystack_response = paystackResponse.data;
    if (paystackResponse.data.authorization_url) {
      (formattedOrder as any).paystack_authorization_url = paystackResponse.data.authorization_url;
    }
    if (paystackResponse.data.access_code) {
      (formattedOrder as any).paystack_access_code = paystackResponse.data.access_code;
    }
  }
  
  return formattedOrder;
}

export async function getPersonalizedOrderById(id: number) {
  const order = await Query.getPersonalizedOrderById(id);
  
  if (!order) {
    throw new Error('Personalized order not found');
  }
  
  return formatOrderResponse(order);
}

export async function getAllPersonalizedOrders(filters: any) {
  const result = await Query.getAllPersonalizedOrders(filters);
  
  return {
    data: result.data.map(formatOrderResponse),
    pagination: result.pagination
  };
}

export async function updatePersonalizedOrder(id: number, data: UpdatePersonalizedOrderRequest) {
  const order = await Query.updatePersonalizedOrder(id, data);
  
  if (!order) {
    throw new Error('Personalized order not found');
  }
  
  return formatOrderResponse(order);
}

export async function deletePersonalizedOrder(id: number) {
  const order = await Query.deletePersonalizedOrder(id);
  
  if (!order) {
    throw new Error('Personalized order not found');
  }
  
  return { message: 'Personalized order deleted successfully' };
}

// Paystack HTTP request function - Initialize transaction to get authorization URL
async function initializePaystackCharge(order: any, customerEmail: string): Promise<any> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("Paystack secret key not configured");
  }

  const paystackData = {
    email: customerEmail,
    amount: Math.round(parseFloat(order.amount) * 100), // Paystack expects amount in kobo
    currency: 'GHS',
    reference: order.reference,
    callback_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/callback`,
    metadata: {
      order_id: order.id,
      order_type: 'personalized',
      customer_name: order.customer_name,
      delivery_address: order.delivery_address,
      product_type: order.product_type
    }
  };

  try {
    // Initialize the transaction to get authorization URL
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paystackData)
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`Paystack API error: ${result.message || 'Unknown error'}`);
    }

    return result;
  } catch (error) {
    console.error('Paystack transaction initialization failed:', error);
    throw error;
  }
}

// Helper function to format order response
function formatOrderResponse(order: any): PersonalizedOrderResponse {
  return {
    id: order.id,
    custom_message: order.custom_message,
    selected_colors: order.selected_colors || null,
    product_type: order.product_type,
    metadata: order.metadata || null,
    amount: order.amount?.toString() || '0',
    customer_email: order.customer_email,
    customer_phone: order.customer_phone || null,
    customer_name: order.customer_name || null,
    delivery_address: order.delivery_address || null,
    payment_status: order.payment_status,
    payment_reference: order.payment_reference || null,
    reference: order.reference,
    order_status: order.order_status,
    delivery_status: order.delivery_status,
    created_at: order.created_at,
    updated_at: order.updated_at
  };
}

// Send email notification to admin
async function sendAdminNotification(order: any) {
  const recipientEmail = "info@romofete.com";
  const fromEmail = process.env.SMTP2GO_FROM_EMAIL || 'noreply@romofete.com';
  
  const subject = `New Personalized Order #${order.id} - ${order.product_type}`;
  
  const formattedOrder = formatOrderData(order);
  
  // Create text content
  const textContent = `
New Personalized Order Received

Order ID: ${order.id}

Order Details:
${Object.entries(formattedOrder).map(([key, value]) => {
  if (typeof value === 'object' && value !== null) {
    return `${key}:\n${JSON.stringify(value, null, 2)}`;
  }
  return `${key}: ${value}`;
}).join('\n')}

---
This order was submitted via the Romofete personalized orders system.
  `.trim();

  // Create HTML content
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    .container {
      max-width: 700px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #28a745;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 5px 5px 0 0;
    }
    .content {
      background-color: #f9f9f9;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 0 0 5px 5px;
    }
    .order-id {
      background-color: #e7f3ff;
      padding: 15px;
      border-left: 4px solid #007bff;
      margin-bottom: 20px;
      font-size: 18px;
      font-weight: bold;
    }
    .field {
      margin-bottom: 15px;
      padding: 10px;
      background-color: white;
      border-radius: 3px;
    }
    .field-label {
      font-weight: bold;
      color: #555;
      margin-bottom: 5px;
    }
    .field-value {
      color: #333;
      padding: 5px 0;
    }
    .json-value {
      background-color: #f4f4f4;
      padding: 10px;
      border-radius: 3px;
      font-family: monospace;
      font-size: 13px;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .footer {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #777;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>New Personalized Order Received</h2>
    </div>
    <div class="content">
      <div class="order-id">
        Order ID: #${order.id}
      </div>
      
      ${Object.entries(formattedOrder).map(([key, value]) => {
        const isObject = typeof value === 'object' && value !== null;
        return `
          <div class="field">
            <div class="field-label">${key}:</div>
            <div class="field-value ${isObject ? 'json-value' : ''}">
              ${isObject ? JSON.stringify(value, null, 2) : value}
            </div>
          </div>
        `;
      }).join('')}
      
      <div class="footer">
        This order was submitted via the Romofete personalized orders system.
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();

  try {
    await EmailService.sendSimpleEmail(
      fromEmail,
      recipientEmail,
      subject,
      textContent,
      htmlContent
    );
  } catch (error) {
    // Log error but don't throw - we don't want to fail the order creation if email fails
    console.error('Failed to send admin notification email:', error);
  }
}
