# Products API Documentation

This document provides comprehensive examples of how to use the Products API endpoints for e-commerce functionality.

## Overview

The Products API provides full CRUD operations for product management with advanced e-commerce features including:
- Product catalog management
- Inventory tracking and stock management
- Advanced filtering and search capabilities
- Pagination for large product catalogs
- Featured products and product categorization
- Bulk operations for inventory management

## Base URL
```
http://localhost:8080
```

## Authentication

Admin operations require authentication using a JWT token:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Get All Products (with filtering and pagination)
**GET** `/products`

Retrieves a paginated list of products with advanced filtering options.

**Query Parameters:**
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 20, max: 100) - Items per page
- `search` (string) - Search in product name, description, or type
- `product_type_id` (integer) - Filter by product type
- `min_price` (number) - Minimum price filter
- `max_price` (number) - Maximum price filter
- `in_stock` (boolean) - Filter by stock availability
- `sort_by` (string) - Sort field: name, price, created_at, stock, product_type_name
- `sort_order` (string) - Sort order: asc, desc

**Example Request:**
```bash
curl -X GET "http://localhost:8080/products?page=1&limit=10&search=headphones&min_price=50&max_price=500&in_stock=true&sort_by=price&sort_order=asc"
```

**Example Response:**
```json
{
  "products": [
    {
      "id": 1,
      "name": "Premium Headphones",
      "description": "High-quality wireless headphones",
      "price": "199.99",
      "stock": 25,
      "product_type_id": 1,
      "product_type_name": "Electronics",
      "images": ["https://example.com/image1.jpg"],
      "extra_properties": {"color": "black", "warranty": "2 years"},
      "created_at": "2023-01-01T00:00:00.000Z",
      "in_stock": true,
      "stock_status": "in_stock"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  },
  "filters_applied": {
    "search": "headphones",
    "min_price": 50,
    "max_price": 500,
    "in_stock": true
  }
}
```

### 2. Create Product
**POST** `/products`

Creates a new product. Requires admin role.

**Example Request:**
```bash
curl -X POST http://localhost:8080/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "name": "Wireless Mouse",
    "description": "Ergonomic wireless mouse with precision tracking",
    "price": 49.99,
    "stock": 100,
    "product_type_id": 1,
    "images": ["https://example.com/mouse1.jpg", "https://example.com/mouse2.jpg"],
    "extra_properties": {
      "color": "silver",
      "battery_life": "6 months",
      "dpi": "1600"
    }
  }'
```

### 3. Get Featured Products
**GET** `/products/featured`

Returns the latest in-stock products (featured products).

**Example Request:**
```bash
curl -X GET "http://localhost:8080/products/featured?limit=5"
```

### 4. Search Products
**GET** `/products/search`

Search products by name, description, or product type.

**Example Request:**
```bash
curl -X GET "http://localhost:8080/products/search?q=wireless&page=1&limit=20"
```

### 5. Get Products by Type
**GET** `/products/type/{typeId}`

Get all products of a specific type.

**Example Request:**
```bash
curl -X GET "http://localhost:8080/products/type/1?limit=20"
```

### 6. Get Similar Products
**GET** `/products/{id}/similar`

Get products similar to the specified product based on product type and price range.

**Query Parameters:**
- `limit` (integer, default: 10, max: 50) - Number of similar products to return

**Example Request:**
```bash
curl -X GET "http://localhost:8080/products/1/similar?limit=5"
```

**Example Response:**
```json
[
  {
    "id": 2,
    "name": "Wireless Gaming Headphones",
    "description": "Professional gaming headphones with surround sound",
    "price": "179.99",
    "stock": 15,
    "product_type_id": 1,
    "product_type_name": "Electronics",
    "images": ["https://example.com/gaming-headphones.jpg"],
    "extra_properties": {"color": "red", "warranty": "1 year"},
    "created_at": "2023-01-02T00:00:00.000Z",
    "in_stock": true,
    "stock_status": "in_stock"
  },
  {
    "id": 3,
    "name": "Bluetooth Earbuds",
    "description": "Compact wireless earbuds with noise cancellation",
    "price": "149.99",
    "stock": 30,
    "product_type_id": 1,
    "product_type_name": "Electronics",
    "images": ["https://example.com/earbuds.jpg"],
    "extra_properties": {"color": "white", "battery_life": "8 hours"},
    "created_at": "2023-01-03T00:00:00.000Z",
    "in_stock": true,
    "stock_status": "in_stock"
  }
]
```

