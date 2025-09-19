import Joi from "joi";

export const createBundleSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(2000).optional().allow(''),
  discount_percentage: Joi.number().min(0).max(100).precision(2).optional(),
  is_active: Joi.boolean().optional().default(true),
  products: Joi.array().items(
    Joi.object({
      product_id: Joi.number().integer().positive().required(),
      quantity: Joi.number().integer().positive().default(1).optional()
    })
  ).min(1).required()
});

export const updateBundleSchema = Joi.object({
  name: Joi.string().min(1).max(200).optional(),
  description: Joi.string().max(2000).optional().allow(''),
  discount_percentage: Joi.number().min(0).max(100).precision(2).optional(),
  is_active: Joi.boolean().optional()
}).min(1); // At least one field must be provided

export const addProductToBundleSchema = Joi.object({
  product_id: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().positive().default(1).optional()
});

export const updateBundleProductSchema = Joi.object({
  quantity: Joi.number().integer().positive().required()
});

export const bundleFiltersSchema = Joi.object({
  is_active: Joi.boolean().optional(),
  search: Joi.string().min(1).max(100).optional(),
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(20).optional(),
  sort_by: Joi.string().valid('name', 'created_at', 'discount_percentage').default('created_at').optional(),
  sort_order: Joi.string().valid('asc', 'desc').default('desc').optional()
});

export const bulkAddProductsSchema = Joi.object({
  products: Joi.array().items(
    Joi.object({
      product_id: Joi.number().integer().positive().required(),
      quantity: Joi.number().integer().positive().default(1).optional()
    })
  ).min(1).max(50).required()
});
