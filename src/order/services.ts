// This file contains service functions and business logic for Order-related operations.
import { Query as OrderQuery, OrderFilters, OrderPaginationOptions } from "./query";
import { Query as ProductQuery } from "../product/query";
import { Query as DeliveryQuery } from "../delivery-option/query";
import { Query as CustomerQuery } from "../customer/query";
import { CreateOrderRequest, UpdateOrderRequest, CreateOrderItemRequest } from "../_services/modelTypes";

import bcrypt from "bcrypt";
import { SmsService } from "../_services/smsService";
import { EmailService } from "../_services/emailService";

// Paystack configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

export interface OrderResponse {
  id: number;
  user_id: number | null;
  quantity: number;
  subtotal: string;
  delivery_cost: string | null;
  total_price: string;
  delivery_option_id: number | null;
  delivery_option_name?: string;
  status: string;
  payment_status: string;
  payment_reference: string | null;
  reference: string;
  delivery_address: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_name: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
  items?: OrderItemResponse[];
  user_username?: string;
  user_email?: string;
  paystack_response?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
  paystack_authorization_url?: string;
  paystack_access_code?: string;
}

export interface OrderItemResponse {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  product_description: string | null;
  product_images: string[] | null;
  product_type_name: string;
  quantity: number;
  price: string;
  created_at: string;
}

