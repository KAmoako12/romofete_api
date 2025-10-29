import Joi from "joi";
/**
 * Hero section schema: section_title, section_description, images
 * section_position and section_name are set by the server
 */
export const heroSectionSchema = Joi.object({
  section_title: Joi.string().min(1).max(255).required(),
  section_description: Joi.string().min(1).max(1024).required(),
  section_images: Joi.array().items(Joi.string().uri()).min(1).required()
});

/**
 * section_name must be unique (enforced at DB level)
 */
export const createHomepageSettingsSchema = Joi.object({
  section_name: Joi.string().min(1).max(255).required(),
  section_description: Joi.string().min(1).max(1024).required(),
  section_position: Joi.number().integer().min(0).required(),
  is_active: Joi.boolean().optional(),
  section_images: Joi.array().items(Joi.string().uri()).optional(),
  product_ids: Joi.array().items(Joi.number().integer()).optional(),
});

/**
 * section_name must be unique (enforced at DB level)
 */
export const updateHomepageSettingsSchema = Joi.object({
  section_name: Joi.string().min(1).max(255).optional(),
  section_description: Joi.string().min(1).max(1024).optional(),
  section_position: Joi.number().integer().min(0).optional(),
  is_active: Joi.boolean().optional(),
  section_images: Joi.array().items(Joi.string().uri()).optional(),
  product_ids: Joi.array().items(Joi.number().integer()).optional(),
}).min(1); // At least one field must be provided
