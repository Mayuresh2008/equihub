import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/mock/db'
import { authFromHeader } from '@/lib/server-auth'
import { buildDilutionHistory } from '@/lib/utils/captable'

// GET /api/companies/:id/dilution-history
// Returns full timeline of founding + funding + transactions + transfers
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
  const shareholders = db.shareholders.filter(s => s.companyId === params.id)
  const rounds = db.fundingRounds.filter(r => r.companyId === params.id)
  const transactions = db.equityTransactions.filter(t => t.companyId === params.id)
  const transfers = (db as any).shareTransfers?.filter((t: any) => t.companyId === params.id) || []
  const history = buildDilutionHistory(shareholders, rounds, transactions, transfers)
  return NextResponse.json({ history })
}
