# Bundles API Documentation

This document describes the Bundle endpoints for the romofete_api. Bundles allow users to group products together, optionally with discounts, making it easier to manage product collections and provide similar product recommendations.

## Base URL
All endpoints are prefixed with `/bundles`

## Endpoints

### 1. Create Bundle
**POST** `/bundles`

Creates a new bundle with products.

#### Request Body
```json
{
  "name": "Summer Collection",
  "description": "A collection of summer products",
  "discount_percentage": 10.5,
  "is_active": true,
  "products": [
    {
      "product_id": 1,
      "quantity": 2
    },
    {
      "product_id": 3,
      "quantity": 1
    }
  ]
}
```

#### Response
```json
{
  "success": true,
  "message": "Bundle created successfully",
  "data": {
    "id": 1,
    "name": "Summer Collection",
    "description": "A collection of summer products",
    "discount_percentage": "10.50",
    "is_active": true,
    "created_at": "2025-09-19T14:00:00.000Z",
    "updated_at": "2025-09-19T14:00:00.000Z",
    "products": [
      {
        "bundle_product_id": 1,
        "quantity": 2,
        "product_id": 1,
        "product_name": "Product 1",
        "product_description": "Description",
        "product_price": "29.99",
        "product_stock": 100,
        "product_images": ["image1.jpg"],
        "product_type_name": "Electronics"
      }
    ]
  }
}
```

### 2. Get All Bundles
**GET** `/bundles`

Retrieves all bundles with optional filtering and pagination.

#### Query Parameters
- `is_active` (boolean, optional): Filter by active status
- `search` (string, optional): Search in bundle name and description
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)
- `sort_by` (string, optional): Sort field (name, created_at, discount_percentage)
- `sort_order` (string, optional): Sort order (asc, desc)

