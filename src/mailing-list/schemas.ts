import Joi from "joi";

export const addToMailingListSchema = Joi.object({
  email: Joi.string().email().max(120).required()
});

export const contactUsSchema = Joi.object({
  name: Joi.string().max(120).required(),
  email: Joi.string().email().max(120).required(),
  company: Joi.string().max(120).optional().allow(null, ''),
  message: Joi.string().max(1000).required()
});
