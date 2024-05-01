const Joi = require('@hapi/joi');

export const envSchema = Joi.object({
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string(),
  PORT: Joi.number().default(3333),
});
