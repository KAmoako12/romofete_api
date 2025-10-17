import Joi from "joi";

export const createCollectionSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(2000).optional().allow(""),
  image: Joi.array().items(Joi.string().max(500)).optional().allow(null),
  product_type_id: Joi.number().integer().positive().optional(),
  is_active: Joi.boolean().optional().default(true),
  products: Joi.array()
    .items(
      Joi.object({
        product_id: Joi.number().integer().positive().required(),
        position: Joi.number().integer().min(0).optional().default(0)
      })
    )
    .min(1)
    .optional()
});

export const updateCollectionSchema = Joi.object({
  name: Joi.string().min(1).max(200).optional(),
  description: Joi.string().max(2000).optional().allow(""),
  image: Joi.array().items(Joi.string().max(500)).optional().allow(null),
  product_type_id: Joi.number().integer().positive().optional().allow(null),
  is_active: Joi.boolean().optional(),
  products: Joi.array()
    .items(
      Joi.object({
        product_id: Joi.number().integer().positive().required(),
        position: Joi.number().integer().min(0).optional().default(0)
      })
    )
    .optional()
}).min(1);

export const addProductToCollectionSchema = Joi.object({
  product_id: Joi.number().integer().positive().required(),
  position: Joi.number().integer().min(0).optional().default(0)
});

export const updateCollectionProductSchema = Joi.object({
  position: Joi.number().integer().min(0).required()
});

export const collectionFiltersSchema = Joi.object({
  is_active: Joi.boolean().optional(),
  search: Joi.string().min(1).max(100).optional(),
  occasion: Joi.string().min(1).max(100).optional(),
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(20).optional(),
  sort_by: Joi.string().valid("name", "created_at", "updated_at").default("created_at").optional(),
  sort_order: Joi.string().valid("asc", "desc").default("desc").optional()
});

export const bulkAddProductsSchema = Joi.object({
  products: Joi.array()
    .items(
      Joi.object({
        product_id: Joi.number().integer().positive().required(),
        position: Joi.number().integer().min(0).optional().default(0)
      })
    )
    .min(1)
    .max(50)
    .required()
});
