import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DB_HOST: z.string().min(1).default("127.0.0.1"),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_USER: z.string().min(1).default("root"),
  DB_PASSWORD: z.string().default("1234"),
  DB_NAME: z.string().min(1).default("jessoft_sales"),
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must contain at least 32 characters")
    .default("jwt_secret_for_local_development_123456"),
  JWT_EXPIRES_IN: z.string().default("1h"),
  CLIENT_ORIGIN: z.string().url().default("http://127.0.0.1:3000"),
});

export const env = envSchema.parse(process.env);
