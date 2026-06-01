// Prisma client singleton
// In production this would connect to AWS RDS PostgreSQL
// For development we use mock data from lib/mock/
// To enable real DB: run `npx prisma generate` then set DATABASE_URL

declare const PrismaClient: any

const globalForPrisma = global as unknown as { prisma: any }

export const prisma = globalForPrisma.prisma || (typeof PrismaClient !== 'undefined' ? new PrismaClient() : null)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
