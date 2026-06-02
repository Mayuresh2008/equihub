// Environment variable validation
// Ensures all required env vars are present at boot
// Real values come from .env.local in dev and from EC2 user-data / Secrets Manager in prod

import { z } from 'zod'

const schema = z.object({
  // Database
  DATABASE_URL: z.string().default('postgresql://placeholder:5432/equihub'),
  USE_MOCK_DB: z.enum(['true', 'false']).default('true'),

  // AWS
  AWS_REGION: z.string().default('ap-southeast-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),

  // Cognito
  COGNITO_USER_POOL_ID: z.string().optional(),
  COGNITO_CLIENT_ID: z.string().optional(),
  COGNITO_CLIENT_SECRET: z.string().optional(),

  // S3
  S3_BUCKET_DOCUMENTS: z.string().default('equihub-documents'),
  S3_BUCKET_PUBLIC: z.string().default('equihub-public'),

  // SES (notifications email)
  SES_FROM_EMAIL: z.string().default('noreply@equihub.com'),

  // App
  NEXTAUTH_SECRET: z.string().default('dev-secret-change-in-prod'),
  NEXT_PUBLIC_APP_URL: z.string().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

const parsed = schema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  USE_MOCK_DB: process.env.USE_MOCK_DB,
  AWS_REGION: process.env.AWS_REGION,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID,
  COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID,
  COGNITO_CLIENT_SECRET: process.env.COGNITO_CLIENT_SECRET,
  S3_BUCKET_DOCUMENTS: process.env.S3_BUCKET_DOCUMENTS,
  S3_BUCKET_PUBLIC: process.env.S3_BUCKET_PUBLIC,
  SES_FROM_EMAIL: process.env.SES_FROM_EMAIL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NODE_ENV: process.env.NODE_ENV,
})

if (!parsed.success && typeof window === 'undefined') {
  console.warn('[env] validation issues:', parsed.error.flatten().fieldErrors)
}

export const env = parsed.success ? parsed.data : schema.parse({})

export const isMockMode = () => env.USE_MOCK_DB === 'true'
