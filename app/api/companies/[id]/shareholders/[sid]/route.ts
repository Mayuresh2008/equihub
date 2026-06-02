import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/mock/db'
import { authFromHeader } from '@/lib/server-auth'
import { buildShareholderViews } from '@/lib/utils/captable'

// GET /api/companies/:id/shareholders/:sid — full profile
export async function GET(req: NextRequest, { params }: { params: { id: string; sid: string } }) {
  const auth = authFromHeader(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const s = db.shareholders.find(x => x.id === params.sid && x.companyId === params.id)
  if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (auth.user.role === 'startup_admin' && auth.user.companyId !== params.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (auth.user.role === 'investor') {
    const myInvestments = db.investments.filter(i => i.investorUserId === auth.user.id)
    if (!myInvestments.some(i => i.companyId === params.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }
  const optionGrants = db.optionGrants.filter(g => g.companyId === params.id)
  const all = db.shareholders.filter(x => x.companyId === params.id)
  const views = buildShareholderViews(all, optionGrants)
  const view = views.find(v => v.id === s.id)
  return NextResponse.json({ shareholder: view || s, all: views })
}

// PUT /api/companies/:id/shareholders/:sid — edit
export async function PUT(req: NextRequest, { params }: { params: { id: string; sid: string } }) {
  const auth = authFromHeader(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.user.role === 'investor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const idx = db.shareholders.findIndex(x => x.id === params.sid && x.companyId === params.id)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (auth.user.role === 'startup_admin' && auth.user.companyId !== params.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const body = await req.json()
    const old = db.shareholders[idx]
    const updated = {
      ...old,
      name: body.name ?? old.name,
      email: body.email ?? old.email,
      phone: body.phone ?? old.phone,
      country: body.country ?? old.country,
      avatarUrl: body.avatarUrl ?? old.avatarUrl,
      roleType: body.roleType ?? old.roleType,
      sharesOwned: body.sharesOwned !== undefined ? Number(body.sharesOwned) : old.sharesOwned,
      shareClass: body.shareClass ?? old.shareClass,
      pricePerShare: body.pricePerShare !== undefined ? Number(body.pricePerShare) : old.pricePerShare,
      investmentAmount: body.investmentAmount !== undefined ? Number(body.investmentAmount) : old.investmentAmount,
      dateIssued: body.dateIssued ?? old.dateIssued,
      status: body.status ?? old.status,
      notes: body.notes ?? old.notes,
      rights: body.rights ?? old.rights,
      vesting: body.vesting ?? old.vesting,
      documentLinks: body.documentLinks ?? old.documentLinks,
      updatedAt: new Date().toISOString(),
    }
    if (updated.sharesOwned < 0) return NextResponse.json({ error: 'Shares cannot be negative' }, { status: 400 })
    db.shareholders[idx] = updated
    db.auditLogs.push({
      id: 'al' + Date.now(),
      userId: auth.user.id,
      action: 'shareholder.updated',
      resourceType: 'shareholder',
      resourceId: params.sid,
      oldValue: { name: old.name, shares: old.sharesOwned, role: old.roleType },
      newValue: { name: updated.name, shares: updated.sharesOwned, role: updated.roleType },
      timestamp: new Date().toISOString(),
    } as any)
    return NextResponse.json({ shareholder: updated })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// DELETE /api/companies/:id/shareholders/:sid — soft-cancel
export async function DELETE(req: NextRequest, { params }: { params: { id: string; sid: string } }) {
  const auth = authFromHeader(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.user.role === 'investor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const idx = db.shareholders.findIndex(x => x.id === params.sid && x.companyId === params.id)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (auth.user.role === 'startup_admin' && auth.user.companyId !== params.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const old = db.shareholders[idx]
  db.shareholders[idx] = { ...old, status: 'cancelled', sharesOwned: 0, updatedAt: new Date().toISOString() }
  db.equityTransactions.push({
    id: 'tx' + Date.now(),
    companyId: params.id,
    fromShareholderId: params.sid,
    transactionType: 'cancellation',
    numShares: old.sharesOwned,
    pricePerShare: old.pricePerShare,
    transactionDate: new Date().toISOString().split('T')[0],
    status: 'completed',
    notes: `Cancelled by ${auth.user.fullName}`,
    pctBefore: 0,
    pctAfter: 0,
    createdAt: new Date().toISOString(),
  } as any)
  db.auditLogs.push({
    id: 'al' + Date.now(),
    userId: auth.user.id,
    action: 'shareholder.cancelled',
    resourceType: 'shareholder',
    resourceId: params.sid,
    oldValue: { name: old.name, shares: old.sharesOwned },
    timestamp: new Date().toISOString(),
  } as any)
  return NextResponse.json({ ok: true })
}
