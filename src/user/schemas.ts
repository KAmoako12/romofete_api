import Joi from "joi";

export const createUserSchema = Joi.object({
  username: Joi.string().max(80).required(),
  email: Joi.string().email().max(120).required(),
  password: Joi.string().min(8).max(120).required(),
  role: Joi.string().valid("superAdmin", "admin").required(),
});
