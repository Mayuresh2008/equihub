// Cap table calculation utilities — Carta-style dilution engine
// All percentages auto-recompute from shares / total. ALWAYS totals 100.00%.

import type {
  Shareholder, ShareholderView, FundingRound, OptionGrant, EquityTransaction,
  CapTableSummary, DilutionEvent, ShareholderRole, ShareClass, ShareTransfer,
} from '../types'
import { SHAREHOLDER_ROLE_META } from '../types'

// ────────────────────────────────────────────────────────────────
// 1. CORE DILUTION FORMULA
//    % = (shares / total issued shares) × 100
//    Recalculated for EVERY shareholder on EVERY share change.
// ────────────────────────────────────────────────────────────────

export function calculateOwnership(shares: number, totalShares: number): number {
  if (!totalShares || totalShares <= 0) return 0
  return (shares / totalShares) * 100
}

export function totalIssuedShares(shareholders: Shareholder[]): number {
  return shareholders
    .filter(s => s.status === 'active' || s.status === 'transferred')
    .reduce((sum, s) => sum + s.sharesOwned, 0)
}

export function totalUnissuedShares(authorized: number, issued: number): number {
  return Math.max(0, authorized - issued)
}

export function postMoneyValuation(preMoney: number, amountRaised: number): number {
  return preMoney + amountRaised
}

export function pricePerShare(postMoney: number, totalShares: number): number {
  if (totalShares === 0) return 0
  return postMoney / totalShares
}

// ────────────────────────────────────────────────────────────────
// 2. FULLY DILUTED VIEW
//    Counts unexercised options, unconverted SAFEs, warrants.
// ────────────────────────────────────────────────────────────────

export function computeFullyDilutedShares(
  shareholders: Shareholder[],
  optionGrants: OptionGrant[] = [],
): number {
  const issued = shareholders
    .filter(s => s.status === 'active' || s.status === 'transferred')
    .reduce((sum, s) => sum + s.sharesOwned, 0)
  const optionsPool = optionGrants
    .filter(g => g.status === 'active')
    .reduce((sum, g) => sum + g.numOptions, 0)
  return issued + optionsPool
}

// ────────────────────────────────────────────────────────────────
// 3. VIEW MODEL — enriches shareholders with computed %s
// ────────────────────────────────────────────────────────────────

export function buildShareholderViews(
  shareholders: Shareholder[],
  optionGrants: OptionGrant[] = [],
): ShareholderView[] {
  const issued = totalIssuedShares(shareholders)
  const fullyDiluted = computeFullyDilutedShares(shareholders, optionGrants)
  return shareholders.map(s => ({
    ...s,
    ownershipPct: calculateOwnership(s.sharesOwned, issued),
    fullyDilutedPct: calculateOwnership(s.sharesOwned, fullyDiluted),
    investmentValue: s.sharesOwned * s.pricePerShare,
    isEsop: s.shareClass === 'options' || s.roleType === 'employee',
  }))
}

// ────────────────────────────────────────────────────────────────
// 4. CAP TABLE SUMMARY (top panel)
// ────────────────────────────────────────────────────────────────

export function buildCapTableSummary(
  companyId: string,
  authorized: number,
  shareholders: Shareholder[],
  optionGrants: OptionGrant[] = [],
  currentValuation = 0,
): CapTableSummary {
  const views = buildShareholderViews(shareholders, optionGrants)
  const issued = totalIssuedShares(shareholders)
  const fullyDiluted = computeFullyDilutedShares(shareholders, optionGrants)
  const esopReserved = optionGrants
    .filter(g => g.status === 'active')
    .reduce((sum, g) => sum + g.numOptions, 0)
  const totalInvested = views.reduce((sum, v) => sum + v.investmentValue, 0)
  const sharesByClass: Record<string, number> = {}
  const holdersByType = {} as Record<ShareholderRole, number>
  for (const v of views) {
    if (v.status !== 'active') continue
    sharesByClass[v.shareClass] = (sharesByClass[v.shareClass] || 0) + v.sharesOwned
    holdersByType[v.roleType] = (holdersByType[v.roleType] || 0) + 1
  }
  return {
    companyId,
    totalAuthorized: authorized,
    totalIssued: issued,
    totalUnissued: Math.max(0, authorized - fullyDiluted),
    totalFullyDiluted: fullyDiluted,
    esopReserved,
    totalHolders: views.filter(v => v.status === 'active').length,
    totalInvested,
    currentValuation,
    sharesByClass,
    holdersByType,
  }
}

