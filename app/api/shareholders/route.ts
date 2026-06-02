import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/mock/db'
import { authFromHeader } from '@/lib/server-auth'
import { buildShareholderViews } from '@/lib/utils/captable'

// GET /api/shareholders — list (backward-compat, role-filtered)
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
  // Enrich with computed ownership %
  const enriched = items.map(s => {
    const companyShareholders = db.shareholders.filter(x => x.companyId === s.companyId)
    const views = buildShareholderViews(companyShareholders, db.optionGrants.filter(g => g.companyId === s.companyId))
    return views.find(v => v.id === s.id) || s
  })
  return NextResponse.json({ shareholders: enriched })
}

// POST /api/shareholders — add (backward-compat; redirects to company-scoped route)
// Body must include companyId.
export async function POST(req: NextRequest) {
  const auth = authFromHeader(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.user.role === 'investor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    if (!body.companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 })
    if (auth.user.role === 'startup_admin' && auth.user.companyId !== body.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const company = db.companies.find(c => c.id === body.companyId)
    if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

    const existing = db.shareholders.filter(s => s.companyId === body.companyId)
    const shares = Number(body.sharesOwned) || 0
    const price = Number(body.pricePerShare) || 0
    const shareholder = {
      id: 's' + Date.now(),
      companyId: body.companyId,
      userId: body.userId,
      name: body.name,
      email: body.email,
      phone: body.phone,
      country: body.country || 'United States',
      roleType: body.roleType || 'employee',
      sharesOwned: shares,
      shareClass: body.shareClass || 'common',
      pricePerShare: price,
      investmentAmount: shares * price,
      dateIssued: body.dateIssued || new Date().toISOString().split('T')[0],
      certificateNumber: 'SC-' + (existing.length + 1).toString().padStart(4, '0'),
      rights: body.rights || { boardSeat: false, votingRights: true, proRataRights: false, antiDilution: false, liquidationPreference: 1 },
      vesting: body.vesting || { enabled: false, cliffMonths: 12, totalMonths: 48, type: 'monthly', acceleration: false },
      status: body.status || 'active',
      notes: body.notes,
      createdAt: new Date().toISOString(),
    }
    db.shareholders.push(shareholder as any)
    db.equityTransactions.push({
      id: 'tx' + Date.now(),
      companyId: shareholder.companyId,
      toShareholderId: shareholder.id,
      transactionType: 'issuance',
      numShares: shares,
      pricePerShare: price,
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
