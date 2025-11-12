# Orders API Documentation

This document provides comprehensive examples of how to use the Orders API endpoints for e-commerce order management.

## Overview

The Orders API provides full order management functionality including:
- Order creation with automatic stock validation
- Order tracking and status management
- Payment status tracking
- Order filtering and search capabilities
- Order statistics and analytics
- User-specific order history
- Order cancellation with stock restoration

## Base URL
```
http://localhost:8080
```

## Authentication

Most endpoints require authentication using a JWT token:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Create Order
**POST** `/orders`

Creates a new order with items and calculates total including delivery cost. This is a public endpoint that supports both guest orders and authenticated user orders.

**Request Body:**
```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    },
    {
      "product_id": 3,
      "quantity": 1
    }
  ],
  "delivery_option_id": 1,
  "delivery_address": "123 Main St, City, State",
  "customer_email": "customer@example.com",
  "customer_phone": "+1234567890",
  "customer_name": "John Doe",
  "metadata": {
    "gift_message": "Happy Birthday!",
    "special_instructions": "Please call before delivery",
    "source": "mobile_app",
    "campaign_id": "SUMMER2023"
  }
}
```

**Note:** The `metadata` field is optional and can contain any JSON object with client-specific data. This is useful for storing additional information like gift messages, special instructions, tracking IDs, campaign information, or any custom data your application needs.

**Example Request:**
```bash
curl -X POST http://localhost:8080/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"product_id": 1, "quantity": 2},
      {"product_id": 3, "quantity": 1}
    ],
    "delivery_option_id": 1,
    "delivery_address": "123 Main St, City, State",
    "customer_email": "customer@example.com",
    "customer_phone": "+1234567890",
    "customer_name": "John Doe",
    "metadata": {
      "gift_message": "Happy Birthday!",
      "source": "mobile_app"
    }
  }'
```

**Example Response:**
```json
{
  "id": 1,
  "user_id": null,
  "quantity": 3,
  "subtotal": "299.97",
  "delivery_cost": "15.00",
  "total_price": "314.97",
  "delivery_option_id": 1,
  "delivery_option_name": "Express Delivery",
  "status": "pending",
  "payment_status": "pending",
  "reference": "ORD-1234567890-001",
  "delivery_address": "123 Main St, City, State",
  "customer_email": "customer@example.com",
  "customer_phone": "+1234567890",
  "customer_name": "John Doe",
  "metadata": {
    "gift_message": "Happy Birthday!",
    "source": "mobile_app"
  },
  "created_at": "2023-01-01T00:00:00.000Z",
  "items": [
    {
      "id": 1,
      "product_id": 1,
      "product_name": "Premium Headphones",
      "quantity": 2,
      "price": "199.99"
    },
    {
      "id": 2,
      "product_id": 3,
      "quantity": 1,
      "price": "99.99"
    }
  ]
}
```

### 2. Get All Orders (Admin Only)
**GET** `/orders`

Retrieves a paginated list of orders with optional filtering. Requires admin role.

**Query Parameters:**
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 20, max: 100) - Items per page
- `status` (string) - Filter by order status: pending, processing, shipped, delivered, cancelled
- `payment_status` (string) - Filter by payment status: pending, processing, completed, failed, refunded
- `customer_email` (string) - Filter by customer email
- `date_from` (string, format: YYYY-MM-DD) - Filter orders from this date
- `date_to` (string, format: YYYY-MM-DD) - Filter orders to this date
- `sort_by` (string, default: created_at) - Sort field: created_at, total_price, status, payment_status
- `sort_order` (string, default: desc) - Sort order: asc, desc

**Example Request:**
```bash
curl -X GET "http://localhost:8080/orders?page=1&limit=10&status=pending&sort_by=created_at&sort_order=desc" \
  -H "Authorization: Bearer <your-jwt-token>"
```

### 3. Get Current User's Orders
**GET** `/orders/my-orders`

Retrieves orders for the authenticated user.

**Query Parameters:**
- `limit` (integer, default: 10, max: 50) - Number of orders to return

**Example Request:**
```bash
curl -X GET "http://localhost:8080/orders/my-orders?limit=20" \
  -H "Authorization: Bearer <your-jwt-token>"
```

### 4. Get Order Statistics (Admin Only)
**GET** `/orders/stats`

Retrieves order and payment statistics. Requires admin role.

