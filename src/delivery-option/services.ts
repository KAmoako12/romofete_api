// This file contains service functions and business logic for DeliveryOption-related operations.
import { Query } from "./query";
import { CreateDeliveryOptionRequest, UpdateDeliveryOptionRequest, DeliveryOptionResponse } from "../_services/modelTypes";

export async function addDeliveryOption(data: CreateDeliveryOptionRequest) {
  // Check if delivery option with same name already exists
  const existingOption = await Query.getDeliveryOptionByName(data.name);
  if (existingOption) {
    throw new Error("Delivery option with this name already exists");
  }

  const [deliveryOption] = await Query.createDeliveryOption(data);
  return formatDeliveryOptionResponse(deliveryOption);
}

export async function getDeliveryOptionById(id: number) {
  const deliveryOption = await Query.getDeliveryOptionById(id);
  if (!deliveryOption) {
    return null;
  }
  return formatDeliveryOptionResponse(deliveryOption);
}

export async function listDeliveryOptions() {
  const deliveryOptions = await Query.listDeliveryOptions();
  return deliveryOptions.map(formatDeliveryOptionResponse);
}

export async function updateDeliveryOption(id: number, updates: UpdateDeliveryOptionRequest) {
  // Check if delivery option exists
  const existingOption = await Query.getDeliveryOptionById(id);
  if (!existingOption) {
    throw new Error("Delivery option not found");
  }

  // Check if name is being updated and if it conflicts with another option
  if (updates.name && updates.name !== (existingOption as any).name) {
    const conflictingOption = await Query.getDeliveryOptionByName(updates.name);
    if (conflictingOption) {
      throw new Error("Delivery option with this name already exists");
    }
  }

  const [updatedOption] = await Query.updateDeliveryOption(id, updates);
  return formatDeliveryOptionResponse(updatedOption);
}

export async function deleteDeliveryOption(id: number) {
  const existingOption = await Query.getDeliveryOptionById(id);
  if (!existingOption) {
    throw new Error("Delivery option not found");
  }

  const [deletedOption] = await Query.deleteDeliveryOption(id);
  return formatDeliveryOptionResponse(deletedOption);
}

// Helper function to format delivery option for API response
function formatDeliveryOptionResponse(deliveryOption: any): DeliveryOptionResponse {
  return {
    id: deliveryOption.id,
    name: deliveryOption.name,
    amount: deliveryOption.amount.toString(), // Convert decimal to string for JSON
    created_at: deliveryOption.created_at.toISOString(),
  };
}
