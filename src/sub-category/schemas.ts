import Joi from "joi";

export const createSubCategorySchema = Joi.object({
  name: Joi.string().max(100).required(),
  product_type_id: Joi.number().integer().min(1).required(),
});

export const updateSubCategorySchema = Joi.object({
  name: Joi.string().max(100).optional(),
  product_type_id: Joi.number().integer().min(1).optional(),
}).min(1); // At least one field must be provided

export const subCategoryFiltersSchema = Joi.object({
  search: Joi.string().min(1).max(100).optional(),
  product_type_id: Joi.number().integer().min(1).optional(),
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(20).optional(),
  sort_by: Joi.string().valid('name', 'created_at').default('created_at').optional(),
  sort_order: Joi.string().valid('asc', 'desc').default('desc').optional()
});
