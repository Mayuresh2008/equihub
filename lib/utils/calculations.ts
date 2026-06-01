// Cap table calculation utilities
// These are the BUSINESS LOGIC RULES from the spec

import type { Shareholder, FundingRound, OptionGrant } from '../types'

// RULE: Ownership % is ALWAYS auto-calculated
// % = (shares / total issued shares) * 100
export function calculateOwnership(shares: number, totalShares: number): number {
  if (totalShares === 0) return 0
  return (shares / totalShares) * 100
}

export function totalIssuedShares(shareholders: Shareholder[]): number {
  return shareholders.reduce((sum, s) => sum + s.sharesOwned, 0)
}

export function totalUnissuedShares(authorized: number, issued: number): number {
  return Math.max(0, authorized - issued)
}

// Post-Money Valuation = Pre-Money + Amount Raised
export function postMoneyValuation(preMoney: number, amountRaised: number): number {
  return preMoney + amountRaised
}

// Price Per Share = Post-Money Val / Total Issued Shares
export function pricePerShare(postMoney: number, totalShares: number): number {
  if (totalShares === 0) return 0
  return postMoney / totalShares
}

// Calculate dilution impact per existing shareholder from a new round
export function calculateDilution(
  shareholders: Shareholder[],
  newSharesIssued: number
): Array<{ shareholderId: string; name: string; pctBefore: number; pctAfter: number; change: number }> {
  const before = totalIssuedShares(shareholders)
  const after = before + newSharesIssued
  return shareholders.map(s => {
    const pctBefore = calculateOwnership(s.sharesOwned, before)
    const pctAfter = calculateOwnership(s.sharesOwned, after)
    return {
      shareholderId: s.id,
      name: s.name,
      pctBefore,
      pctAfter,
      change: pctAfter - pctBefore,
    }
  })
}

// Build full dilution history across all funding rounds
export function buildDilutionHistory(
  shareholders: Shareholder[],
  rounds: FundingRound[]
): Array<{ roundId: string; roundName: string; roundDate: string; changes: ReturnType<typeof calculateDilution> }> {
  const sortedRounds = [...rounds].sort((a, b) => new Date(a.roundDate).getTime() - new Date(b.roundDate).getTime())
  let runningShareholders = [...shareholders]
  const history = []
  for (const round of sortedRounds) {
    // For each round, compute how each shareholder's % changed
    // (we simulate the cap table state before this round as having no new shares)
    const beforeTotal = runningShareholders.reduce((s, sh) => s + sh.sharesOwned, 0) - round.newSharesIssued
    const afterTotal = beforeTotal + round.newSharesIssued
    const changes = runningShareholders.map(s => {
      const pctBefore = beforeTotal > 0 ? (s.sharesOwned / beforeTotal) * 100 : 0
      const pctAfter = afterTotal > 0 ? (s.sharesOwned / afterTotal) * 100 : 0
      return { shareholderId: s.id, name: s.name, pctBefore, pctAfter, change: pctAfter - pctBefore }
    })
    history.push({
      roundId: round.id,
      roundName: round.roundName,
      roundDate: round.roundDate,
      changes,
    })
  }
  return history
}
