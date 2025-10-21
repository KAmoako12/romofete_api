import Joi from "joi";

export const createPricingConfigSchema = Joi.object({
  min_price: Joi.number().precision(2).min(0).optional().default(0),
  max_price: Joi.number().precision(2).min(0).optional().allow(null),
  product_type_id: Joi.number().integer().positive().optional().allow(null),
});

export const updatePricingConfigSchema = Joi.object({
  min_price: Joi.number().precision(2).min(0).optional(),
  max_price: Joi.number().precision(2).min(0).optional().allow(null),
  product_type_id: Joi.number().integer().positive().optional().allow(null),
}).min(1); // At least one field must be provided