export interface OrderListResponse {
  data: OrderResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters_applied: OrderFilters;
}

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export async function createOrder(data: CreateOrderRequest): Promise<OrderResponse> {
  const SALT_ROUNDS = 10;
  
  // Validate all products exist and have sufficient stock
  const orderItems: CreateOrderItemRequest[] = [];
  let subtotal = 0;
  let totalQuantity = 0;

  for (const item of data.items) {
    const product = await ProductQuery.getProductById(item.product_id);
    if (!product) {
      throw new Error(`Product with ID ${item.product_id} not found`);
    }

    // Check stock availability
    const availability = await ProductQuery.checkProductAvailability(item.product_id, item.quantity);
    if (!availability.available) {
      throw new Error(`Insufficient stock for product "${product.name}". ${availability.reason}. Available: ${availability.available_stock}`);
    }

    const itemPrice = parseFloat(product.price);
    const itemTotal = itemPrice * item.quantity;
    subtotal += itemTotal;
    totalQuantity += item.quantity;

    orderItems.push({
      order_id: 0, // Will be set after order creation
      product_id: item.product_id,
      quantity: item.quantity,
      price: itemPrice
    });
  }

  // Get delivery cost if delivery option is specified
  let deliveryCost = 0;
  let deliveryOption = null;
  if (data.delivery_option_id) {
    deliveryOption = await DeliveryQuery.getDeliveryOptionById(data.delivery_option_id);
    if (!deliveryOption) {
      throw new Error(`Delivery option with ID ${data.delivery_option_id} not found`);
    }
    deliveryCost = parseFloat((deliveryOption as any).amount.toString());
  }

  const totalPrice = subtotal + deliveryCost;

  // Handle guest customer registration if this is a guest order
  let registeredCustomer = null;
  if (!data.user_id && data.customer_email) {
    // Check if customer already exists
    const existingCustomer = await CustomerQuery.getCustomerByEmail(data.customer_email);
    
    if (!existingCustomer) {
      // Auto-register guest customer if they provided a password or if register_customer is true
      if (data.customer_password || data.register_customer) {
        try {
          // Generate a default password if none provided but registration is requested
          const password = data.customer_password || generateRandomPassword();
          const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
          
          // Parse customer name into first and last name
          const nameParts = (data.customer_name || '').split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          const customerData = {
            first_name: firstName,
            last_name: lastName,
            phone: data.customer_phone || undefined,
            address: data.delivery_address || undefined,
            email: data.customer_email,
            password: hashedPassword
          };
          
          const [newCustomer] = await CustomerQuery.createCustomer(customerData);
          registeredCustomer = newCustomer;
          
          console.log(`Auto-registered guest customer: ${data.customer_email}`);
        } catch (error) {
          console.error('Failed to auto-register guest customer:', error);
          // Don't fail the order creation if customer registration fails
          // The order can still be processed as a guest order
        }
      }
    } else {
      registeredCustomer = existingCustomer;
    }
  }

  // Generate order reference
  const reference = await OrderQuery.generateOrderReference();

  // Create order
  const orderData = {
    user_id: data.user_id || null,
    quantity: totalQuantity,
    subtotal: subtotal,
    delivery_cost: deliveryCost > 0 ? deliveryCost : null,
    total_price: totalPrice,
    delivery_option_id: data.delivery_option_id || null,
    status: 'pending',
    payment_status: 'pending',
    reference: reference,
    delivery_address: data.delivery_address || null,
    customer_email: data.customer_email || null,
    customer_phone: data.customer_phone || null,
    customer_name: data.customer_name || null,
    metadata: data.metadata || null
  };

  const [order] = await OrderQuery.createOrder(orderData);

  // Create order items
  const orderItemsWithOrderId = orderItems.map(item => ({
    ...item,
    order_id: order.id
  }));

  const createdOrderItems = await OrderQuery.createOrderItems(orderItemsWithOrderId);

  // Update product stock
  for (const item of data.items) {
    await ProductQuery.updateProductStock(item.product_id, item.quantity, 'decrease');
  }

  // Initialize Paystack charge if customer email is provided
  let paystackResponse = null;
  if (data.customer_email) {
    try {
      paystackResponse = await initializePaystackCharge(order, data.customer_email);
      
      // Update order with payment reference for transaction initialization
      if (paystackResponse && paystackResponse.status) {
        // Initialize endpoint creates a pending transaction, payment completion happens via callback
        await OrderQuery.updateOrder(order.id, { 
          payment_reference: paystackResponse.data.reference || reference,
          payment_status: 'processing' // Payment is initialized but not yet completed
        });
      }
    } catch (error) {
      console.error('Paystack charge failed:', error);
      // Don't fail the order creation if payment fails
      // The order can still be processed manually or payment can be retried
    }
  }

  // Get full order details
  const fullOrder = await getOrderById(order.id);
  if (!fullOrder) {
    throw new Error("Failed to retrieve created order");
  }

  // Add Paystack response to the order response if available
  if (paystackResponse && paystackResponse.status) {
    (fullOrder as any).paystack_response = paystackResponse.data;
    if (paystackResponse.data.authorization_url) {
      (fullOrder as any).paystack_authorization_url = paystackResponse.data.authorization_url;
    }
    if (paystackResponse.data.access_code) {
      (fullOrder as any).paystack_access_code = paystackResponse.data.access_code;
    }
  }

  // Add customer registration info to response if applicable
  if (registeredCustomer) {
    (fullOrder as any).customer_registered = true;
    (fullOrder as any).customer_id = registeredCustomer.id;
  }

  return fullOrder;
}

// Helper function to generate a random password for auto-registered customers
function generateRandomPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function getOrderById(id: number): Promise<OrderResponse | null> {
  const order = await OrderQuery.getOrderById(id);
  if (!order) {
    return null;
  }

  const orderItems = await OrderQuery.getOrderItems(id);
  const formattedOrder = formatOrderResponse(order);
  formattedOrder.items = orderItems.map(formatOrderItemResponse);

  return formattedOrder;
}

export async function getOrderByReference(reference: string): Promise<OrderResponse | null> {
  const order = await OrderQuery.getOrderByReference(reference);
  if (!order) {
    return null;
  }

  const orderItems = await OrderQuery.getOrderItems(order.id);
  const formattedOrder = formatOrderResponse(order);
  formattedOrder.items = orderItems.map(formatOrderItemResponse);

  return formattedOrder;
}

export async function listOrders(filters: OrderFilters = {}, pagination: OrderPaginationOptions = {}): Promise<OrderListResponse> {
  const result = await OrderQuery.listOrders(filters, pagination);
  
  // Get order items for each order
  const ordersWithItems = await Promise.all(
    result.orders.map(async (order) => {
      const orderItems = await OrderQuery.getOrderItems(order.id);
      const formattedOrder = formatOrderResponse(order);
      formattedOrder.items = orderItems.map(formatOrderItemResponse);
      return formattedOrder;
    })
  );
  
  return {
    data: ordersWithItems,
    pagination: result.pagination,
    filters_applied: filters
  };
}

