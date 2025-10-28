import Joi from "joi";

export const createHomepageSettingsSchema = Joi.object({
  section_title: Joi.string().min(1).max(255).required(),
  section_position: Joi.number().integer().min(0).required(),
  is_active: Joi.boolean().optional(),
  section_images: Joi.array().items(Joi.string().uri()).optional(),
});

export const updateHomepageSettingsSchema = Joi.object({
  section_title: Joi.string().min(1).max(255).optional(),
  section_position: Joi.number().integer().min(0).optional(),
  is_active: Joi.boolean().optional(),
  section_images: Joi.array().items(Joi.string().uri()).optional(),
}).min(1); // At least one field must be provided
