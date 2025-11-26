import Joi from "joi";

export const createPersonalizedOrderSchema = Joi.object({
  custom_message: Joi.string().required(),
  selected_colors: Joi.array().items(Joi.string()).optional().allow(null),
  product_type: Joi.string().required(),
  metadata: Joi.object().optional().allow(null),
  amount: Joi.number().positive().precision(2).required(),
  customer_email: Joi.string().email().required(),
  customer_phone: Joi.string().optional().allow(null),
  customer_name: Joi.string().optional().allow(null),
  delivery_address: Joi.string().optional().allow(null)
});

export const updatePersonalizedOrderSchema = Joi.object({
  custom_message: Joi.string().optional(),
  selected_colors: Joi.array().items(Joi.string()).optional().allow(null),
  product_type: Joi.string().optional(),
  metadata: Joi.object().optional().allow(null),
  amount: Joi.number().positive().precision(2).optional().allow(null),
  order_status: Joi.string().valid('pending', 'processing', 'shipped', 'delivered', 'cancelled').optional(),
  delivery_status: Joi.string().valid('pending', 'in_transit', 'delivered', 'failed').optional()
}).min(1); // At least one field must be provided

export const personalizedOrderFiltersSchema = Joi.object({
  order_status: Joi.string().valid('pending', 'processing', 'shipped', 'delivered', 'cancelled').optional(),
  delivery_status: Joi.string().valid('pending', 'in_transit', 'delivered', 'failed').optional(),
  product_type: Joi.string().optional(),
  date_from: Joi.date().iso().optional(),
  date_to: Joi.date().iso().optional(),
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(20).optional(),
  sort_by: Joi.string().valid('created_at', 'amount', 'order_status', 'delivery_status').default('created_at').optional(),
  sort_order: Joi.string().valid('asc', 'desc').default('desc').optional()
});
