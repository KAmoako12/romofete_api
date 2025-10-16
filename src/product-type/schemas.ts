import Joi from "joi";

export const createProductTypeSchema = Joi.object({
  name: Joi.string().max(100).required(),
  allowed_types: Joi.array().items(Joi.string().max(100)).max(50).optional(),
});

export const updateProductTypeSchema = Joi.object({
  name: Joi.string().max(100).optional(),
  // allow setting to null to clear allowed_types
  allowed_types: Joi.array().items(Joi.string().max(100)).max(50).allow(null).optional(),
}).min(1); // At least one field must be provided

export const productTypeFiltersSchema = Joi.object({
  search: Joi.string().min(1).max(100).optional(),
  occasion: Joi.string().min(1).max(100).optional(),
  minPrice: Joi.number().min(0).precision(2).optional(),
  maxPrice: Joi.number().min(0).precision(2).optional(),
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(20).optional(),
  sort_by: Joi.string().valid('name', 'created_at').default('created_at').optional(),
  sort_order: Joi.string().valid('asc', 'desc').default('desc').optional()
});