**Example Request:**
```bash
curl -X GET http://localhost:8080/orders/stats \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Example Response:**
```json
{
  "total_orders": 150,
  "pending_payments": 25,
  "completed_payments": 100,
  "pending_orders": 30,
  "processing_orders": 45,
  "completed_orders": 60,
  "total_revenue": "15750.50"
}
```

### 5. Get Orders by Status (Admin Only)
**GET** `/orders/status/{status}`

Retrieves orders with a specific status. Requires admin role.

**Path Parameters:**
- `status` (required) - Order status: pending, processing, shipped, delivered, cancelled

**Query Parameters:**
- `limit` (integer, default: 50, max: 100) - Number of orders to return

**Example Request:**
```bash
curl -X GET "http://localhost:8080/orders/status/pending?limit=25" \
  -H "Authorization: Bearer <your-jwt-token>"
```

### 6. Get Orders by Payment Status (Admin Only)
**GET** `/orders/payment-status/{paymentStatus}`

Retrieves orders with a specific payment status. Requires admin role.

**Path Parameters:**
- `paymentStatus` (required) - Payment status: pending, processing, completed, failed, refunded

**Example Request:**
```bash
curl -X GET "http://localhost:8080/orders/payment-status/completed?limit=30" \
  -H "Authorization: Bearer <your-jwt-token>"
```

### 7. Get Order by Reference
**GET** `/orders/reference/{reference}`

Retrieves an order by its unique reference. This is a public endpoint useful for payment callbacks.

**Example Request:**
```bash
curl -X GET http://localhost:8080/orders/reference/ORD-1234567890-001
```

### 8. Get Order by ID
**GET** `/orders/{id}`

Retrieves a specific order by its ID. This is a public endpoint.

**Example Request:**
```bash
curl -X GET http://localhost:8080/orders/1
```

### 9. Update Order (Admin Only)
**PUT** `/orders/{id}`

Updates a specific order by its ID. Requires admin role.

**Request Body:**
```json
{
  "status": "processing",
  "payment_status": "completed",
  "payment_reference": "PAY-123456789",
  "delivery_address": "Updated address",
  "metadata": {
    "internal_notes": "VIP customer",
    "warehouse_location": "Section A"
  }
}
```

**Note:** The `metadata` field can be updated independently or alongside other fields. You can add new properties to existing metadata or replace it entirely.

**Example Request:**
```bash
curl -X PUT http://localhost:8080/orders/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "status": "processing",
    "payment_status": "completed"
  }'
```

### 10. Cancel Order
**PATCH** `/orders/{id}/cancel`

Cancels an order and restores product stock if applicable. This is a public endpoint with business logic restrictions.

**Example Request:**
```bash
curl -X PATCH http://localhost:8080/orders/1/cancel
```

**Example Response:**
```json
{
  "id": 1,
  "status": "cancelled",
  "payment_status": "refunded",
  "message": "Order cancelled successfully"
}
```

## Order Status Flow

### Order Statuses
- `pending` - Order created, awaiting payment
- `processing` - Payment received, order being prepared
- `shipped` - Order dispatched for delivery
- `delivered` - Order successfully delivered
- `cancelled` - Order cancelled

### Payment Statuses
- `pending` - Payment not yet processed
- `processing` - Payment being processed
- `completed` - Payment successful
- `failed` - Payment failed
- `refunded` - Payment refunded

## Frontend Integration Examples

### React Order Management Component

```tsx
import React, { useState, useEffect } from 'react';

interface Order {
  id: number;
  reference: string;
  total_price: string;
  status: string;
  payment_status: string;
  customer_name: string;
  customer_email: string;
  created_at: string;
  items: OrderItem[];
}

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  price: string;
}

