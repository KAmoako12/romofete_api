import Joi from "joi";

export const createProductSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(2000).optional().allow(''),
  price: Joi.number().positive().precision(2).required(),
  stock: Joi.number().integer().min(0).required(),
  product_type_id: Joi.number().integer().positive().required(),
  sub_category_id: Joi.number().integer().positive().allow(null).optional(),
  images: Joi.array().items(Joi.string().uri()).max(10).optional(),
  extra_properties: Joi.object().optional()
});

export const updateProductSchema = Joi.object({
  name: Joi.string().min(1).max(200).optional(),
  description: Joi.string().max(2000).optional().allow(''),
  price: Joi.number().positive().precision(2).optional(),
  stock: Joi.number().integer().min(0).optional(),
  product_type_id: Joi.number().integer().positive().optional(),
  sub_category_id: Joi.number().integer().positive().allow(null).optional(),
  images: Joi.array().items(Joi.string().uri()).max(10).optional(),
  extra_properties: Joi.object().optional()
}).min(1); // At least one field must be provided

export const productFiltersSchema = Joi.object({
  product_type_id: Joi.number().integer().positive().optional(),
  sub_category_id: Joi.number().integer().positive().optional(),
  minPrice: Joi.number().min(0).precision(2).optional(),
  maxPrice: Joi.number().min(0).precision(2).optional(),
  in_stock: Joi.boolean().optional(),
  search: Joi.string().min(1).max(100).optional(),
  occasion: Joi.string().min(1).max(100).optional(),
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(20).optional(),
  sort_by: Joi.string().valid('name', 'price', 'created_at', 'stock', 'product_type_name').default('created_at').optional(),
  sort_order: Joi.string().valid('asc', 'desc').default('desc').optional()
});

export const stockUpdateSchema = Joi.object({
  quantity: Joi.number().integer().positive().required(),
  operation: Joi.string().valid('increase', 'decrease').required()
});

export const bulkStockUpdateSchema = Joi.object({
  updates: Joi.array().items(
    Joi.object({
      product_id: Joi.number().integer().positive().required(),
      quantity: Joi.number().integer().positive().required(),
      operation: Joi.string().valid('increase', 'decrease').required()
    })
  ).min(1).max(50).required()
});
