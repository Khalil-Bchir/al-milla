import { z } from 'zod'
import dotenv from 'dotenv'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '../../../../')
const nodeEnv = process.env.NODE_ENV ?? 'development'

for (const candidate of [
  path.join(projectRoot, '.env.local'),
  path.join(projectRoot, `.env.${nodeEnv}`),
  path.join(projectRoot, '.env'),
]) {
  if (fs.existsSync(candidate)) {
    dotenv.config({ path: candidate })
  }
}

if (!process.env.DATABASE_URL && process.env.POSTGRES_PRISMA_URL) {
  process.env.DATABASE_URL = process.env.POSTGRES_PRISMA_URL
}
if (!process.env.DIRECT_URL && process.env.POSTGRES_URL_NON_POOLING) {
  process.env.DIRECT_URL = process.env.POSTGRES_URL_NON_POOLING
}
if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL
}
if (!process.env.SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
}
if (!process.env.SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'staging']).default('development'),
  PORT: z.string().default('3000'),
  API_URL: z.string().optional().default('https://api-al-milla.khalilbchir.pro'),
  WEB_URL: z.string().optional().default('https://al-milla.khalilbchir.pro'),
  ALLOWED_ORIGINS: z
    .string()
    .optional()
    .default(
      'https://al-milla.khalilbchir.pro,https://al-milla.vercel.app,http://localhost:3001,http://localhost:3000',
    ),

  // Database (Supabase via Prisma)
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),

  // Supabase (Auth/Storage usage)
  SUPABASE_URL: z.string(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_EMAIL_REDIRECT_URL: z.string().url().optional(),
  SUPABASE_RESET_REDIRECT_URL: z.string().url().optional(),
  SUPABASE_OAUTH_REDIRECT_URL: z.string().url().optional(),

  // Security
  JWT_SECRET: z.string().optional(),
  COOKIE_SECRET: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

function getEnv(): Env {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:')
      error.errors.forEach((err) => {
        console.error(`  ${err.path.join('.')}: ${err.message}`)
      })
      process.exit(1)
    }
    throw error
  }
}

export const env = getEnv()
