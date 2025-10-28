# Pricing Config API Documentation

This document provides information about the Pricing Config API endpoints.

## Base URL
```
http://localhost:8080/pricing-config
```

## Endpoints

### 1. List All Pricing Configs
Get a list of all pricing configurations, optionally filtered by product type.

**Endpoint:** `GET /pricing-config`

**Authentication:** Not required

**Query Parameters:**
- `product_type_id` (optional): Filter pricing configs by product type ID

**Examples:**
```
GET /pricing-config                    // Get all pricing configs
GET /pricing-config?product_type_id=1  // Get pricing configs for product type 1
```

**Response:**
```json
[
  {
    "id": 1,
    "min_price": "0.00",
    "max_price": "100.00",
    "product_type_id": 1,
    "created_at": "2023-01-01T00:00:00.000Z"
  }
]
```

---

### 2. Get Pricing Config by ID
Retrieve a specific pricing configuration by its ID.

**Endpoint:** `GET /pricing-config/:id`

**Authentication:** Not required

**Parameters:**
- `id` (path parameter): The ID of the pricing config

**Response:**
```json
{
  "id": 1,
  "min_price": "0.00",
  "max_price": "100.00",
  "product_type_id": 1,
  "created_at": "2023-01-01T00:00:00.000Z"
}
```

---

### 3. Create Pricing Config
Create a new pricing configuration.

**Endpoint:** `POST /pricing-config`

**Authentication:** Required (Admin/SuperAdmin role)

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "min_price": 10.00,
  "max_price": 500.00,
  "product_type_id": 1
}
```

**Field Descriptions:**
- `min_price` (optional): Minimum price (defaults to 0 if not provided)
- `max_price` (optional): Maximum price (can be null for no maximum)
- `product_type_id` (optional): ID of the product type this config applies to (can be null for general config)

**Response:**
```json
{
  "id": 1,
  "min_price": "10.00",
  "max_price": "500.00",
  "product_type_id": 1,
  "created_at": "2023-01-01T00:00:00.000Z"
}
```

---

### 4. Update Pricing Config
Update an existing pricing configuration.

**Endpoint:** `PUT /pricing-config/:id`

**Authentication:** Required (Admin/SuperAdmin role)

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Parameters:**
- `id` (path parameter): The ID of the pricing config to update

**Request Body:**
```json
{
  "min_price": 15.00,
  "max_price": 600.00,
  "product_type_id": 2
}
```

**Note:** At least one field must be provided for update.

**Response:**
```json
{
  "id": 1,
  "min_price": "15.00",
  "max_price": "600.00",
  "product_type_id": 2,
  "created_at": "2023-01-01T00:00:00.000Z"
}
```

---

### 5. Delete Pricing Config
Delete a pricing configuration (soft delete).

**Endpoint:** `DELETE /pricing-config/:id`

**Authentication:** Required (Admin/SuperAdmin role)

**Headers:**
```
Authorization: Bearer <token>
```

**Parameters:**
- `id` (path parameter): The ID of the pricing config to delete

**Response:**
```json
{
  "message": "Pricing config deleted",
  "pricingConfig": {
    "id": 1,
    "min_price": "10.00",
    "max_price": "500.00",
    "product_type_id": 1,
    "created_at": "2023-01-01T00:00:00.000Z"
  }
}
```

---

## Database Schema

The `pricing_config` table has the following structure:

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | integer | No | auto | Primary key |
| min_price | decimal(10,2) | No | 0 | Minimum price |
| max_price | decimal(10,2) | Yes | null | Maximum price |
| product_type_id | integer | Yes | null | Foreign key to product_types table |
| created_at | timestamp | No | now() | Creation timestamp |
| deleted_at | timestamp | Yes | null | Soft delete timestamp |
| is_deleted | boolean | No | false | Soft delete flag |

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid pricing config id"
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
  "error": "Pricing config not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Database connection failed"
}
```

---

## Use Cases

1. **General Price Range:** Create a pricing config without `product_type_id` to set a general price range for all products.

2. **Product Type Specific:** Create a pricing config with `product_type_id` to set specific price ranges for particular product types.

3. **Minimum Only:** Set only `min_price` and leave `max_price` as null if you want to enforce only a minimum price.

4. **Full Range:** Set both `min_price` and `max_price` to enforce a specific price range.

---

## Swagger Documentation

Full API documentation with interactive testing is available at:
```
http://localhost:8080/docs
