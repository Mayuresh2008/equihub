import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/mock/db'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const company = db.companies.find(c => c.id === params.id)
  if (!company) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const shareholders = db.shareholders.filter(s => s.companyId === params.id)
  const fundingRounds = db.fundingRounds.filter(r => r.companyId === params.id)
  const optionGrants = db.optionGrants.filter(g => g.companyId === params.id)
  const documents = db.documents.filter(d => d.companyId === params.id)
  return NextResponse.json({ company, shareholders, fundingRounds, optionGrants, documents })
}
