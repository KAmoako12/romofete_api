# Personalized Orders API Documentation

This document provides comprehensive information about the Personalized Orders API endpoints.

## Overview

The Personalized Orders API allows customers to create custom order requests with personalized messages, color selections, and metadata. When a new personalized order is created, an automated email notification is sent to `info@romofete.com` with all order details.

## Database Migration

Before using these endpoints, run the database migration to create the `personalized_orders` table:

```bash
pnpm knex migrate:latest
# or
npx knex migrate:latest
```

## Table Schema

The `personalized_orders` table includes:

- `id` - Primary key (auto-increment)
- `custom_message` - Text (required) - Custom message from the customer
- `selected_colors` - JSON array (nullable) - List of selected colors
- `product_type` - String (required) - Type of product being ordered
- `metadata` - JSON object (nullable) - Additional order metadata
- `amount` - Decimal (nullable) - Order amount
- `order_status` - String (default: 'pending') - Order status
- `delivery_status` - String (default: 'pending') - Delivery status
- `created_at` - Timestamp - Order creation time
- `updated_at` - Timestamp - Last update time
- `deleted_at` - Timestamp (nullable) - Soft delete timestamp
- `is_deleted` - Boolean (default: false) - Soft delete flag

## Status Values

### Order Status
- `pending` - Order is pending
- `processing` - Order is being processed
- `shipped` - Order has been shipped
- `delivered` - Order has been delivered
- `cancelled` - Order has been cancelled

### Delivery Status
- `pending` - Delivery is pending
- `in_transit` - Order is in transit
- `delivered` - Order has been delivered
- `failed` - Delivery failed

## Endpoints

### 1. Create Personalized Order

Creates a new personalized order and sends an email notification to admin.

**Endpoint:** `POST /personalized-orders`

**Access:** Public (no authentication required)

**Request Body:**
```json
{
  "custom_message": "Please add my company logo on the front",
  "selected_colors": ["red", "blue", "white"],
  "product_type": "Custom T-Shirt",
  "metadata": {
    "size": "XL",
    "quantity": 50,
    "logo_position": "center"
  },
  "amount": 750.00
}
```

**Required Fields:**
- `custom_message` (string) - Custom message for the order
- `product_type` (string) - Type of product being ordered

**Optional Fields:**
- `selected_colors` (array of strings) - List of selected colors
- `metadata` (object) - Additional metadata
- `amount` (number) - Order amount

**Response:** `201 Created`
```json
{
  "id": 1,
  "custom_message": "Please add my company logo on the front",
  "selected_colors": ["red", "blue", "white"],
  "product_type": "Custom T-Shirt",
  "metadata": {
    "size": "XL",
    "quantity": 50,
    "logo_position": "center"
  },
  "amount": "750.00",
  "order_status": "pending",
  "delivery_status": "pending",
  "created_at": "2023-11-22T21:00:00.000Z",
  "updated_at": "2023-11-22T21:00:00.000Z"
}
```

**Email Notification:**
When a personalized order is created, an email is automatically sent to `info@romofete.com` with:
- Order ID
- Custom Message (formatted as "Custom Message")
- Selected Colors (formatted as "Selected Colors")
- Product Type (formatted as "Product Type")
- Metadata (formatted as "Metadata")
- Amount (formatted as "Amount")
- Order Status (formatted as "Order Status")
- Delivery Status (formatted as "Delivery Status")

All field names are converted from snake_case to Title Case in the email.

---

### 2. Get All Personalized Orders

Retrieves all personalized orders with pagination and filtering options.

**Endpoint:** `GET /personalized-orders`

**Access:** Admin only (requires JWT token)

**Authentication:** Bearer Token (JWT)

**Query Parameters:**
- `order_status` (optional) - Filter by order status (pending, processing, shipped, delivered, cancelled)
- `delivery_status` (optional) - Filter by delivery status (pending, in_transit, delivered, failed)
- `product_type` (optional) - Filter by product type
- `date_from` (optional) - Filter orders created after this date (ISO 8601 format)
- `date_to` (optional) - Filter orders created before this date (ISO 8601 format)
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 20, max: 100) - Items per page
- `sort_by` (optional, default: created_at) - Field to sort by (created_at, amount, order_status, delivery_status)
- `sort_order` (optional, default: desc) - Sort order (asc, desc)

