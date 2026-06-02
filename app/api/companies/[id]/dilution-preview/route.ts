import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/mock/db'
import { authFromHeader } from '@/lib/server-auth'
import { calculateDilutionImpact } from '@/lib/utils/captable'

// POST /api/companies/:id/dilution-preview
// Body: { changes: [{ shareholderId?, name?, sharesDelta, isNew? }] }
// Returns the "what-if" impact without persisting anything.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = authFromHeader(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.user.role === 'investor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const body = await req.json()
    const shareholders = db.shareholders.filter(s => s.companyId === params.id)
    const optionGrants = db.optionGrants.filter(g => g.companyId === params.id)
    const company = db.companies.find(c => c.id === params.id)
    if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    const result = calculateDilutionImpact(shareholders, body.changes || [], optionGrants)
    return NextResponse.json({
      oldTotal: result.oldTotal,
      newTotal: result.newTotal,
      pctSum: result.pctSum,
      impacts: result.impacts,
      authorized: company.totalAuthorizedShares,
      wouldExceedAuthorized: result.newTotal > company.totalAuthorizedShares,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