const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    payment_status: '',
    page: 1,
    limit: 20
  });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.payment_status && { payment_status: filters.payment_status })
      });

      const response = await fetch(`/orders?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      setOrders(data.orders || data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      const response = await fetch(`/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        fetchOrders(); // Refresh orders
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'orange';
      case 'processing': return 'blue';
      case 'shipped': return 'purple';
      case 'delivered': return 'green';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div className="order-management">
      <div className="filters">
        <select 
          value={filters.status} 
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select 
          value={filters.payment_status} 
          onChange={(e) => setFilters(prev => ({ ...prev, payment_status: e.target.value }))}
        >
          <option value="">All Payment Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {loading ? (
        <div>Loading orders...</div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <h3>Order #{order.reference}</h3>
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(order.status) }}
                >
                  {order.status}
                </span>
              </div>
              
              <div className="order-details">
                <p><strong>Customer:</strong> {order.customer_name}</p>
                <p><strong>Email:</strong> {order.customer_email}</p>
                <p><strong>Total:</strong> ${order.total_price}</p>
                <p><strong>Payment Status:</strong> {order.payment_status}</p>
                <p><strong>Date:</strong> {new Date(order.created_at).toLocaleDateString()}</p>
              </div>

              <div className="order-items">
                <h4>Items:</h4>
                {order.items?.map(item => (
                  <div key={item.id} className="order-item">
                    {item.product_name} x{item.quantity} - ${item.price}
                  </div>
                ))}
              </div>

              <div className="order-actions">
                <select 
                  value={order.status}
                  onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
```

### Order Creation Service

```typescript
interface CreateOrderRequest {
  items: Array<{
    product_id: number;
    quantity: number;
  }>;
  delivery_option_id?: number;
  delivery_address?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_name?: string;
}

class OrderService {
  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    const response = await fetch('/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') && {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        })
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create order');
    }

    return response.json();
  }

  async getMyOrders(limit = 10): Promise<Order[]> {
    const response = await fetch(`/orders/my-orders?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }

    return response.json();
  }

  async getOrderByReference(reference: string): Promise<Order> {
    const response = await fetch(`/orders/reference/${reference}`);
    
    if (!response.ok) {
      throw new Error('Order not found');
    }

    return response.json();
  }

  async cancelOrder(orderId: number): Promise<Order> {
    const response = await fetch(`/orders/${orderId}/cancel`, {
      method: 'PATCH'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to cancel order');
    }

    return response.json();
  }
}

export default new OrderService();
```

### Shopping Cart Integration

```typescript
interface CartItem {
  product_id: number;
  quantity: number;
  product_name: string;
  price: number;
}

class ShoppingCart {
  private items: CartItem[] = [];

  addItem(item: CartItem) {
    const existingItem = this.items.find(i => i.product_id === item.product_id);
    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      this.items.push(item);
    }
  }

  removeItem(productId: number) {
    this.items = this.items.filter(item => item.product_id !== productId);
  }

  getTotal(): number {
    return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  async checkout(customerInfo: {
    delivery_option_id: number;
    delivery_address: string;
    customer_email: string;
    customer_phone: string;
    customer_name: string;
  }): Promise<Order> {
    const orderData: CreateOrderRequest = {
      items: this.items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      })),
      ...customerInfo
    };

    try {
      const order = await OrderService.createOrder(orderData);
      this.items = []; // Clear cart after successful order
      return order;
    } catch (error) {
      throw error;
    }
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "\"items\" must contain at least 1 items"
}
```

### 401 Unauthorized
```json
{
  "error": "Access denied. No token provided."
}
```

### 403 Forbidden
```json
{
  "error": "Access denied. Insufficient role."
}
```

### 404 Not Found
```json
{
  "error": "Order not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Insufficient stock for product: Premium Headphones"
}
```

## Best Practices

### 1. Stock Validation
Always validate product availability before creating orders:
```javascript
// Check availability before adding to cart
const availability = await fetch(`/products/${productId}/availability?quantity=${quantity}`);
const { available } = await availability.json();

if (!available) {
  showError('Product not available in requested quantity');
  return;
}
```

### 2. Order Reference Tracking
Use order references for customer communication:
```javascript
const order = await OrderService.createOrder(orderData);
console.log(`Order created: ${order.reference}`);
// Send reference to customer via email
```

### 3. Status Updates
Implement real-time order status updates:
```javascript
const pollOrderStatus = async (orderId) => {
  const order = await fetch(`/orders/${orderId}`).then(r => r.json());
  updateUI(order.status);
  
  if (order.status !== 'delivered' && order.status !== 'cancelled') {
    setTimeout(() => pollOrderStatus(orderId), 30000); // Poll every 30 seconds
  }
};
```

### 4. Error Handling
Handle order creation errors gracefully:
```javascript
try {
  const order = await OrderService.createOrder(orderData);
  showSuccess(`Order ${order.reference} created successfully!`);
} catch (error) {
  if (error.message.includes('Insufficient stock')) {
    showError('Some items are out of stock. Please update your cart.');
  } else {
    showError('Failed to create order. Please try again.');
  }
}
```

## API Documentation

Full interactive API documentation is available at: `http://localhost:8080/docs`

This includes all endpoints with request/response examples and the ability to test endpoints directly from the browser.
