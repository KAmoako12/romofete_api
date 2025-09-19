import Joi from "joi";

export const createDeliveryOptionSchema = Joi.object({
  name: Joi.string().max(100).required(),
  amount: Joi.number().positive().precision(2).required(),
});

export const updateDeliveryOptionSchema = Joi.object({
  name: Joi.string().max(100).optional(),
  amount: Joi.number().positive().precision(2).optional(),
}).min(1); // At least one field must be provided
