import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/mock/db'
import { authFromHeader } from '@/lib/server-auth'

export async function GET(req: NextRequest) {
  const auth = authFromHeader(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let items = db.shareholders
  if (auth.user.role === 'startup_admin' && auth.user.companyId) {
    items = items.filter(s => s.companyId === auth.user.companyId)
  } else if (auth.user.role === 'investor') {
    const myInvestments = db.investments.filter(i => i.investorUserId === auth.user.id)
    const companyIds = new Set(myInvestments.map(i => i.companyId))
    items = items.filter(s => companyIds.has(s.companyId))
  }
  return NextResponse.json({ shareholders: items })
}

export async function POST(req: NextRequest) {
  const auth = authFromHeader(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.user.role === 'investor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const shareholder = {
      id: 's' + Date.now(),
      companyId: body.companyId,
      userId: body.userId,
      name: body.name,
      email: body.email,
      roleType: body.roleType,
      sharesOwned: Number(body.sharesOwned) || 0,
      shareClass: body.shareClass || 'common',
      dateIssued: body.dateIssued || new Date().toISOString().split('T')[0],
      country: body.country || 'United States',
      createdAt: new Date().toISOString(),
    }
    if (auth.user.role === 'startup_admin' && auth.user.companyId !== shareholder.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    db.shareholders.push(shareholder as any)

    // Append to immutable ledger
    db.equityTransactions.push({
      id: 'tx' + Date.now(),
      companyId: shareholder.companyId,
      toShareholderId: shareholder.id,
      transactionType: 'issuance',
      numShares: shareholder.sharesOwned,
      pricePerShare: 0,
      transactionDate: shareholder.dateIssued,
      status: 'completed',
      notes: 'Initial issuance via UI',
      createdAt: new Date().toISOString(),
    } as any)

    db.auditLogs.push({
      id: 'al' + Date.now(), userId: auth.user.id, action: 'shareholder.added',
      resourceType: 'shareholder', resourceId: shareholder.id, newValue: shareholder, timestamp: new Date().toISOString(),
    } as any)
    return NextResponse.json({ shareholder }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
