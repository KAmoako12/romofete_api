// This file contains service functions and business logic for ProductType-related operations.
import { Query } from "./query";
import { CreateProductTypeRequest, UpdateProductTypeRequest, ProductTypeResponse } from "../_services/modelTypes";

export async function addProductType(data: CreateProductTypeRequest) {
  // Check if product type with same name already exists
  const existing = await Query.getProductTypeByName(data.name);
  if (existing) {
    throw new Error("Product type with this name already exists");
  }

  const [productType] = await Query.createProductType(data);
  return formatProductTypeResponse(productType);
}

export async function getProductTypeById(id: number) {
  const productType = await Query.getProductTypeById(id);
  if (!productType) {
    return null;
  }
  return formatProductTypeResponse(productType);
}

export async function listProductTypes(filters: any = {}, pagination: any = {}) {
  const result = await Query.listProductTypes(filters, pagination);
  return {
    data: result.product_types.map(formatProductTypeResponse),
    pagination: result.pagination
  };
}

export async function updateProductType(id: number, updates: UpdateProductTypeRequest) {
  // Check if product type exists
  const existing = await Query.getProductTypeById(id);
  if (!existing) {
    throw new Error("Product type not found");
  }

  // Check if name is being updated and if it conflicts with another product type
  if (updates.name && updates.name !== (existing as any).name) {
    const conflict = await Query.getProductTypeByName(updates.name);
    if (conflict) {
      throw new Error("Product type with this name already exists");
    }
  }

  const [updated] = await Query.updateProductType(id, updates);
  return formatProductTypeResponse(updated);
}

export async function deleteProductType(id: number) {
  const existing = await Query.getProductTypeById(id);
  if (!existing) {
    throw new Error("Product type not found");
  }

  const [deleted] = await Query.deleteProductType(id);
  return formatProductTypeResponse(deleted);
}

// Helper to format for API response
function formatProductTypeResponse(row: any): ProductTypeResponse {
  return {
    id: row.id,
    name: row.name,
    allowed_types: row.allowed_types ?? null,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString(),
  };
}
