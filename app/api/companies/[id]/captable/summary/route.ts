import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/mock/db'
import { authFromHeader } from '@/lib/server-auth'
import { buildCapTableSummary } from '@/lib/utils/captable'

// GET /api/companies/:id/captable/summary
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = authFromHeader(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.user.role === 'investor') {
    const myInvestments = db.investments.filter(i => i.investorUserId === auth.user.id)
    if (!myInvestments.some(i => i.companyId === params.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  } else if (auth.user.role === 'startup_admin' && auth.user.companyId !== params.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const company = db.companies.find(c => c.id === params.id)
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })
  const shareholders = db.shareholders.filter(s => s.companyId === params.id)
  const optionGrants = db.optionGrants.filter(g => g.companyId === params.id)
  const summary = buildCapTableSummary(params.id, company.totalAuthorizedShares, shareholders, optionGrants, company.currentValuation)
  return NextResponse.json({ summary })
}
