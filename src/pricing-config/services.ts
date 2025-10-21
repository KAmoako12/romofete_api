// This file contains service functions and business logic for PricingConfig-related operations.
import { Query } from "./query";
import { CreatePricingConfigRequest, UpdatePricingConfigRequest, PricingConfigResponse } from "../_services/modelTypes";

export async function addPricingConfig(data: CreatePricingConfigRequest) {
  // If product_type_id is provided, you might want to verify it exists
  // For now, we'll rely on the foreign key constraint
  
  const [pricingConfig] = await Query.createPricingConfig(data);
  return formatPricingConfigResponse(pricingConfig);
}

export async function getPricingConfigById(id: number) {
  const pricingConfig = await Query.getPricingConfigById(id);
  if (!pricingConfig) {
    return null;
  }
  return formatPricingConfigResponse(pricingConfig);
}

export async function listPricingConfigs(productTypeId?: number) {
  const pricingConfigs = await Query.listPricingConfigs(productTypeId);
  return pricingConfigs.map(formatPricingConfigResponse);
}

export async function updatePricingConfig(id: number, updates: UpdatePricingConfigRequest) {
  // Check if pricing config exists
  const existingConfig = await Query.getPricingConfigById(id);
  if (!existingConfig) {
    throw new Error("Pricing config not found");
  }

  const [updatedConfig] = await Query.updatePricingConfig(id, updates);
  return formatPricingConfigResponse(updatedConfig);
}

export async function deletePricingConfig(id: number) {
  const existingConfig = await Query.getPricingConfigById(id);
  if (!existingConfig) {
    throw new Error("Pricing config not found");
  }

  const [deletedConfig] = await Query.deletePricingConfig(id);
  return formatPricingConfigResponse(deletedConfig);
}

// Helper function to format pricing config for API response
function formatPricingConfigResponse(pricingConfig: any): PricingConfigResponse {
  return {
    id: pricingConfig.id,
    min_price: pricingConfig.min_price.toString(), // Convert decimal to string for JSON
    max_price: pricingConfig.max_price ? pricingConfig.max_price.toString() : null,
    product_type_id: pricingConfig.product_type_id,
    created_at: pricingConfig.created_at.toISOString(),
  };
}