**Example Request:**
```
GET /personalized-orders?order_status=pending&page=1&limit=10&sort_by=created_at&sort_order=desc
Authorization: Bearer <your-jwt-token>
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "custom_message": "Please add my company logo on the front",
      "selected_colors": ["red", "blue", "white"],
      "product_type": "Custom T-Shirt",
      "metadata": {
        "size": "XL",
        "quantity": 50
      },
      "amount": "750.00",
      "order_status": "pending",
      "delivery_status": "pending",
      "created_at": "2023-11-22T21:00:00.000Z",
      "updated_at": "2023-11-22T21:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

### 3. Get Personalized Order by ID

Retrieves a single personalized order by its ID.

**Endpoint:** `GET /personalized-orders/:id`

**Access:** Admin only (requires JWT token)

**Authentication:** Bearer Token (JWT)

**Path Parameters:**
- `id` (required) - Personalized order ID

**Example Request:**
```
GET /personalized-orders/1
Authorization: Bearer <your-jwt-token>
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "custom_message": "Please add my company logo on the front",
  "selected_colors": ["red", "blue", "white"],
  "product_type": "Custom T-Shirt",
  "metadata": {
    "size": "XL",
    "quantity": 50
  },
  "amount": "750.00",
  "order_status": "pending",
  "delivery_status": "pending",
  "created_at": "2023-11-22T21:00:00.000Z",
  "updated_at": "2023-11-22T21:00:00.000Z"
}
```

**Error Response:** `404 Not Found`
```json
{
  "error": "Personalized order not found"
}
```

---

### 4. Update Personalized Order

Updates a personalized order. All fields are optional, but at least one field must be provided.

**Endpoint:** `PUT /personalized-orders/:id`

**Access:** Admin only (requires JWT token)

**Authentication:** Bearer Token (JWT)

**Path Parameters:**
- `id` (required) - Personalized order ID

**Request Body:**
```json
{
  "custom_message": "Updated message",
  "selected_colors": ["red", "green"],
  "product_type": "Custom Hoodie",
  "metadata": {
    "size": "L",
    "quantity": 30
  },
  "amount": 500.00,
  "order_status": "processing",
  "delivery_status": "pending"
}
```

**All Fields (Optional):**
- `custom_message` (string) - Custom message for the order
- `selected_colors` (array of strings) - List of selected colors
- `product_type` (string) - Type of product being ordered
- `metadata` (object) - Additional metadata
- `amount` (number) - Order amount
- `order_status` (string) - Order status (pending, processing, shipped, delivered, cancelled)
- `delivery_status` (string) - Delivery status (pending, in_transit, delivered, failed)

**Example Request:**
```
PUT /personalized-orders/1
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "order_status": "processing",
  "delivery_status": "pending"
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "custom_message": "Please add my company logo on the front",
  "selected_colors": ["red", "blue", "white"],
  "product_type": "Custom T-Shirt",
  "metadata": {
    "size": "XL",
    "quantity": 50
  },
  "amount": "750.00",
  "order_status": "processing",
  "delivery_status": "pending",
  "created_at": "2023-11-22T21:00:00.000Z",
  "updated_at": "2023-11-22T21:05:00.000Z"
}
```

**Error Responses:**

`400 Bad Request` - Invalid input
```json
{
  "error": "\"order_status\" must be one of [pending, processing, shipped, delivered, cancelled]"
}
```

`404 Not Found` - Order not found
```json
{
  "error": "Personalized order not found"
}
```

---

### 5. Delete Personalized Order

Soft deletes a personalized order by setting `is_deleted` to true.

**Endpoint:** `DELETE /personalized-orders/:id`

**Access:** Admin only (requires JWT token)

**Authentication:** Bearer Token (JWT)

**Path Parameters:**
- `id` (required) - Personalized order ID

**Example Request:**
```
DELETE /personalized-orders/1
Authorization: Bearer <your-jwt-token>
```

**Response:** `200 OK`
```json
{
  "message": "Personalized order deleted successfully"
}
```

**Error Response:** `404 Not Found`
```json
{
  "error": "Personalized order not found"
}
```

---

## Error Handling

All endpoints return appropriate HTTP status codes and error messages:

- `400 Bad Request` - Invalid input or validation error
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Insufficient permissions (not admin)
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Authentication

Admin endpoints require a JWT token obtained from the login endpoint. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Email Configuration

Ensure the following environment variables are set for email notifications:

- `SMTP2GO_API_KEY` - SMTP2GO API key
- `SMTP2GO_FROM_EMAIL` - Sender email address (default: noreply@romofete.com)

## Testing the API

You can test the API using:

1. **Swagger UI**: Navigate to `/docs` on your server
2. **cURL**:
```bash
# Create a personalized order
curl -X POST http://localhost:8080/personalized-orders \
  -H "Content-Type: application/json" \
  -d '{
    "custom_message": "Please add my logo",
    "product_type": "Custom T-Shirt",
    "amount": 100.00
  }'

# Get all orders (requires admin token)
curl -X GET http://localhost:8080/personalized-orders \
  -H "Authorization: Bearer <your-jwt-token>"

# Update order status (requires admin token)
curl -X PUT http://localhost:8080/personalized-orders/1 \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "order_status": "processing"
  }'
```

3. **Postman**: Import the API collection from `/swagger.json`

## Notes

- The POST endpoint is public to allow customers to create orders without authentication
- All other endpoints require admin authentication
- Email notifications are sent asynchronously and won't block the API response
- If email sending fails, the order is still created successfully (failure is logged to console)
- All monetary amounts are stored as decimal values and returned as strings in API responses
- Field names in emails are automatically converted from snake_case to Title Case for better readability
- Timestamps are in ISO 8601 format (UTC)
