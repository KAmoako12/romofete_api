# Sub-Categories API Documentation

## Overview
The Sub-Categories module provides CRUD endpoints to manage product sub-categories. Sub-categories belong to product types and can be optionally assigned to products.

## Database Schema

### sub_categories Table
- `id` (integer, primary key) - Unique identifier
- `name` (string, max 100 chars) - Sub-category name
- `product_type_id` (integer, foreign key) - Reference to parent product type
- `created_at` (timestamp) - Creation timestamp
- `deleted_at` (timestamp, nullable) - Soft delete timestamp
- `is_deleted` (boolean) - Soft delete flag

### Relationships
- **Many-to-One with product_types**: Each sub-category belongs to one product type
- **One-to-Many with products**: Products can optionally reference a sub-category
- **Cascade Delete**: When a product_type is deleted, all its sub-categories are cascade deleted
- **Set NULL on Delete**: When a sub-category is deleted, products' sub_category_id is set to NULL

## API Endpoints

### Base URL: `/sub-categories`

---

### 1. List Sub-Categories (GET /)
Get all sub-categories with optional filtering and pagination.

**Authentication**: None (public endpoint)

**Query Parameters**:
- `search` (string, optional) - Search term for sub-category name (1-100 characters)
- `product_type_id` (integer, optional) - Filter by product type ID
- `page` (integer, optional, default: 1) - Page number
- `limit` (integer, optional, default: 20, max: 100) - Items per page
- `sort_by` (string, optional, default: 'created_at') - Sort field (name, created_at)
- `sort_order` (string, optional, default: 'desc') - Sort order (asc, desc)

**Response**: 200 OK
```json
{
  "data": [
    {
      "id": 1,
      "name": "Birthday Bouquets",
      "product_type_id": 1,
      "created_at": "2023-01-01T00:00:00.000Z"
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

---

### 2. Get Sub-Category by ID (GET /:id)
Retrieve a specific sub-category by its ID.

**Authentication**: None (public endpoint)

**URL Parameters**:
- `id` (integer, required) - Sub-category ID

**Response**: 200 OK
```json
{
  "id": 1,
  "name": "Birthday Bouquets",
  "product_type_id": 1,
  "created_at": "2023-01-01T00:00:00.000Z"
}
```

**Error Responses**:
- 400 Bad Request - Invalid sub-category ID
- 404 Not Found - Sub-category not found

---

### 3. Create Sub-Category (POST /)
Create a new sub-category.

**Authentication**: Required (Admin or SuperAdmin role)

**Request Body**:
```json
{
  "name": "Birthday Bouquets",
  "product_type_id": 1
}
```

**Validation Rules**:
- `name` (required, max 100 characters)
- `product_type_id` (required, must be a valid product type ID)

**Response**: 201 Created
```json
{
  "id": 1,
  "name": "Birthday Bouquets",
  "product_type_id": 1,
  "created_at": "2023-01-01T00:00:00.000Z"
}
```

**Error Responses**:
- 400 Bad Request - Invalid input data
- 401 Unauthorized - Authentication required
- 403 Forbidden - Insufficient permissions
- 404 Not Found - Product type not found
- 409 Conflict - Sub-category with same name already exists for this product type

**Notes**:
- Sub-category names can be duplicated across different product types
- Sub-category names must be unique within the same product type

---

### 4. Update Sub-Category (PUT /:id)
Update an existing sub-category.

**Authentication**: Required (Admin or SuperAdmin role)

**URL Parameters**:
- `id` (integer, required) - Sub-category ID

**Request Body** (at least one field required):
```json
{
  "name": "Wedding Bouquets",
  "product_type_id": 1
}
```

**Validation Rules**:
- `name` (optional, max 100 characters)
- `product_type_id` (optional, must be a valid product type ID)
- At least one field must be provided

**Response**: 200 OK
```json
{
  "id": 1,
  "name": "Wedding Bouquets",
  "product_type_id": 1,
  "created_at": "2023-01-01T00:00:00.000Z"
}
```

**Error Responses**:
- 400 Bad Request - Invalid input data or sub-category ID
- 401 Unauthorized - Authentication required
- 403 Forbidden - Insufficient permissions
- 404 Not Found - Sub-category or product type not found
- 409 Conflict - Sub-category with same name already exists for this product type

---

### 5. Delete Sub-Category (DELETE /:id)
Soft delete a sub-category.

**Authentication**: Required (Admin or SuperAdmin role)

**URL Parameters**:
- `id` (integer, required) - Sub-category ID

**Response**: 200 OK
```json
{
  "message": "Sub-category deleted",
  "subCategory": {
    "id": 1,
    "name": "Birthday Bouquets",
    "product_type_id": 1,
    "created_at": "2023-01-01T00:00:00.000Z"
  }
}
```

**Error Responses**:
- 400 Bad Request - Invalid sub-category ID
- 401 Unauthorized - Authentication required
- 403 Forbidden - Insufficient permissions
- 404 Not Found - Sub-category not found

**Notes**:
- This is a soft delete operation
- Products referencing this sub-category will have their sub_category_id set to NULL
- The database handles this automatically via ON DELETE SET NULL constraint

---

## Product Integration

### Products can now include sub_category_id

**Create/Update Product with Sub-Category**:
```json
{
  "name": "Red Rose Bouquet",
  "price": 29.99,
  "stock": 50,
  "product_type_id": 1,
  "sub_category_id": 1,
  "description": "Beautiful red roses"
}
```

**Filter Products by Sub-Category**:
```
GET /products?sub_category_id=1
```

**Product Response includes sub_category_name**:
```json
{
  "id": 1,
  "name": "Red Rose Bouquet",
  "price": "29.99",
  "stock": 50,
  "product_type_id": 1,
  "product_type_name": "Flowers",
  "sub_category_id": 1,
  "sub_category_name": "Birthday Bouquets",
  "created_at": "2023-01-01T00:00:00.000Z"
}
```

## Example Usage Flow

### 1. Create Product Type
```bash
POST /product-types
{
  "name": "Flowers"
}
```

### 2. Create Sub-Categories
```bash
POST /sub-categories
{
  "name": "Birthday Bouquets",
  "product_type_id": 1
}

