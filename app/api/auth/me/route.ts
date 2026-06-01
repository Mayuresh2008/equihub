import { db } from '@/lib/mock/db'

export async function GET() {
  return Response.json({ users: db.users.length, companies: db.companies.length })
}
