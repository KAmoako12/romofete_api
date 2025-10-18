// This file contains service functions and business logic for Product-related operations.
import { Query, ProductFilters, PaginationOptions } from "./query";
import { CreateProductRequest, UpdateProductRequest } from "../_services/modelTypes";
import { BundleQuery } from "../bundle/query";
import { Database } from "../_services/databaseService";

export interface ProductResponse {
  id: number;
  name: string;
  description: string | null;
  price: string;
  stock: number;
  product_type_id: number;
  product_type_name?: string;
  images: string[] | null;
  extra_properties: Record<string, any> | null;
  created_at: string;
  in_stock: boolean;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface ProductListResponse {
  data: ProductResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters_applied: ProductFilters;
}

export async function addProduct(data: CreateProductRequest) {
  // Check if product with same name already exists
  const existingProduct = await Query.getProductByName(data.name);
  if (existingProduct) {
    throw new Error("Product with this name already exists");
  }

  // Validate product type exists (this would require a product type query)
  // For now, we'll assume the foreign key constraint will handle this
  data.images = JSON.stringify(data.images || []);
  data.extra_properties = JSON.stringify(data.extra_properties || {});
  const [product] = await Query.createProduct(data);
  return formatProductResponse(product);
}

export async function getProductById(id: number) {
  const product = await Query.getProductById(id);
  if (!product) {
    return null;
  }
  return formatProductResponse(product);
}

export async function listProducts(filters: ProductFilters = {}, pagination: PaginationOptions = {}): Promise<ProductListResponse> {
  const result = await Query.listProducts(filters, pagination);
  
  return {
    data: result.products.map(formatProductResponse),
    pagination: result.pagination,
    filters_applied: filters
  };
}

export async function updateProduct(id: number, updates: UpdateProductRequest) {
  // Check if product exists
  const existingProduct = await Query.getProductById(id);
  if (!existingProduct) {
    throw new Error("Product not found");
  }

  // Check if name is being updated and if it conflicts with another product
  if (updates.name && updates.name !== existingProduct.name) {
    const conflictingProduct = await Query.getProductByName(updates.name);
    if (conflictingProduct) {
      throw new Error("Product with this name already exists");
    }
  }

  updates.images = updates.images ? JSON.stringify(updates.images) : existingProduct.images;
  updates.extra_properties = updates.extra_properties ? JSON.stringify(updates.extra_properties) : existingProduct.extra_properties;
  const [updatedProduct] = await Query.updateProduct(id, updates);
  return formatProductResponse(updatedProduct);
}

export async function deleteProduct(id: number) {
  const existingProduct = await Query.getProductById(id);
  if (!existingProduct) {
    throw new Error("Product not found");
  }

  const [deletedProduct] = await Query.deleteProduct(id);
  return formatProductResponse(deletedProduct);
}

export async function getFeaturedProducts(limit: number = 10, filters: Omit<ProductFilters, 'search'> = {}) {
  const products = await Query.getFeaturedProducts(limit, filters);
  return {
    data: products.map(formatProductResponse),
    pagination: {
      page: 1,
      limit: limit,
      total: products.length,
      pages: 1
    },
    filters_applied: filters
  };
}

export async function getProductsByType(productTypeId: number, limit: number = 20, filters: Omit<ProductFilters, 'search' | 'product_type_id'> = {}) {
  const products = await Query.getProductsByType(productTypeId, limit, filters);
  return {
    data: products.map(formatProductResponse),
    pagination: {
      page: 1,
      limit: limit,
      total: products.length,
      pages: 1
    },
    filters_applied: { ...filters, product_type_id: productTypeId }
  };
}

export async function updateProductStock(id: number, quantity: number, operation: 'increase' | 'decrease') {
  const [updatedProduct] = await Query.updateProductStock(id, quantity, operation);
  return formatProductResponse(updatedProduct);
}

export async function checkProductAvailability(id: number, requestedQuantity: number) {
  return await Query.checkProductAvailability(id, requestedQuantity);
}

export async function getLowStockProducts(threshold: number = 10, filters: Omit<ProductFilters, 'search' | 'in_stock'> = {}) {
  const products = await Query.getLowStockProducts(threshold, filters);
  return {
    data: products.map(formatProductResponse),
    pagination: {
      page: 1,
      limit: products.length,
      total: products.length,
      pages: 1
    },
    filters_applied: filters
  };
}

export async function bulkUpdateStock(updates: Array<{product_id: number, quantity: number, operation: 'increase' | 'decrease'}>) {
  const results = [];
  const errors = [];

  for (const update of updates) {
    try {
      const result = await updateProductStock(update.product_id, update.quantity, update.operation);
      results.push({
        product_id: update.product_id,
        success: true,
        product: result
      });
    } catch (error: any) {
      errors.push({
        product_id: update.product_id,
        success: false,
        error: error.message
      });
    }
  }

  return {
    successful_updates: results,
    failed_updates: errors,
    total_processed: updates.length,
    successful_count: results.length,
    failed_count: errors.length
  };
}

export async function searchProducts(searchTerm: string, filters: Omit<ProductFilters, 'search'> = {}, pagination: PaginationOptions = {}) {
  const searchFilters: ProductFilters = {
    ...filters,
    search: searchTerm
  };

  return await listProducts(searchFilters, pagination);
}

export async function getProductStats() {
  // This would require additional queries to get comprehensive stats
  // For now, we'll return basic stats
  const lowStockProducts = await getLowStockProducts();
  
  return {
    low_stock_count: lowStockProducts.data.length,
    low_stock_threshold: 10,
    // Additional stats would be calculated here
  };
}

export async function getSimilarProducts(productId: number, limit: number = 10, filters: Omit<ProductFilters, 'search'> = {}) {
  const bundleQuery = new BundleQuery(Database.getDBInstance());
  
  // First, try to get products from the same bundles
  const bundleSimilarProducts = await bundleQuery.getProductsInSameBundles(productId, Math.ceil(limit * 0.7));
  
  // If we don't have enough products from bundles, get more using the original algorithm with filters
  const remainingLimit = limit - bundleSimilarProducts.length;
  let additionalProducts: any[] = [];
  
  if (remainingLimit > 0) {
    const originalSimilarProducts = await Query.getSimilarProducts(productId, remainingLimit, filters);
    
    // Filter out products that are already in the bundle results
    const bundleProductIds = new Set(bundleSimilarProducts.map((p: any) => p.id));
    additionalProducts = originalSimilarProducts.filter((p: any) => !bundleProductIds.has(p.id));
  }
  
  // Combine and format the results
  const allSimilarProducts = [...bundleSimilarProducts, ...additionalProducts].slice(0, limit);
  const formattedProducts = allSimilarProducts.map(formatProductResponse);
  
  return {
    data: formattedProducts,
    pagination: {
      page: 1,
      limit: limit,
      total: formattedProducts.length,
      pages: 1
    },
    filters_applied: filters
  };
}

// New function specifically for getting products from same bundles
export async function getProductsFromSameBundles(productId: number, limit: number = 10, filters: Omit<ProductFilters, 'search'> = {}) {
  const bundleQuery = new BundleQuery(Database.getDBInstance());
  const products = await bundleQuery.getProductsInSameBundles(productId, limit);
  const formattedProducts = products.map(formatProductResponse);
  
  return {
    data: formattedProducts,
    pagination: {
      page: 1,
      limit: limit,
      total: formattedProducts.length,
      pages: 1
    },
    filters_applied: filters
  };
}

// Helper function to determine stock status
function getStockStatus(stock: number): 'in_stock' | 'low_stock' | 'out_of_stock' {
  if (stock === 0) return 'out_of_stock';
  if (stock <= 10) return 'low_stock';
  return 'in_stock';
}

// Helper function to format product for API response
function formatProductResponse(product: any): ProductResponse {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price.toString(), // Convert decimal to string for JSON
    stock: product.stock,
    product_type_id: product.product_type_id,
    product_type_name: product.product_type_name,
    images: product.images,
    extra_properties: product.extra_properties,
    created_at: product.created_at.toISOString(),
    in_stock: product.stock > 0,
    stock_status: getStockStatus(product.stock)
  };
}