### 7. Get Product by ID
**GET** `/products/{id}`

Get detailed information about a specific product.

**Example Request:**
```bash
curl -X GET http://localhost:8080/products/1
```

### 8. Update Product
**PUT** `/products/{id}`

Update product information. Requires admin role.

**Example Request:**
```bash
curl -X PUT http://localhost:8080/products/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "name": "Premium Wireless Headphones",
    "price": 179.99,
    "description": "Updated description with new features"
  }'
```

### 9. Delete Product
**DELETE** `/products/{id}`

Soft delete a product. Requires admin role.

**Example Request:**
```bash
curl -X DELETE http://localhost:8080/products/1 \
  -H "Authorization: Bearer <your-jwt-token>"
```

### 10. Update Product Stock
**PATCH** `/products/{id}/stock`

Update product inventory. Requires admin role.

**Example Request:**
```bash
curl -X PATCH http://localhost:8080/products/1/stock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "quantity": 50,
    "operation": "increase"
  }'
```

### 11. Check Product Availability
**GET** `/products/{id}/availability`

Check if a product has sufficient stock for a given quantity.

**Example Request:**
```bash
curl -X GET "http://localhost:8080/products/1/availability?quantity=5"
```

**Example Response:**
```json
{
  "available": true,
  "available_stock": 25
}
```

### 12. Get Low Stock Products
**GET** `/products/low-stock`

Get products with low stock levels. Requires admin role.

**Example Request:**
```bash
curl -X GET "http://localhost:8080/products/low-stock?threshold=10" \
  -H "Authorization: Bearer <your-jwt-token>"
```

### 13. Get Product Statistics
**GET** `/products/stats`

Get inventory statistics. Requires admin role.

**Example Request:**
```bash
curl -X GET http://localhost:8080/products/stats \
  -H "Authorization: Bearer <your-jwt-token>"
```

### 14. Bulk Stock Update
**PATCH** `/products/stock/bulk-update`

Update stock for multiple products at once. Requires admin role.

**Example Request:**
```bash
curl -X PATCH http://localhost:8080/products/stock/bulk-update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "updates": [
      {
        "product_id": 1,
        "quantity": 10,
        "operation": "increase"
      },
      {
        "product_id": 2,
        "quantity": 5,
        "operation": "decrease"
      }
    ]
  }'
```

## Frontend Integration Examples

### React Product Catalog Component

```tsx
import React, { useState, useEffect } from 'react';

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  stock: number;
  product_type_name: string;
  images: string[];
  in_stock: boolean;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

interface ProductFilters {
  search?: string;
  product_type_id?: number;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
}

const ProductCatalog: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<ProductFilters>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const fetchProducts = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== undefined && v !== '')
        )
      });

      const response = await fetch(`/products?${params}`);
      const data = await response.json();
      
      setProducts(data.products);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
  };

  const handlePriceFilter = (minPrice: number, maxPrice: number) => {
    setFilters(prev => ({ ...prev, min_price: minPrice, max_price: maxPrice }));
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'green';
      case 'low_stock': return 'orange';
      case 'out_of_stock': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div className="product-catalog">
      <div className="filters">
        <input
          type="text"
          placeholder="Search products..."
          onChange={(e) => handleSearch(e.target.value)}
        />
        <div className="price-filter">
          <input
            type="number"
            placeholder="Min price"
            onChange={(e) => handlePriceFilter(Number(e.target.value), filters.max_price || 0)}
          />
          <input
            type="number"
            placeholder="Max price"
            onChange={(e) => handlePriceFilter(filters.min_price || 0, Number(e.target.value))}
          />
        </div>
        <label>
          <input
            type="checkbox"
            onChange={(e) => setFilters(prev => ({ ...prev, in_stock: e.target.checked }))}
          />
          In Stock Only
        </label>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="product-grid">
          {products.map(product => (
            <div key={product.id} className="product-card">
              {product.images?.[0] && (
                <img src={product.images[0]} alt={product.name} />
              )}
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <div className="price">${product.price}</div>
              <div className="stock-info">
                <span 
                  className="stock-status"
                  style={{ color: getStockStatusColor(product.stock_status) }}
                >
                  {product.stock} in stock
                </span>
              </div>
              <div className="product-type">{product.product_type_name}</div>
              <button 
                disabled={!product.in_stock}
                onClick={() => console.log('Add to cart:', product.id)}
              >
                {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="pagination">
        <button 
          disabled={pagination.page <= 1}
          onClick={() => fetchProducts(pagination.page - 1)}
        >
          Previous
        </button>
        <span>Page {pagination.page} of {pagination.pages}</span>
        <button 
          disabled={pagination.page >= pagination.pages}
          onClick={() => fetchProducts(pagination.page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ProductCatalog;
```

