import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/mock/db'
import { authFromHeader } from '@/lib/server-auth'
import {
  buildShareholderViews, buildCapTableSummary, generateCertificateNumber,
  validateShareholderAdd, calculateDilutionImpact,
} from '@/lib/utils/captable'
import type { Shareholder, ShareholderRights, VestingSchedule, ShareholderStatus, ShareholderRole, ShareClass } from '@/lib/types'

function canAccessCompany(auth: ReturnType<typeof authFromHeader>, companyId: string): boolean {
  if (!auth) return false
  if (auth.user.role === 'main_admin') return true
  if (auth.user.role === 'startup_admin') return auth.user.companyId === companyId
  if (auth.user.role === 'investor') {
    const myInvestments = db.investments.filter(i => i.investorUserId === auth.user.id)
    return myInvestments.some(i => i.companyId === companyId)
  }
  return false
}

function canWrite(auth: ReturnType<typeof authFromHeader>, companyId: string): boolean {
  if (!auth) return false
  if (auth.user.role === 'investor') return false
  if (auth.user.role === 'startup_admin') return auth.user.companyId === companyId
  return true
}

// GET /api/companies/:id/shareholders
// Returns shareholders enriched with computed %s and a summary
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = authFromHeader(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canAccessCompany(auth, params.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const company = db.companies.find(c => c.id === params.id)
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  const shareholders = db.shareholders.filter(s => s.companyId === params.id)
  const optionGrants = db.optionGrants.filter(g => g.companyId === params.id)
  const views = buildShareholderViews(shareholders, optionGrants)
  const summary = buildCapTableSummary(params.id, company.totalAuthorizedShares, shareholders, optionGrants, company.currentValuation)
  return NextResponse.json({ shareholders: views, summary })
}

// POST /api/companies/:id/shareholders
// Add a new shareholder. Recalculates all ownership %s automatically.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = authFromHeader(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canWrite(auth, params.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const company = db.companies.find(c => c.id === params.id)
    if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

    const existing = db.shareholders.filter(s => s.companyId === params.id)
    const errors = validateShareholderAdd({
      name: body.name, email: body.email,
      sharesOwned: Number(body.sharesOwned) || 0,
      pricePerShare: Number(body.pricePerShare) || 0,
      dateIssued: body.dateIssued,
      companyId: params.id,
    }, existing, company.totalAuthorizedShares)
    if (errors.length > 0) {
      return NextResponse.json({ error: errors.map(e => e.message).join('; ') }, { status: 400 })
    }

    const certNumber = generateCertificateNumber(params.id, existing)
    const rights: ShareholderRights = body.rights || {
      boardSeat: false, votingRights: true, proRataRights: false, antiDilution: false, liquidationPreference: 1,
    }
    const vesting: VestingSchedule = body.vesting || {
      enabled: false, cliffMonths: 12, totalMonths: 48, type: 'monthly', acceleration: false,
    }
    const shares = Number(body.sharesOwned) || 0
    const price = Number(body.pricePerShare) || 0
    const shareholder: Shareholder = {
      id: 's' + Date.now(),
      companyId: params.id,
      userId: body.userId,
      name: body.name,
      email: body.email,
      phone: body.phone,
      country: body.country || 'United States',
      avatarUrl: body.avatarUrl,
      roleType: (body.roleType || 'employee') as ShareholderRole,
      sharesOwned: shares,
      shareClass: (body.shareClass || 'common') as ShareClass,
      pricePerShare: price,
      investmentAmount: shares * price,
      dateIssued: body.dateIssued || new Date().toISOString().split('T')[0],
      certificateNumber: certNumber,
      rights,
      vesting,
      status: (body.status || 'active') as ShareholderStatus,
      notes: body.notes,
      documentLinks: body.documentLinks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    db.shareholders.push(shareholder)

    // Compute dilution impact: snapshot before / after
    const dilution = calculateDilutionImpact(existing, [
      { isNew: true, name: shareholder.name, sharesDelta: shares },
    ], db.optionGrants.filter(g => g.companyId === params.id))

    // Append to immutable ledger
    db.equityTransactions.push({
      id: 'tx' + Date.now(),
      companyId: params.id,
      toShareholderId: shareholder.id,
      transactionType: 'issuance',
      numShares: shares,
      pricePerShare: price,
      transactionDate: shareholder.dateIssued,
      status: 'completed',
      notes: `Initial issuance via UI · Certificate #${certNumber}`,
      pctBefore: 0,
      pctAfter: dilution.impacts.find(i => i.shareholderId === shareholder.id)?.pctAfter || 0,
      createdAt: new Date().toISOString(),
    } as any)

    db.auditLogs.push({
      id: 'al' + Date.now(),
      userId: auth.user.id,
      action: 'shareholder.added',
      resourceType: 'shareholder',
      resourceId: shareholder.id,
      newValue: { name: shareholder.name, shares, shareClass: shareholder.shareClass, certificateNumber: certNumber },
      timestamp: new Date().toISOString(),
    } as any)

    // Notify all existing shareholders of dilution
    for (const s of existing) {
      const impact = dilution.impacts.find(i => i.shareholderId === s.id)
      if (impact && impact.change < 0) {
        db.notifications.push({
          id: 'n' + Date.now() + Math.random().toString(36).slice(2, 5),
          userId: s.userId || 'u_' + s.id,
          type: 'captable.diluted',
          message: `${s.name}: ownership ${impact.pctBefore.toFixed(2)}% → ${impact.pctAfter.toFixed(2)}% (${impact.change.toFixed(2)}%) after ${shareholder.name} joined`,
          isRead: false,
          createdAt: new Date().toISOString(),
        } as any)
      }
    }

    const refreshed = buildShareholderViews(db.shareholders.filter(s => s.companyId === params.id), db.optionGrants.filter(g => g.companyId === params.id))
    const summary = buildCapTableSummary(params.id, company.totalAuthorizedShares, db.shareholders.filter(s => s.companyId === params.id), db.optionGrants.filter(g => g.companyId === params.id), company.currentValuation)

    return NextResponse.json({ shareholder, shareholders: refreshed, summary, dilutionImpact: dilution.impacts }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}