export async function updateOrder(id: number, updates: UpdateOrderRequest): Promise<OrderResponse> {
  const existingOrder = await OrderQuery.getOrderById(id);
  if (!existingOrder) {
    throw new Error("Order not found");
  }

  const [updatedOrder] = await OrderQuery.updateOrder(id, updates);

  // Send SMS if status is updated and customer phone is available
  if (
    updates.status &&
    updates.status !== existingOrder.status &&
    existingOrder.customer_phone
  ) {
    const senderId = process.env.ARKESL_SMS_SENDER_ID || "ROMOFETE";
    const smsMessage = `Your order (${existingOrder.reference}) status has been updated to: ${updates.status}.`;
    try {
      await SmsService.sendSms(existingOrder.customer_phone, smsMessage, senderId);
      console.log(`Order status update SMS sent to ${existingOrder.customer_phone}`);
    } catch (smsError) {
      console.error("Failed to send order status update SMS:", smsError);
    }
  }

  // Send email if status is updated and customer email is available
  if (
    updates.status &&
    updates.status !== existingOrder.status &&
    existingOrder.customer_email
  ) {
    const statusDisplay = updates.status.charAt(0).toUpperCase() + updates.status.slice(1);
    const emailSubject = `Order Status Update - ${existingOrder.reference}`;
    const emailText = `Dear ${existingOrder.customer_name || 'Customer'},\n\nYour order (${existingOrder.reference}) status has been updated to: ${statusDisplay}.\n\nThank you for choosing Romofete!\n\nBest regards,\nRomofete Team`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2196F3;">Order Status Update</h2>
        <p>Dear <strong>${existingOrder.customer_name || 'Customer'}</strong>,</p>
        <p>Your order status has been updated:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Order Reference:</strong> ${existingOrder.reference}</p>
          <p style="margin: 5px 0;"><strong>Previous Status:</strong> ${existingOrder.status}</p>
          <p style="margin: 5px 0;"><strong>New Status:</strong> <span style="color: #2196F3; font-weight: bold;">${statusDisplay}</span></p>
        </div>
        <p>Thank you for choosing Romofete!</p>
        <p style="margin-top: 30px;">Best regards,<br><strong>Romofete Team</strong></p>
      </div>
    `;
    
    try {
      const fromEmail = process.env.MAILERSEND_FROM_EMAIL || 'orders@romofete.com';
      await EmailService.sendSimpleEmail(fromEmail, existingOrder.customer_email, emailSubject, emailText, emailHtml);
      console.log(`Order status update email sent to ${existingOrder.customer_email}`);
    } catch (emailError) {
      console.error("Failed to send order status update email:", emailError);
    }
  }

  return formatOrderResponse(updatedOrder);
}

export async function cancelOrder(id: number): Promise<OrderResponse> {
  const existingOrder = await OrderQuery.getOrderById(id);
  if (!existingOrder) {
    throw new Error("Order not found");
  }

  if (existingOrder.status === 'cancelled') {
    throw new Error("Order is already cancelled");
  }

  if (existingOrder.status === 'delivered') {
    throw new Error("Cannot cancel a delivered order");
  }

  // Restore product stock if order was not yet processed
  if (existingOrder.status === 'pending') {
    const orderItems = await OrderQuery.getOrderItems(id);
    for (const item of orderItems) {
      await ProductQuery.updateProductStock(item.product_id, item.quantity, 'increase');
    }
  }

  const [updatedOrder] = await OrderQuery.updateOrder(id, { 
    status: 'cancelled',
    payment_status: existingOrder.payment_status === 'completed' ? 'refunded' : 'failed'
  });

  return formatOrderResponse(updatedOrder);
}

export async function getOrdersByUser(userId: number, limit: number = 10): Promise<OrderResponse[]> {
  const orders = await OrderQuery.getOrdersByUser(userId, limit);
  return orders.map(formatOrderResponse);
}

export async function getOrdersByStatus(status: string, limit: number = 50): Promise<OrderResponse[]> {
  const orders = await OrderQuery.getOrdersByStatus(status, limit);
  
  // Get order items for each order
  const ordersWithItems = await Promise.all(
    orders.map(async (order) => {
      const orderItems = await OrderQuery.getOrderItems(order.id);
      const formattedOrder = formatOrderResponse(order);
      formattedOrder.items = orderItems.map(formatOrderItemResponse);
      return formattedOrder;
    })
  );
  
  return ordersWithItems;
}

export async function getOrdersByPaymentStatus(paymentStatus: string, limit: number = 50): Promise<OrderResponse[]> {
  const orders = await OrderQuery.getOrdersByPaymentStatus(paymentStatus, limit);
  
  // Get order items for each order
  const ordersWithItems = await Promise.all(
    orders.map(async (order) => {
      const orderItems = await OrderQuery.getOrderItems(order.id);
      const formattedOrder = formatOrderResponse(order);
      formattedOrder.items = orderItems.map(formatOrderItemResponse);
      return formattedOrder;
    })
  );
  
  return ordersWithItems;
}

export async function getOrderStats() {
  const stats = await OrderQuery.getOrderStats() as any;
  if (!stats) {
    return {
      total_orders: 0,
      pending_payments: 0,
      completed_payments: 0,
      pending_orders: 0,
      processing_orders: 0,
      completed_orders: 0,
      total_revenue: '0.00'
    };
  }
  
  return {
    total_orders: parseInt(stats.total_orders || '0'),
    pending_payments: parseInt(stats.pending_payments || '0'),
    completed_payments: parseInt(stats.completed_payments || '0'),
    pending_orders: parseInt(stats.pending_orders || '0'),
    processing_orders: parseInt(stats.processing_orders || '0'),
    completed_orders: parseInt(stats.completed_orders || '0'),
    total_revenue: parseFloat(stats.total_revenue || '0').toFixed(2)
  };
}

// Paystack HTTP request function - Initialize transaction to get authorization URL
async function initializePaystackCharge(order: any, customerEmail: string): Promise<any> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("Paystack secret key not configured");
  }

  const paystackData = {
    email: customerEmail,
    amount: Math.round(parseFloat(order.total_price) * 100), // Paystack expects amount in kobo
    currency: 'GHS',
    reference: order.reference,
    callback_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/callback`,
    metadata: {
      order_id: order.id,
      customer_name: order.customer_name,
      delivery_address: order.delivery_address
    }
  };

  try {
    // First, initialize the transaction to get authorization URL
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

    // The initialize endpoint always returns authorization_url for frontend dialog
    return result;
  } catch (error) {
    console.error('Paystack transaction initialization failed:', error);
    throw error;
  }
}


