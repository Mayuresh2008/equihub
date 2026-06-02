// Prisma client singleton for EquiHub
// In production this connects to AWS RDS PostgreSQL via DATABASE_URL
// For local dev we use the mock data store (see lib/mock/db.ts)
//
// To switch to real DB:
//   1. Set DATABASE_URL=postgresql://user:pass@your-rds-endpoint:5432/equihub
//   2. Run: npx prisma migrate deploy
//   3. Set USE_MOCK_DB=false in env
//
// Currently USE_MOCK_DB defaults to "true" so the in-memory store is used.

import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