// ────────────────────────────────────────────────────────────────
// 5. DILUTION IMPACT — simulate adding new shares
// ────────────────────────────────────────────────────────────────

export interface DilutionImpact {
  shareholderId: string
  name: string
  sharesBefore: number
  sharesAfter: number
  pctBefore: number
  pctAfter: number
  change: number
  isNew?: boolean
}

export function calculateDilutionImpact(
  shareholders: Shareholder[],
  changes: Array<{ shareholderId?: string; name?: string; sharesDelta: number; isNew?: boolean }>,
  optionGrants: OptionGrant[] = [],
): { impacts: DilutionImpact[]; oldTotal: number; newTotal: number; pctSum: number } {
  const oldTotal = totalIssuedShares(shareholders)
  const fullyDiluted = computeFullyDilutedShares(shareholders, optionGrants)

  const newShareholders = shareholders.map(s => ({ ...s }))
  for (const c of changes) {
    if (c.shareholderId) {
      const idx = newShareholders.findIndex(s => s.id === c.shareholderId)
      if (idx >= 0) {
        newShareholders[idx] = { ...newShareholders[idx], sharesOwned: Math.max(0, newShareholders[idx].sharesOwned + c.sharesDelta) }
      }
    } else if (c.isNew && c.name) {
      newShareholders.push({
        id: '_new_' + Math.random().toString(36).slice(2, 8),
        companyId: shareholders[0]?.companyId || '',
        name: c.name,
        email: '',
        country: 'United States',
        roleType: 'employee' as ShareholderRole,
        sharesOwned: c.sharesDelta,
        shareClass: 'common' as ShareClass,
        pricePerShare: 0,
        investmentAmount: 0,
        dateIssued: new Date().toISOString().split('T')[0],
        certificateNumber: '',
        rights: { boardSeat: false, votingRights: true, proRataRights: false, antiDilution: false, liquidationPreference: 1 },
        vesting: { enabled: false, cliffMonths: 12, totalMonths: 48, type: 'monthly', acceleration: false },
        status: 'active',
        createdAt: new Date().toISOString(),
      })
    }
  }

  const newIssued = totalIssuedShares(newShareholders)
  const newFullyDiluted = computeFullyDilutedShares(newShareholders, optionGrants)
  const impacts: DilutionImpact[] = newShareholders.map(s => {
    const orig = shareholders.find(o => o.id === s.id)
    const pctBefore = orig ? calculateOwnership(orig.sharesOwned, oldTotal) : 0
    const pctAfter = calculateOwnership(s.sharesOwned, newIssued)
    return {
      shareholderId: s.id,
      name: s.name,
      sharesBefore: orig?.sharesOwned || 0,
      sharesAfter: s.sharesOwned,
      pctBefore,
      pctAfter,
      change: pctAfter - pctBefore,
      isNew: !orig,
    }
  })
  // Add impacts for removed (cancelled) holders
  for (const o of shareholders) {
    if (!newShareholders.find(s => s.id === o.id)) {
      impacts.push({
        shareholderId: o.id,
        name: o.name,
        sharesBefore: o.sharesOwned,
        sharesAfter: 0,
        pctBefore: calculateOwnership(o.sharesOwned, oldTotal),
        pctAfter: 0,
        change: -calculateOwnership(o.sharesOwned, oldTotal),
      })
    }
  }
  const pctSum = impacts.reduce((sum, i) => sum + i.pctAfter, 0)
  return { impacts, oldTotal, newTotal: newIssued, pctSum }
}

