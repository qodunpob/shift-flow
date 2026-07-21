import Joi from 'joi';
import { registerAs } from '@nestjs/config';

export const authConfigValidation = {
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.number().required(),
};

export default registerAs('auth', () => ({
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: Number(process.env.JWT_EXPIRES_IN),
  },
}));
