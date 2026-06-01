import { db } from '@/lib/mock/db'

export async function GET() {
  return Response.json({
    name: 'EquiHub API',
    version: '1.0.0',
    endpoints: {
      'POST /api/auth/login': 'Email + password -> { token, user }',
      'GET  /api/auth/me': 'Counts of users + companies',
      'GET  /api/companies': 'List all companies',
      'POST /api/companies': 'Create company (main_admin only)',
      'GET  /api/companies/:id': 'Company detail with shareholders, funding rounds, etc.',
      'POST /api/documents/:id/sign': 'Sign a document (body: { userId, signature? })',
      'POST /api/documents/generate': 'Generate a doc via AI (body: { companyId, docType, params, createdById })',
    },
  })
}