// ────────────────────────────────────────────────────────────────
// 6. DILUTION HISTORY (timeline of events)
// ────────────────────────────────────────────────────────────────

export function buildDilutionHistory(
  shareholders: Shareholder[],
  rounds: FundingRound[],
  transactions: EquityTransaction[] = [],
  transfers: ShareTransfer[] = [],
): DilutionEvent[] {
  const events: DilutionEvent[] = []
  const sortedRounds = [...rounds].sort((a, b) => new Date(a.roundDate).getTime() - new Date(b.roundDate).getTime())
  const sortedTx = [...transactions].sort((a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime())
  const sortedTransfers = [...transfers].sort((a, b) => new Date(a.transferDate).getTime() - new Date(b.transferDate).getTime())

  // 1. Founding event: every holder whose dateIssued predates the first round is "founding issuance"
  if (sortedRounds.length > 0) {
    const firstRound = sortedRounds[0]
    const founders = shareholders.filter(s => new Date(s.dateIssued) <= new Date(firstRound.roundDate))
    if (founders.length > 0) {
      const total = founders.reduce((sum, s) => sum + s.sharesOwned, 0)
      events.push({
        eventId: 'founding',
        eventName: 'Founding',
        eventType: 'founding',
        eventDate: founders[0].dateIssued,
        newSharesIssued: total,
        newTotal: total,
        changes: founders.map(s => ({
          shareholderId: s.id,
          name: s.name,
          pctBefore: 0,
          pctAfter: calculateOwnership(s.sharesOwned, total),
          change: calculateOwnership(s.sharesOwned, total),
        })),
      })
    }
  } else {
    // No rounds: treat all as founding
    const total = shareholders.reduce((sum, s) => sum + s.sharesOwned, 0)
    if (shareholders.length > 0) {
      events.push({
        eventId: 'founding',
        eventName: 'Founding',
        eventType: 'founding',
        eventDate: shareholders[0].dateIssued,
        newSharesIssued: total,
        newTotal: total,
        changes: shareholders.map(s => ({
          shareholderId: s.id,
          name: s.name,
          pctBefore: 0,
          pctAfter: calculateOwnership(s.sharesOwned, total),
          change: calculateOwnership(s.sharesOwned, total),
        })),
      })
    }
  }

  // 2. Funding rounds
  for (const r of sortedRounds) {
    const before = totalIssuedShares(shareholders.filter(s => new Date(s.dateIssued) < new Date(r.roundDate)))
    const after = before + r.newSharesIssued
    events.push({
      eventId: r.id,
      eventName: r.roundName,
      eventType: 'funding',
      eventDate: r.roundDate,
      newSharesIssued: r.newSharesIssued,
      newTotal: after,
      changes: shareholders
        .filter(s => new Date(s.dateIssued) <= new Date(r.roundDate))
        .map(s => ({
          shareholderId: s.id,
          name: s.name,
          pctBefore: calculateOwnership(s.sharesOwned, before),
          pctAfter: calculateOwnership(s.sharesOwned, after),
          change: calculateOwnership(s.sharesOwned, after) - calculateOwnership(s.sharesOwned, before),
        })),
    })
  }

  // 3. Equity transactions (issuance/transfer/cancellation/conversion) not covered by funding rounds
  for (const t of sortedTx) {
    if (t.status !== 'completed') continue
    if (t.transactionType === 'conversion' || t.transactionType === 'transfer') continue
    const before = totalIssuedShares(shareholders) - (events[events.length - 1]?.newSharesIssued || 0)
    const after = before + t.numShares
    events.push({
      eventId: t.id,
      eventName: t.notes || t.transactionType,
      eventType: t.transactionType === 'cancellation' ? 'cancellation' : t.transactionType === 'exercise' ? 'esop_topup' : 'founding',
      eventDate: t.transactionDate,
      newSharesIssued: t.numShares,
      newTotal: after,
      changes: shareholders.map(s => ({
        shareholderId: s.id,
        name: s.name,
        pctBefore: calculateOwnership(s.sharesOwned, before),
        pctAfter: calculateOwnership(s.sharesOwned, after),
        change: calculateOwnership(s.sharesOwned, after) - calculateOwnership(s.sharesOwned, before),
      })),
    })
  }

  // 4. Transfers
  for (const t of sortedTransfers) {
    events.push({
      eventId: t.id,
      eventName: 'Transfer: ' + (shareholders.find(s => s.id === t.fromShareholderId)?.name || 'Unknown') + ' → ' + (shareholders.find(s => s.id === t.toShareholderId)?.name || 'Unknown'),
      eventType: 'transfer',
      eventDate: t.transferDate,
      newSharesIssued: 0,
      newTotal: totalIssuedShares(shareholders),
      changes: [],
    })
  }

  return events.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
}

// ────────────────────────────────────────────────────────────────
// 7. CHART COLOR PALETTE (grouped by role type, as per spec)
// ────────────────────────────────────────────────────────────────

export function colorForRole(roleType: ShareholderRole, indexInType = 0): string {
  const palette: Record<ShareholderRole, string[]> = {
    founder:              ['#1E3A8A', '#2563EB', '#3B82F6'],
    co_founder:           ['#1D4ED8', '#3B82F6', '#60A5FA'],
    angel:                ['#065F46', '#059669', '#10B981'],
    vc_investor:          ['#047857', '#10B981', '#34D399'],
    employee:             ['#4C1D95', '#7C3AED', '#8B5CF6'],
    advisor:              ['#92400E', '#D97706', '#F59E0B'],
    corporate_investor:   ['#155E75', '#0891B2', '#06B6D4'],
    strategic_partner:    ['#9D174D', '#DB2777', '#EC4899'],
  }
  const arr = palette[roleType] || ['#6B7280', '#9CA3AF', '#D1D5DB']
  return arr[indexInType % arr.length]
}

export function colorForShareClass(shareClass: ShareClass): string {
  const map: Record<ShareClass, string> = {
    common:           '#6B7280',
    preferred:        '#1E3A8A',
    preferred_seed:   '#0891B2',
    preferred_a:      '#2563EB',
    preferred_b:      '#3B82F6',
    preferred_c:      '#60A5FA',
    options:          '#7C3AED',
    safe:             '#A855F7',
    convertible_note: '#10B981',
    warrant:          '#F59E0B',
  }
  return map[shareClass] || '#6B7280'
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map(p => p[0]?.toUpperCase() || '')
    .slice(0, 2)
    .join('')
}

// ────────────────────────────────────────────────────────────────
// 8. VALIDATION HELPERS
// ────────────────────────────────────────────────────────────────

export interface ValidationError { field: string; message: string }

export function validateShareholderAdd(
  input: { name?: string; email?: string; sharesOwned?: number; pricePerShare?: number; dateIssued?: string; companyId?: string },
  existing: Shareholder[],
  authorized: number,
): ValidationError[] {
  const errors: ValidationError[] = []
  if (!input.name?.trim()) errors.push({ field: 'name', message: 'Name is required' })
  if (!input.email?.trim()) errors.push({ field: 'email', message: 'Email is required' })
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) errors.push({ field: 'email', message: 'Invalid email format' })
  if (!input.sharesOwned || input.sharesOwned <= 0) errors.push({ field: 'sharesOwned', message: 'Shares must be a positive number' })
  if (input.pricePerShare === undefined || input.pricePerShare < 0) errors.push({ field: 'pricePerShare', message: 'Price per share must be a positive number' })
  if (input.dateIssued) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (new Date(input.dateIssued) > today) errors.push({ field: 'dateIssued', message: 'Issuance date cannot be in the future' })
  }
  if (input.email && existing.some(s => s.companyId === input.companyId && s.email.toLowerCase() === input.email!.toLowerCase() && s.status === 'active')) {
    errors.push({ field: 'email', message: 'This person is already a shareholder of this company' })
  }
  const issued = totalIssuedShares(existing)
  const newTotal = issued + (input.sharesOwned || 0)
  if (newTotal > authorized) {
    errors.push({ field: 'sharesOwned', message: `Not enough authorized shares. You have ${(authorized - issued).toLocaleString()} unissued shares remaining.` })
  }
  return errors
}

