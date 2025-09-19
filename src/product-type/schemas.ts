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
