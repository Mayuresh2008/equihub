import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/mock/db'

export async function GET(req: NextRequest) {
  const role = req.nextUrl.searchParams.get('role')
  let companies = db.companies
  if (role === 'startup_admin' || role === 'investor') {
    companies = db.companies.filter(c => c.isActive)
  }
  return NextResponse.json({ companies })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const id = 'c' + Date.now()
    const company = {
      id,
      companyName: body.companyName,
      legalName: body.legalName || body.companyName,
      incorporationDate: body.incorporationDate || new Date().toISOString(),
      jurisdiction: body.jurisdiction || 'Delaware, USA',
      industry: body.industry || 'Technology',
      totalSharesAuthorized: body.totalSharesAuthorized || 10000000,
      createdById: body.createdById,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    db.companies.push(company as any)
    return NextResponse.json({ company }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
