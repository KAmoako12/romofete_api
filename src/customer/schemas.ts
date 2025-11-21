import Joi from "joi";

export const verifyEmailSchema = Joi.object({
  email: Joi.string().email().max(120).required(),
  code: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.length': 'Verification code must be exactly 6 digits',
    'string.pattern.base': 'Verification code must contain only numbers'
  })
});

export const resendVerificationSchema = Joi.object({
  email: Joi.string().email().max(120).required()
});

export const requestPasswordResetSchema = Joi.object({
  email: Joi.string().email().max(120).required()
});

export const resetPasswordSchema = Joi.object({
  code: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.length': 'Reset code must be exactly 6 digits',
    'string.pattern.base': 'Reset code must contain only numbers'
  }),
  new_password: Joi.string().min(8).max(120).required().messages({
    'string.min': 'Password must be at least 8 characters long'
  })
});

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
