import Joi from "joi";

export const createOrderSchema = Joi.object({
  user_id: Joi.number().integer().positive().optional(),
  items: Joi.array().items(
    Joi.object({
      product_id: Joi.number().integer().positive().required(),
      quantity: Joi.number().integer().positive().required()
    })
  ).min(1).required(),
  delivery_option_id: Joi.number().integer().positive().optional(),
  delivery_address: Joi.string().max(500).optional(),
  customer_email: Joi.string().email().max(120).optional(),
  customer_phone: Joi.string().max(20).optional(),
  customer_name: Joi.string().max(160).optional()
});

export const updateOrderSchema = Joi.object({
  status: Joi.string().valid('pending', 'processing', 'shipped', 'delivered', 'cancelled').optional(),
  payment_status: Joi.string().valid('pending', 'processing', 'completed', 'failed', 'refunded').optional(),
  payment_reference: Joi.string().max(100).optional(),
  delivery_address: Joi.string().max(500).optional()
}).min(1); // At least one field must be provided

export const orderFiltersSchema = Joi.object({
  user_id: Joi.number().integer().positive().optional(),
  status: Joi.string().valid('pending', 'processing', 'shipped', 'delivered', 'cancelled').optional(),
  payment_status: Joi.string().valid('pending', 'processing', 'completed', 'failed', 'refunded').optional(),
  customer_email: Joi.string().email().optional(),
  date_from: Joi.date().iso().optional(),
  date_to: Joi.date().iso().optional(),
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(20).optional(),
  sort_by: Joi.string().valid('created_at', 'total_price', 'status', 'payment_status').default('created_at').optional(),
  sort_order: Joi.string().valid('asc', 'desc').default('desc').optional()
});


export const orderStatsFiltersSchema = Joi.object({
  date_from: Joi.date().iso().optional(),
  date_to: Joi.date().iso().optional(),
  status: Joi.string().valid('pending', 'processing', 'shipped', 'delivered', 'cancelled').optional(),
  payment_status: Joi.string().valid('pending', 'processing', 'completed', 'failed', 'refunded').optional()
});