### Product Availability Checker

```typescript
class ProductAvailabilityChecker {
  async checkAvailability(productId: number, quantity: number): Promise<{
    available: boolean;
    reason?: string;
    available_stock: number;
  }> {
    const response = await fetch(
      `/products/${productId}/availability?quantity=${quantity}`
    );
    return response.json();
  }

  async validateCartItems(cartItems: Array<{productId: number, quantity: number}>) {
    const validationResults = await Promise.all(
      cartItems.map(async item => {
        const availability = await this.checkAvailability(item.productId, item.quantity);
        return {
          productId: item.productId,
          requestedQuantity: item.quantity,
          ...availability
        };
      })
    );

    const unavailableItems = validationResults.filter(result => !result.available);
    
    return {
      allAvailable: unavailableItems.length === 0,
      unavailableItems,
      validationResults
    };
  }
}
```

### Admin Inventory Management

```typescript
class InventoryManager {
  private authToken: string;

  constructor(authToken: string) {
    this.authToken = authToken;
  }

  async getLowStockProducts(threshold = 10) {
    const response = await fetch(`/products/low-stock?threshold=${threshold}`, {
      headers: {
        'Authorization': `Bearer ${this.authToken}`
      }
    });
    return response.json();
  }

  async updateStock(productId: number, quantity: number, operation: 'increase' | 'decrease') {
    const response = await fetch(`/products/${productId}/stock`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`
      },
      body: JSON.stringify({ quantity, operation })
    });
    return response.json();
  }

  async bulkUpdateStock(updates: Array<{
    product_id: number;
    quantity: number;
    operation: 'increase' | 'decrease';
  }>) {
    const response = await fetch('/products/stock/bulk-update', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`
      },
      body: JSON.stringify({ updates })
    });
    return response.json();
  }

  async getInventoryStats() {
    const response = await fetch('/products/stats', {
      headers: {
        'Authorization': `Bearer ${this.authToken}`
      }
    });
    return response.json();
  }
}
```

### Similar Products Component

```tsx
import React, { useState, useEffect } from 'react';

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  stock: number;
  product_type_name: string;
  images: string[];
  in_stock: boolean;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

interface SimilarProductsProps {
  productId: number;
  limit?: number;
}

const SimilarProducts: React.FC<SimilarProductsProps> = ({ productId, limit = 5 }) => {
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSimilarProducts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/products/${productId}/similar?limit=${limit}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch similar products');
        }
        
        const data = await response.json();
        setSimilarProducts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching similar products:', err);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchSimilarProducts();
    }
  }, [productId, limit]);

  const handleProductClick = (product: Product) => {
    // Navigate to product detail page or handle product selection
    console.log('Selected similar product:', product);
  };

  if (loading) {
    return (
      <div className="similar-products">
        <h3>Similar Products</h3>
        <div className="loading">Loading similar products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="similar-products">
        <h3>Similar Products</h3>
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  if (similarProducts.length === 0) {
    return (
      <div className="similar-products">
        <h3>Similar Products</h3>
        <div className="no-products">No similar products found.</div>
      </div>
    );
  }

  return (
    <div className="similar-products">
      <h3>Similar Products</h3>
      <div className="similar-products-grid">
        {similarProducts.map(product => (
          <div 
            key={product.id} 
            className="similar-product-card"
            onClick={() => handleProductClick(product)}
          >
            {product.images?.[0] && (
              <img 
                src={product.images[0]} 
                alt={product.name}
                className="product-image"
              />
            )}
            <div className="product-info">
              <h4 className="product-name">{product.name}</h4>
              <p className="product-description">
                {product.description?.substring(0, 100)}
                {product.description && product.description.length > 100 ? '...' : ''}
              </p>
              <div className="product-price">${product.price}</div>
              <div className="product-type">{product.product_type_name}</div>
              <div className={`stock-status ${product.stock_status}`}>
                {product.in_stock ? `${product.stock} in stock` : 'Out of stock'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimilarProducts;
```

### Product Detail Page with Similar Products

```tsx
import React, { useState, useEffect } from 'react';
import SimilarProducts from './SimilarProducts';

interface ProductDetailProps {
  productId: number;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ productId }) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/products/${productId}`);
        const data = await response.json();
        setProduct(data);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  if (loading || !product) {
    return <div>Loading...</div>;
  }

  return (
    <div className="product-detail">
      <div className="product-main">
        <div className="product-images">
          {product.images?.map((image, index) => (
            <img key={index} src={image} alt={`${product.name} ${index + 1}`} />
          ))}
        </div>
        
        <div className="product-info">
          <h1>{product.name}</h1>
          <p className="description">{product.description}</p>
          <div className="price">${product.price}</div>
          <div className="stock-info">
            <span className={`stock-status ${product.stock_status}`}>
              {product.in_stock ? `${product.stock} in stock` : 'Out of stock'}
            </span>
          </div>
          
          <button 
            className="add-to-cart"
            disabled={!product.in_stock}
          >
            {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>

      {/* Similar Products Section */}
      <div className="similar-products-section">
        <SimilarProducts productId={productId} limit={6} />
      </div>
    </div>
  );
};

export default ProductDetail;
```

### CSS Styles for Similar Products

```css
.similar-products {
  margin-top: 2rem;
  padding: 1rem 0;
}

.similar-products h3 {
  margin-bottom: 1rem;
  font-size: 1.5rem;
  color: #333;
}

.similar-products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.similar-product-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  background: white;
}

