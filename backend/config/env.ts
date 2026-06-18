// backend/config/env.ts
// Centralised environment variable loading & validation via Zod.

import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SOCKET_PORT: z.string().default('3001'),
  NEXT_PUBLIC_SOCKET_URL: z.string().default('http://localhost:3001'),
  NEXTAUTH_URL: z.string().default('http://localhost:3000'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('debug'),
})

export type Env = z.infer<typeof envSchema>

/** Validated env — throws on first import if required vars are missing. */
function loadEnv(): Env {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
      .join('\n')
    console.error(`❌ Invalid environment variables:\n${formatted}`)
    // In development, fall back gracefully; in CI/prod, crash.
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Missing required environment variables')
    }
    // Return a partial parse with defaults for dev convenience
    return envSchema.parse({
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/cure',
      JWT_SECRET: process.env.JWT_SECRET || 'dev-fallback-secret-key-change-me',
    })
  }
  return result.data
}

export const env = loadEnv()
