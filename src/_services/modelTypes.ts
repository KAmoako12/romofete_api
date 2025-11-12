/**
 * TypeScript interfaces for all database models
 */

export interface Customer {
  id: number;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  email: string;
  password?: string;
  email_verified?: boolean;
  verification_code?: string | null;
  verification_code_expires?: Date | null;
  reset_code?: string | null;
  reset_code_expires?: Date | null;
  created_at?: Date;
  deleted_at?: Date | null;
  is_deleted?: boolean;
}

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  role: string;
  phone?: string;
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

export interface SubCategory {
  id: number;
  name: string;
  product_type_id: number;
  created_at: Date;
  deleted_at: Date | null;
  is_deleted: boolean;
}

export interface CreateSubCategoryRequest {
  name: string;
  product_type_id: number;
}

export interface UpdateSubCategoryRequest {
  name?: string;
  product_type_id?: number;
}

export interface SubCategoryResponse {
  id: number;
  name: string;
  product_type_id: number;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: string; // Decimal as string for JSON serialization
  stock: number;
  product_type_id: number;
  sub_category_id: number | null;
  images: string[] | null;
  extra_properties: Record<string, any> | null;
  created_by: number | null;
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
  sub_category_id?: number | null;
  images?: string[] | string;
  extra_properties?: Record<string, any> | string;
  created_by?: number; // Auto-set from authenticated user
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  product_type_id?: number;
  sub_category_id?: number | null;
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
  metadata: Record<string, any> | null; // Flexible metadata field for client-specific data
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
  metadata?: Record<string, any>; // Flexible metadata field for client-specific data
}

export interface UpdateOrderRequest {
  status?: string;
  payment_status?: string;
  payment_reference?: string;
  delivery_address?: string;
  metadata?: Record<string, any>; // Flexible metadata field for client-specific data
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
  image: string[] | null;
  product_type_id: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  is_deleted: boolean;
}

export interface CreateCollectionRequest {
  name: string;
  description?: string;
  image?: string[];
  product_type_id?: number;
  is_active?: boolean;
  products?: Array<{ product_id: number; position?: number }>;
}

export interface UpdateCollectionRequest {
  name?: string;
  description?: string;
  image?: string[];
  product_type_id?: number;
  is_active?: boolean;
  products?: Array<{ product_id: number; position?: number }>;
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

export interface PricingConfig {
  id: number;
  min_price: string; // Decimal as string for JSON serialization
  max_price: string | null; // Decimal as string for JSON serialization
  product_type_id: number | null;
  created_at: Date;
  deleted_at: Date | null;
  is_deleted: boolean;
}

export interface CreatePricingConfigRequest {
  min_price?: number;
  max_price?: number;
  product_type_id?: number;
}

export interface UpdatePricingConfigRequest {
  min_price?: number;
  max_price?: number;
  product_type_id?: number;
}

export interface PricingConfigResponse {
  id: number;
  min_price: string;
  max_price: string | null;
  product_type_id: number | null;
  created_at: string;
}

// Homepage Settings Types

export interface HomepageSettings {
  id: number;
  section_name: string;
  section_description: string;
  section_position: number;
  is_active: boolean;
  section_images: string[];
  product_ids?: number[];
  created_at: Date;
  deleted_at: Date | null;
  is_deleted: boolean;
}

export interface CreateHomepageSettingsRequest {
  section_name: string;
  section_description: string;
  section_position: number;
  is_active?: boolean;
  section_images?: string[];
  product_ids?: number[];
}

export interface UpdateHomepageSettingsRequest {
  section_name?: string;
  section_description?: string;
  section_position?: number;
  is_active?: boolean;
  section_images?: string[];
  product_ids?: number[] | null;
}

export interface HomepageSettingsResponse {
  id: number;
  section_name: string;
  section_description: string;
  section_position: number;
  is_active: boolean;
  section_images: string[];
  product_ids?: number[];
  created_at: string;
}
