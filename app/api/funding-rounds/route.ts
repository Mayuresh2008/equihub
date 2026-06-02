import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/mock/db'
import { authFromHeader } from '@/lib/server-auth'

export async function GET(req: NextRequest) {
  const auth = authFromHeader(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let items = db.fundingRounds
  if (auth.user.role === 'startup_admin' && auth.user.companyId) {
    items = items.filter(r => r.companyId === auth.user.companyId)
  } else if (auth.user.role === 'investor') {
    const myInvestments = db.investments.filter(i => i.investorUserId === auth.user.id)
    const companyIds = new Set(myInvestments.map(i => i.companyId))
    items = items.filter(r => companyIds.has(r.companyId))
  }
  return NextResponse.json({ fundingRounds: items })
}

export async function POST(req: NextRequest) {
  const auth = authFromHeader(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.user.role === 'investor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const body = await req.json()
    if (auth.user.role === 'startup_admin' && auth.user.companyId !== body.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const pre = Number(body.preMoneyValuation) || 0
    const raised = Number(body.amountRaised) || 0
    const post = pre + raised
    const newShares = body.newSharesIssued ? Number(body.newSharesIssued) : Math.round(raised / Math.max(0.01, Number(body.pricePerShare) || 1))
    const item = {
      id: 'fr' + Date.now(),
      companyId: body.companyId,
      roundName: body.roundName,
      amountRaised: raised,
      currency: body.currency || 'USD',
      roundDate: body.roundDate || new Date().toISOString().split('T')[0],
      leadInvestor: body.leadInvestor,
      preMoneyValuation: pre,
      postMoneyValuation: post,
      pricePerShare: Number(body.pricePerShare) || (raised / Math.max(1, newShares)),
      newSharesIssued: newShares,
      createdAt: new Date().toISOString(),
    }
    db.fundingRounds.push(item as any)
    db.auditLogs.push({
      id: 'al' + Date.now(), userId: auth.user.id, action: 'funding_round.added',
      resourceType: 'funding_round', resourceId: item.id, newValue: item, timestamp: new Date().toISOString(),
    } as any)
    return NextResponse.json({ fundingRound: item }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
