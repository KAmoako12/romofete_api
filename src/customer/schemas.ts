import Joi from "joi";

export const createCustomerSchema = Joi.object({
  first_name: Joi.string().max(80).optional(),
  last_name: Joi.string().max(80).optional(),
  phone: Joi.string().max(20).optional(),
  address: Joi.string().max(255).optional(),
  city: Joi.string().max(80).optional(),
  state: Joi.string().max(80).optional(),
  zip_code: Joi.string().max(20).optional(),
  country: Joi.string().max(80).optional(),
  email: Joi.string().email().max(120).required(),
  password: Joi.string().min(8).max(120).required(),
});

export const updateCustomerSchema = Joi.object({
  first_name: Joi.string().max(80).optional(),
  last_name: Joi.string().max(80).optional(),
  phone: Joi.string().max(20).optional(),
  address: Joi.string().max(255).optional(),
  city: Joi.string().max(80).optional(),
  state: Joi.string().max(80).optional(),
  zip_code: Joi.string().max(20).optional(),
  country: Joi.string().max(80).optional(),
  email: Joi.string().email().max(120).optional(),
  password: Joi.string().min(8).max(120).optional(),
});

export const loginCustomerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});
