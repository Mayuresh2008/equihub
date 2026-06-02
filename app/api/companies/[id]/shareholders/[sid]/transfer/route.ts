import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/mock/db'
import { authFromHeader } from '@/lib/server-auth'
import { validateTransfer, buildShareholderViews, buildCapTableSummary } from '@/lib/utils/captable'
import type { ShareTransfer } from '@/lib/types'

// POST /api/companies/:id/shareholders/:sid/transfer
// Body: { toShareholderId, numShares, pricePerShare, transferDate, reason }
export async function POST(req: NextRequest, { params }: { params: { id: string; sid: string } }) {
  const auth = authFromHeader(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.user.role === 'investor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (auth.user.role === 'startup_admin' && auth.user.companyId !== params.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const from = db.shareholders.find(s => s.id === params.sid && s.companyId === params.id)
    const to = db.shareholders.find(s => s.id === body.toShareholderId && s.companyId === params.id)
    const numShares = Number(body.numShares) || 0
    const pricePerShare = Number(body.pricePerShare) || 0
    const transferDate = body.transferDate || new Date().toISOString().split('T')[0]

    const errors = validateTransfer(from, to, numShares, transferDate)
    if (errors.length > 0) {
      return NextResponse.json({ error: errors.map(e => e.message).join('; ') }, { status: 400 })
    }

    // Apply: decrement from, increment to
    const fromIdx = db.shareholders.findIndex(s => s.id === params.sid)
    const toIdx = db.shareholders.findIndex(s => s.id === body.toShareholderId)
    db.shareholders[fromIdx] = { ...db.shareholders[fromIdx], sharesOwned: from!.sharesOwned - numShares, updatedAt: new Date().toISOString() }
    db.shareholders[toIdx] = { ...db.shareholders[toIdx], sharesOwned: to!.sharesOwned + numShares, updatedAt: new Date().toISOString() }

    // Record transfer
    const transfer: ShareTransfer = {
      id: 'tr' + Date.now(),
      companyId: params.id,
      fromShareholderId: from!.id,
      toShareholderId: to!.id,
      numShares,
      pricePerShare,
      transferDate,
      reason: body.reason,
      createdById: auth.user.id,
      createdAt: new Date().toISOString(),
    }
    if (!db.shareTransfers) (db as any).shareTransfers = []
    db.shareTransfers.push(transfer)

    // Equity transaction (immutable ledger)
    db.equityTransactions.push({
      id: 'tx' + Date.now(),
      companyId: params.id,
      fromShareholderId: from!.id,
      toShareholderId: to!.id,
      transactionType: 'transfer',
      numShares,
      pricePerShare,
      transactionDate: transferDate,
      status: 'completed',
      notes: body.reason || `Transfer from ${from!.name} to ${to!.name}`,
      createdAt: new Date().toISOString(),
    } as any)

    db.auditLogs.push({
      id: 'al' + Date.now(),
      userId: auth.user.id,
      action: 'shareholder.transferred',
      resourceType: 'ShareTransfer',
      resourceId: transfer.id,
      newValue: { from: from!.id, to: to!.id, numShares, pricePerShare, reason: body.reason },
      timestamp: new Date().toISOString(),
    } as any)

    // Notify both parties
    db.notifications.push(
      { id: 'n' + Date.now() + 'a', userId: from!.userId || 'u_' + from!.id, type: 'shares.transferred.out', message: `You transferred ${numShares.toLocaleString()} shares to ${to!.name}`, isRead: false, createdAt: new Date().toISOString() } as any,
      { id: 'n' + Date.now() + 'b', userId: to!.userId || 'u_' + to!.id, type: 'shares.transferred.in', message: `You received ${numShares.toLocaleString()} shares from ${from!.name}`, isRead: false, createdAt: new Date().toISOString() } as any,
    )

    const company = db.companies.find(c => c.id === params.id)
    const refreshed = buildShareholderViews(db.shareholders.filter(s => s.companyId === params.id), db.optionGrants.filter(g => g.companyId === params.id))
    const summary = buildCapTableSummary(params.id, company!.totalAuthorizedShares, db.shareholders.filter(s => s.companyId === params.id), db.optionGrants.filter(g => g.companyId === params.id), company!.currentValuation)
    return NextResponse.json({ transfer, shareholders: refreshed, summary }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
