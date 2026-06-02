import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/mock/db'
import { authFromHeader } from '@/lib/server-auth'

export async function GET(req: NextRequest) {
  const auth = authFromHeader(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let items = db.investments
  if (auth.user.role === 'investor') {
    items = items.filter(i => i.investorUserId === auth.user.id)
  } else if (auth.user.role === 'startup_admin' && auth.user.companyId) {
    items = items.filter(i => i.companyId === auth.user.companyId)
  }
  return NextResponse.json({ investments: items })
}

export async function POST(req: NextRequest) {
  const auth = authFromHeader(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const item = {
      id: 'inv' + Date.now(),
      investorUserId: body.investorUserId,
      companyId: body.companyId,
      fundingRoundId: body.fundingRoundId,
      amountInvested: Number(body.amountInvested) || 0,
      currency: body.currency || 'USD',
      sharesReceived: Number(body.sharesReceived) || 0,
      shareClass: body.shareClass || 'preferred',
      investmentDate: body.investmentDate || new Date().toISOString().split('T')[0],
      currentValue: body.currentValue,
      createdAt: new Date().toISOString(),
    }
    db.investments.push(item as any)
    db.auditLogs.push({
      id: 'al' + Date.now(), userId: auth.user.id, action: 'investment.added',
      resourceType: 'investment', resourceId: item.id, newValue: item, timestamp: new Date().toISOString(),
    } as any)
    return NextResponse.json({ investment: item }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
