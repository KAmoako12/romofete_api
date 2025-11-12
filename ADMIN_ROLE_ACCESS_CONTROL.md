# Admin Role-Based Access Control Implementation

## Overview
This document describes the role-based access control system implemented to restrict admin users to only see and manage their own created resources, while superAdmins maintain full access to all resources.

## What Was Implemented

### 1. Database Changes
**Migration:** `20251112210000_add_created_by_to_products.ts`
- Added `created_by` column to the `products` table
- Foreign key relationship to `users.id`
- Indexed for performance
- Nullable to support existing products

**Command to run migration:**
```bash
npx knex migrate:latest
```

### 2. Data Model Updates
**File:** `src/_services/modelTypes.ts`
- Updated `Product` interface to include `created_by: number | null`
- Updated `CreateProductRequest` to include optional `created_by?: number`

### 3. Query Layer Updates
**File:** `src/product/query.ts`
- Added `created_by` filter to `ProductFilters` interface
- Updated `listProducts()` to filter by `created_by` when provided
- Updated `getLowStockProducts()` to filter by `created_by` when provided

### 4. Route Layer Updates
**File:** `src/product/routes.ts`
- **POST /products:** Automatically sets `created_by` to the authenticated user's ID
- **GET /products/low-stock:** Filters products by creator for regular admins (superAdmins see all)

## How It Works

### Product Creation
When an admin or superAdmin creates a product:
```javascript
// Automatically set in route handler
value.created_by = req.user!.id;
```

### Role-Based Filtering

#### Regular Admin (`role === 'admin'`)
- Can only see products they created (`created_by === their user ID`)
- Queries automatically filter: `WHERE products.created_by = <admin_user_id>`

#### SuperAdmin (`role === 'superAdmin'`)
- Can see ALL products regardless of creator
- No `created_by` filter is applied to their queries

### Example Implementation
```javascript
// In routes.ts for admin-only endpoints
const filters = {
  // ... other filters
  created_by: req.user!.role === 'admin' ? req.user!.id : undefined
};
```

## What Still Needs To Be Done

### 1. Update Existing Products
All existing products have `created_by = NULL`. You need to decide:
- **Option A:** Assign all existing products to a specific superAdmin
- **Option B:** Leave them as NULL (visible to all admins)
- **Option C:** Assign them based on some business logic

**Example SQL to assign to first superAdmin:**
```sql
UPDATE products 
SET created_by = (SELECT id FROM users WHERE role = 'superAdmin' LIMIT 1)
WHERE created_by IS NULL;
```

### 2. Extend to Other Admin Endpoints
Currently only these endpoints have role-based filtering:
- POST /products (sets created_by)
- GET /products/low-stock (filters by creator)

You need to add filtering to:

#### Required Updates:
1. **GET /products** - Main product listing
2. **PUT /products/:id** - Update product (check ownership)
3. **DELETE /products/:id** - Delete product (check ownership)
4. **PATCH /products/:id/stock** - Stock updates (check ownership)
5. **GET /products/stats** - Statistics (filter by creator)
6. **PATCH /products/stock/bulk-update** - Bulk operations (check ownership)

### 3. Update/Delete Authorization
Add ownership checks before allowing updates/deletes:

```javascript
// Example for PUT /products/:id
router.put("/:id", ...requireAuthAndRole("admin", "superAdmin"), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const product = await getProductById(id);
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    // Check ownership for regular admins
    if (req.user!.role === 'admin' && product.created_by !== req.user!.id) {
      return res.status(403).json({ error: "You can only update your own products" });
    }
    
    const { error, value } = updateProductSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const updatedProduct = await updateProduct(id, value);
    res.json(updatedProduct);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
```

### 4. Orders Filtering
Based on requirements, admins should only see orders containing their products:

**Implementation needed:**
1. Create a query to get orders with at least one product created by the admin
2. Filter order_items to only show items for products they created
3. Update GET /orders endpoint
4. Update GET /orders/stats endpoint

**Example approach:**
```sql
SELECT DISTINCT o.* FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE p.created_by = <admin_user_id>
```

### 5. Additional Resources (Future)
If you want to extend this to other resources, apply the same pattern:
- Add `created_by` column to table
- Update model types
- Add filtering in queries
- Add ownership checks in routes

Resources that might need this:
- Product Types (Categories)
- Bundles
- Collections
- Sub-categories

## Testing Checklist

### Setup Test Data
1. Create 2 admin users and 1 superAdmin user
2. Have each admin create some products
3. Create some orders with products from different admins

### Test Cases
- [ ] Admin A creates a product → `created_by` set to Admin A's ID
- [ ] Admin A sees only their products in GET /products/low-stock
- [ ] Admin A cannot see Admin B's products
- [ ] Admin A cannot update/delete Admin B's products
- [ ] SuperAdmin sees ALL products from all admins
- [ ] SuperAdmin can update/delete any product
- [ ] Admin A sees only orders containing their products
- [ ] Public endpoints (GET /products) show all products (current behavior)

## Security Considerations

1. **Always validate ownership on destructive operations** (UPDATE, DELETE)
2. **Use database-level filtering** rather than application-level filtering when possible
3. **Log access attempts** for audit purposes
4. **Consider adding `updated_by`** field to track who last modified a resource
5. **Prevent privilege escalation** - admins shouldn't be able to change `created_by`

## Migration Strategy

### For Production:
1. Deploy database migration (adds `created_by` column)
2. Run script to assign existing products to appropriate creators
3. Deploy updated application code
4. Monitor logs for any access issues
5. Gradually enable filtering on remaining endpoints

### Rollback Plan:
If issues arise, you can:
1. Remove `created_by` filters from queries
2. Keep the column (no need to drop it)
3. Fix issues and re-enable filtering

## Summary

✅ **Completed:**
- Database schema updated
- Core filtering logic implemented
- Product creation tracks creator
- Low-stock endpoint filters by creator

⏳ **TODO:**
- Update remaining product endpoints
- Implement order filtering
- Add ownership checks on updates/deletes
- Assign creators to existing products
- Test thoroughly

The foundation is in place. You now need to apply the same pattern to the remaining endpoints.
