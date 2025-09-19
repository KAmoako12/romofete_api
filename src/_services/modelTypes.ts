// TypeScript interfaces for all database models

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  role: string;
  is_active: boolean;
  created_at: Date;
  deleted_at: Date | null;
  is_deleted: boolean;
}

export interface ProductType {
  id: number;
  name: string;
  allowed_types: string[] | null;
  created_at: Date;
  deleted_at: Date | null;
  is_deleted: boolean;
}

export interface CreateProductTypeRequest {
  name: string;
  allowed_types?: string[];
}

export interface UpdateProductTypeRequest {
  name?: string;
  allowed_types?: string[] | null;
}

export interface ProductTypeResponse {
  id: number;
  name: string;
  allowed_types: string[] | null;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: string; // Decimal as string for JSON serialization
  stock: number;
  product_type_id: number;
  images: string[] | null;
  extra_properties: Record<string, any> | null;
  created_at: Date;
  deleted_at: Date | null;
  is_deleted: boolean;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  stock: number;
  product_type_id: number;
  images?: string[];
  extra_properties?: Record<string, any>;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  product_type_id?: number;
  images?: string[];
  extra_properties?: Record<string, any>;
}

export interface Order {
  id: number;
  user_id: number | null;
  quantity: number;
  total_price: string; // Decimal as string for JSON serialization
  subtotal: string; // Decimal as string for JSON serialization
  delivery_cost: string | null; // Decimal as string for JSON serialization
  delivery_option_id: number | null;
  status: string;
  payment_status: string;
  payment_reference: string | null;
  reference: string;
  delivery_address: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_name: string | null;
  created_at: Date;
  deleted_at: Date | null;
  is_deleted: boolean;
}

export interface CreateOrderRequest {
  user_id?: number;
  items: Array<{
    product_id: number;
    quantity: number;
  }>;
  delivery_option_id?: number;
  delivery_address?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_name?: string;
  customer_password?: string;
  register_customer?: boolean;
}

export interface UpdateOrderRequest {
  status?: string;
  payment_status?: string;
  payment_reference?: string;
  delivery_address?: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: string; // Decimal as string for JSON serialization
  created_at: Date;
  deleted_at: Date | null;
  is_deleted: boolean;
}

export interface CreateOrderItemRequest {
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
}

export interface Transaction {
  id: number;
  order_id: number;
  amount: string; // Decimal as string for JSON serialization
  status: string;
  reference: string;
  created_at: Date;
  deleted_at: Date | null;
  is_deleted: boolean;
}

export interface CreateTransactionRequest {
  order_id: number;
  amount: number;
  status?: string;
  reference: string;
}

export interface DeliveryOption {
  id: number;
  name: string;
  amount: string; // Decimal as string for JSON serialization
  created_at: Date;
  deleted_at: Date | null;
  is_deleted: boolean;
}

export interface CreateDeliveryOptionRequest {
  name: string;
  amount: number;
}

export interface UpdateDeliveryOptionRequest {
  name?: string;
  amount?: number;
}

// Response types for API endpoints
export interface DeliveryOptionResponse {
  id: number;
  name: string;
  amount: string;
  created_at: string;
}

export interface ApiError {
  error: string;
}

export interface DeleteResponse {
  message: string;
  deliveryOption: DeliveryOptionResponse;
}

export interface Bundle {
  id: number;
  name: string;
  description: string | null;
  discount_percentage: string | null; // Decimal as string for JSON serialization
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  is_deleted: boolean;
}

export interface CreateBundleRequest {
  name: string;
  description?: string;
  discount_percentage?: number;
  is_active?: boolean;
}

export interface UpdateBundleRequest {
  name?: string;
  description?: string;
  discount_percentage?: number;
  is_active?: boolean;
}

export interface BundleProduct {
  id: number;
  bundle_id: number;
  product_id: number;
  quantity: number;
  created_at: Date;
  deleted_at: Date | null;
  is_deleted: boolean;
}

export interface CreateBundleProductRequest {
  bundle_id: number;
  product_id: number;
  quantity: number;
}

export interface Collection {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  is_deleted: boolean;
}

export interface CreateCollectionRequest {
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateCollectionRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export interface CollectionProduct {
  id: number;
  collection_id: number;
  product_id: number;
  position: number;
  created_at: Date;
  deleted_at: Date | null;
  is_deleted: boolean;
}

export interface CreateCollectionProductRequest {
  collection_id: number;
  product_id: number;
  position?: number;
}
