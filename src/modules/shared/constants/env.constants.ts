import dotenv from 'dotenv';
dotenv.config();
import { z } from 'zod';
const envSchema = z.object({
  PORT: z.string(),
  MONGO_URI: z.string(),
  NODE_ENV: z.enum(['development', 'production', 'staging']),
  DEFAULT_EMAIL: z.string(),
  JWT_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  MAILGUN_API_KEY: z.string(),
  MAILGUN_DOMAIN: z.string(),
  AI_WEB_URL: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_SECRET: z.string(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  const missingVariables = Object.keys(envSchema.shape).filter(
    (key) => !process.env[key],
  );
  throw new Error('Environment variables validation failed.');
}
export const Env = parsedEnv.data;
export const isProd = Env.NODE_ENV === 'production';
export const isTest = Env.NODE_ENV === 'staging';
export const isDev = Env.NODE_ENV === 'development';