POST /sub-categories
{
  "name": "Wedding Bouquets",
  "product_type_id": 1
}
```

### 3. Create Product with Sub-Category
```bash
POST /products
{
  "name": "Red Rose Bouquet",
  "price": 29.99,
  "stock": 50,
  "product_type_id": 1,
  "sub_category_id": 1
}
```

### 4. Filter Products by Sub-Category
```bash
GET /products?sub_category_id=1
```

### 5. Update Product's Sub-Category
```bash
PUT /products/1
{
  "sub_category_id": 2
}
```

### 6. Remove Sub-Category from Product
```bash
PUT /products/1
{
  "sub_category_id": null
}
```

## Key Features

1. **Flexible Naming**: Sub-category names can be duplicated across different product types
2. **Hierarchical Structure**: product_type → sub_category → product
3. **Optional Assignment**: Products can have a sub_category or leave it null
4. **Cascade Behavior**: 
   - Deleting a product_type cascades to sub_categories
   - Deleting a sub_category sets products' sub_category_id to NULL
5. **Filtering**: Products can be filtered by both product_type_id and sub_category_id
6. **Validation**: Ensures product_type exists when creating/updating sub-categories
7. **Soft Deletes**: All entities use soft delete pattern

## Database Migration Files

1. `20251112203500_create_sub_categories_table.ts` - Creates sub_categories table
2. `20251112203600_add_sub_category_to_products.ts` - Adds sub_category_id to products table

## Technical Implementation

- **Module Structure**: Follows the same pattern as product_type module
- **Files Created**:
  - `src/sub-category/query.ts` - Database queries
  - `src/sub-category/routes.ts` - API endpoints
  - `src/sub-category/schemas.ts` - Validation schemas
  - `src/sub-category/services.ts` - Business logic
- **Database Tables Updated**:
  - Added `SubCategories` to `_dbTables.ts`
  - Updated Product-related queries to include sub_category joins
- **Type Definitions**: Added SubCategory interfaces to `modelTypes.ts`
- **Routes Registered**: Sub-category routes mounted at `/sub-categories`
