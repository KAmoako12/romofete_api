// This file contains service functions and business logic for SubCategory-related operations.
import { Query } from "./query";
import { Query as ProductTypeQuery } from "../product-type/query";
import { Query as ProductQuery } from "../product/query";
import { CreateSubCategoryRequest, UpdateSubCategoryRequest, SubCategoryResponse } from "../_services/modelTypes";

export async function addSubCategory(data: CreateSubCategoryRequest) {
  // Validate that product_type exists
  const productType = await ProductTypeQuery.getProductTypeById(data.product_type_id);
  if (!productType) {
    throw new Error("Product type not found");
  }

  // Check if sub-category with same name already exists within this product type
  const existing = await Query.getSubCategoryByNameAndProductType(data.name, data.product_type_id);
  if (existing) {
    throw new Error("Sub-category with this name already exists for this product type");
  }

  const [subCategory] = await Query.createSubCategory(data);
  return formatSubCategoryResponse(subCategory);
}

export async function getSubCategoryById(id: number) {
  const subCategory = await Query.getSubCategoryById(id);
  if (!subCategory) {
    return null;
  }
  return formatSubCategoryResponse(subCategory);
}

export async function listSubCategories(filters: any = {}, pagination: any = {}) {
  const result = await Query.listSubCategories(filters, pagination);
  return {
    data: result.sub_categories.map(formatSubCategoryResponse),
    pagination: result.pagination
  };
}

export async function updateSubCategory(id: number, updates: UpdateSubCategoryRequest) {
  // Check if sub-category exists
  const existing = await Query.getSubCategoryById(id);
  if (!existing) {
    throw new Error("Sub-category not found");
  }

  // If product_type_id is being updated, validate that it exists
  if (updates.product_type_id && updates.product_type_id !== (existing as any).product_type_id) {
    const productType = await ProductTypeQuery.getProductTypeById(updates.product_type_id);
    if (!productType) {
      throw new Error("Product type not found");
    }
  }

  // Check if name is being updated and if it conflicts with another sub-category in the same product type
  const targetProductTypeId = updates.product_type_id || (existing as any).product_type_id;
  if (updates.name && (updates.name !== (existing as any).name || updates.product_type_id)) {
    const conflict = await Query.getSubCategoryByNameAndProductType(updates.name, targetProductTypeId);
    if (conflict && conflict.id !== id) {
      throw new Error("Sub-category with this name already exists for this product type");
    }
  }

  const [updated] = await Query.updateSubCategory(id, updates);
  return formatSubCategoryResponse(updated);
}

export async function deleteSubCategory(id: number) {
  const existing = await Query.getSubCategoryById(id);
  if (!existing) {
    throw new Error("Sub-category not found");
  }

  // Set all products' sub_category_id to null that reference this sub-category
  // This is handled automatically by the database constraint (ON DELETE SET NULL)

  // Then delete the sub-category
  const [deleted] = await Query.deleteSubCategory(id);
  return formatSubCategoryResponse(deleted);
}

// Helper to format for API response
function formatSubCategoryResponse(row: any): SubCategoryResponse {
  return {
    id: row.id,
    name: row.name,
    product_type_id: row.product_type_id,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString(),
  };
}
