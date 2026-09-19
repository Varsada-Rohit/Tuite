import { z } from 'zod';

/**
 * Zod schema that validates all required environment variables at startup.
 * If any variable is missing or malformed, the app will fail fast with a
 * clear error message rather than crashing at runtime.
 */
export const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),

  // Database
  DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a valid PostgreSQL connection string' }),

  // JWT
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // Firebase
  FIREBASE_PROJECT_ID: z.string().min(1, 'FIREBASE_PROJECT_ID is required'),

  // CORS
  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  // Throttling
  THROTTLE_TTL: z.coerce.number().int().positive().default(60),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(20),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validates environment variables using the Zod schema.
 * Used by @nestjs/config's `validate` option.
 */
export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  ✗ ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(`\n\n❌ Environment validation failed:\n${formatted}\n`);
  }

  return result.data;
}