#### Response
```json
{
  "success": true,
  "message": "Bundles retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Summer Collection",
      "description": "A collection of summer products",
      "discount_percentage": "10.50",
      "is_active": true,
      "created_at": "2025-09-19T14:00:00.000Z",
      "products_count": 3,
      "total_value": 89.97
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

### 3. Get Bundle by ID
**GET** `/bundles/:id`

Retrieves a specific bundle with all its products.

#### Response
```json
{
  "success": true,
  "message": "Bundle retrieved successfully",
  "data": {
    "id": 1,
    "name": "Summer Collection",
    "description": "A collection of summer products",
    "discount_percentage": "10.50",
    "is_active": true,
    "created_at": "2025-09-19T14:00:00.000Z",
    "updated_at": "2025-09-19T14:00:00.000Z",
    "products": [
      {
        "bundle_product_id": 1,
        "quantity": 2,
        "product_id": 1,
        "product_name": "Product 1",
        "product_description": "Description",
        "product_price": "29.99",
        "product_stock": 100,
        "product_images": ["image1.jpg"],
        "product_type_name": "Electronics"
      }
    ]
  }
}
```

### 4. Update Bundle
**PUT** `/bundles/:id`

Updates bundle information (not the products).

#### Request Body
```json
{
  "name": "Updated Summer Collection",
  "description": "Updated description",
  "discount_percentage": 15.0,
  "is_active": false
}
```

#### Response
```json
{
  "success": true,
  "message": "Bundle updated successfully",
  "data": {
    // Updated bundle data with products
  }
}
```

### 5. Delete Bundle
**DELETE** `/bundles/:id`

Soft deletes a bundle and all its associated products.

#### Response
```json
{
  "success": true,
  "message": "Bundle deleted successfully"
}
```

### 6. Add Product to Bundle
**POST** `/bundles/:id/products`

Adds a single product to an existing bundle.

#### Request Body
```json
{
  "product_id": 5,
  "quantity": 1
}
```

#### Response
```json
{
  "success": true,
  "message": "Product added to bundle successfully",
  "data": {
    // Updated bundle data with all products
  }
}
```

### 7. Bulk Add Products to Bundle
**POST** `/bundles/:id/products/bulk`

Adds multiple products to a bundle at once.

#### Request Body
```json
{
  "products": [
    {
      "product_id": 5,
      "quantity": 1
    },
    {
      "product_id": 6,
      "quantity": 2
    }
  ]
}
```

#### Response
```json
{
  "success": true,
  "message": "Products added to bundle successfully",
  "data": {
    // Updated bundle data with all products
  }
}
```

### 8. Remove Product from Bundle
**DELETE** `/bundles/:id/products/:productId`

Removes a product from a bundle.

#### Response
```json
{
  "success": true,
  "message": "Product removed from bundle successfully",
  "data": {
    // Updated bundle data with remaining products
  }
}
```

### 9. Update Product Quantity in Bundle
**PUT** `/bundles/:id/products/:productId`

Updates the quantity of a product in a bundle.

#### Request Body
```json
{
  "quantity": 3
}
```

#### Response
```json
{
  "success": true,
  "message": "Product quantity updated successfully",
  "data": {
    // Updated bundle data with all products
  }
}
```

### 10. Calculate Bundle Price
**GET** `/bundles/:id/price`

Calculates the total price of a bundle with discount applied.

#### Response
```json
{
  "success": true,
  "message": "Bundle price calculated successfully",
  "data": {
    "bundle_id": 1,
    "original_price": 89.97,
    "discount_percentage": 10.5,
    "discount_amount": 9.45,
    "final_price": 80.52,
    "products_count": 3
  }
}
```

### 11. Get Bundle Statistics
**GET** `/bundles/stats/overview`

Retrieves overall bundle statistics.

#### Response
```json
{
  "success": true,
  "message": "Bundle statistics retrieved successfully",
  "data": {
    "total_bundles": 25,
    "active_bundles": 20,
    "inactive_bundles": 5,
    "average_products_per_bundle": 3.2,
    "total_bundle_value": 2450.75
  }
}
```

### 12. Get Similar Products (Bundle-based)
**GET** `/bundles/similar-products/:productId`

Gets products that appear in the same bundles as the specified product.

#### Query Parameters
- `limit` (number, optional): Maximum number of products to return (default: 10)

#### Response
```json
{
  "success": true,
  "message": "Similar products retrieved successfully",
  "data": [
    {
      "id": 2,
      "name": "Related Product",
      "description": "Product description",
      "price": "19.99",
      "stock": 50,
      "product_type_name": "Electronics",
      "shared_bundles_count": "3"
    }
  ]
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    "\"name\" is required",
    "\"products\" must contain at least 1 items"
  ]
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Bundle not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "Product is already in this bundle"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to create bundle: Database connection error"
}
```

## Business Logic

### Bundle Creation
- All products in the bundle must exist
- Products cannot be duplicated within the same bundle
- Discount percentage is optional and must be between 0-100
- Bundles are active by default

### Similar Products Enhancement
- The similar products endpoint prioritizes products that appear in the same bundles
- This provides more relevant recommendations based on actual product groupings
- Falls back to traditional similarity algorithms when bundle data is insufficient

### Price Calculation
- Bundle price is calculated as the sum of (product_price × quantity) for all products
- Discount is applied to the total if discount_percentage is set
- Original price, discount amount, and final price are all returned

### Soft Deletion
- Bundles and bundle-product relationships use soft deletion
- Deleted bundles are excluded from all queries
- Bundle deletion also soft-deletes all associated bundle-product records

## Integration with Products API

The bundles feature enhances the existing products API:

1. **Enhanced Similar Products**: The `/products/:id/similar` endpoint now includes bundle-based recommendations
2. **Bundle Context**: Products can now show which bundles they belong to
3. **Cross-selling**: Bundle data enables better product recommendations and cross-selling opportunities

## Use Cases

1. **Product Collections**: Group related products (e.g., "Gaming Setup", "Kitchen Essentials")
2. **Promotional Bundles**: Create discounted product combinations
3. **Seasonal Collections**: Organize products by season or theme
4. **Cross-selling**: Recommend products that are commonly bought together
5. **Inventory Management**: Manage product groups more efficiently