export function validateTransfer(
  from: Shareholder | undefined,
  to: Shareholder | undefined,
  numShares: number,
  transferDate: string,
): ValidationError[] {
  const errors: ValidationError[] = []
  if (!from) errors.push({ field: 'from', message: 'Source shareholder not found' })
  if (!to) errors.push({ field: 'to', message: 'Destination shareholder not found' })
  if (from && to && from.id === to.id) errors.push({ field: 'to', message: 'Cannot transfer to the same person' })
  if (numShares <= 0) errors.push({ field: 'numShares', message: 'Must transfer at least 1 share' })
  if (from && numShares > from.sharesOwned) errors.push({ field: 'numShares', message: `${from.name} only has ${from.sharesOwned.toLocaleString()} shares available to transfer.` })
  if (transferDate && from && new Date(transferDate) < new Date(from.dateIssued)) {
    errors.push({ field: 'transferDate', message: 'Transfer date cannot be before issuance date' })
  }
  return errors
}

// ────────────────────────────────────────────────────────────────
// 9. TRANSFER VALIDATION RESULT (full impact preview)
// ────────────────────────────────────────────────────────────────

export function previewTransfer(
  from: Shareholder,
  to: Shareholder,
  numShares: number,
  shareholders: Shareholder[],
  optionGrants: OptionGrant[] = [],
) {
  const issued = totalIssuedShares(shareholders)
  const fullyDiluted = computeFullyDilutedShares(shareholders, optionGrants)
  const newShareholders = shareholders.map(s => ({ ...s, sharesOwned: s.sharesOwned }))
  const fromIdx = newShareholders.findIndex(s => s.id === from.id)
  const toIdx = newShareholders.findIndex(s => s.id === to.id)
  if (fromIdx < 0 || toIdx < 0) return null
  newShareholders[fromIdx].sharesOwned = Math.max(0, from.sharesOwned - numShares)
  newShareholders[toIdx].sharesOwned = to.sharesOwned + numShares
  const newIssued = totalIssuedShares(newShareholders)
  return {
    fromBefore: { shares: from.sharesOwned, pct: calculateOwnership(from.sharesOwned, issued), fdPct: calculateOwnership(from.sharesOwned, fullyDiluted) },
    fromAfter:  { shares: newShareholders[fromIdx].sharesOwned, pct: calculateOwnership(newShareholders[fromIdx].sharesOwned, newIssued), fdPct: calculateOwnership(newShareholders[fromIdx].sharesOwned, fullyDiluted) },
    toBefore:   { shares: to.sharesOwned, pct: calculateOwnership(to.sharesOwned, issued), fdPct: calculateOwnership(to.sharesOwned, fullyDiluted) },
    toAfter:    { shares: newShareholders[toIdx].sharesOwned, pct: calculateOwnership(newShareholders[toIdx].sharesOwned, newIssued), fdPct: calculateOwnership(newShareholders[toIdx].sharesOwned, fullyDiluted) },
    totalBefore: issued,
    totalAfter: newIssued,
  }
}

// ────────────────────────────────────────────────────────────────
// 10. CERTIFICATE NUMBER GENERATION
// ────────────────────────────────────────────────────────────────

export function generateCertificateNumber(companyId: string, existing: Shareholder[]): string {
  const prefix = 'SC'
  const sameCompany = existing.filter(s => s.companyId === companyId)
  return `${prefix}-${(sameCompany.length + 1).toString().padStart(4, '0')}`
}