// Helper functions
function formatOrderResponse(order: any): OrderResponse {
  return {
    id: order.id,
    user_id: order.user_id,
    quantity: order.quantity,
    subtotal: order.subtotal?.toString() || '0',
    delivery_cost: order.delivery_cost?.toString() || null,
    total_price: order.total_price.toString(),
    delivery_option_id: order.delivery_option_id,
    delivery_option_name: order.delivery_option_name,
    status: order.status,
    payment_status: order.payment_status,
    payment_reference: order.payment_reference,
    reference: order.reference,
    delivery_address: order.delivery_address,
    customer_email: order.customer_email,
    customer_phone: order.customer_phone,
    customer_name: order.customer_name,
    metadata: order.metadata || null,
    created_at: order.created_at.toISOString(),
    user_username: order.user_username,
    user_email: order.user_email
  };
}

function formatOrderItemResponse(orderItem: any): OrderItemResponse {
  return {
    id: orderItem.id,
    order_id: orderItem.order_id,
    product_id: orderItem.product_id,
    product_name: orderItem.product_name,
    product_description: orderItem.product_description,
    product_images: orderItem.product_images,
    product_type_name: orderItem.product_type_name,
    quantity: orderItem.quantity,
    price: orderItem.price.toString(),
    created_at: orderItem.created_at.toISOString()
  };
}