.similar-product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.similar-product-card .product-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.similar-product-card .product-name {
  font-size: 1rem;
  font-weight: 600;
  margin: 0.5rem 0;
  color: #333;
}

.similar-product-card .product-description {
  font-size: 0.875rem;
  color: #666;
  margin: 0.5rem 0;
  line-height: 1.4;
}

.similar-product-card .product-price {
  font-size: 1.125rem;
  font-weight: 700;
  color: #2563eb;
  margin: 0.5rem 0;
}

.similar-product-card .product-type {
  font-size: 0.75rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.similar-product-card .stock-status {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  margin-top: 0.5rem;
  display: inline-block;
}

.similar-product-card .stock-status.in_stock {
  background-color: #dcfce7;
  color: #166534;
}

.similar-product-card .stock-status.low_stock {
  background-color: #fef3c7;
  color: #92400e;
}

.similar-product-card .stock-status.out_of_stock {
  background-color: #fee2e2;
  color: #991b1b;
}

.loading, .error, .no-products {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.error {
  color: #dc2626;
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "\"price\" must be a positive number"
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
  "error": "Product not found"
}
```

### 409 Conflict
```json
{
  "error": "Product with this name already exists"
}
```

## Best Practices

### 1. Pagination
Always use pagination for product listings to improve performance:
```javascript
// Good
const products = await fetch('/products?page=1&limit=20');

// Avoid fetching all products at once
const allProducts = await fetch('/products?limit=10000');
```

### 2. Search and Filtering
Combine search with filters for better user experience:
```javascript
const searchParams = {
  search: 'wireless',
  product_type_id: 1,
  min_price: 20,
  max_price: 200,
  in_stock: true
};
```

### 3. Stock Management
Always check availability before allowing purchases:
```javascript
const availability = await checkProductAvailability(productId, quantity);
if (!availability.available) {
  showError(`Only ${availability.available_stock} items available`);
  return;
}
```

### 4. Image Handling
Handle missing images gracefully:
```javascript
const imageUrl = product.images?.[0] || '/placeholder-image.jpg';
```

### 5. Price Display
Always format prices consistently:
```javascript
const formatPrice = (price: string) => `$${parseFloat(price).toFixed(2)}`;
```

## API Documentation

Full interactive API documentation is available at: `http://localhost:8080/docs`

This includes all endpoints with request/response examples and the ability to test endpoints directly from the browser.
