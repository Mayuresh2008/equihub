// ESOP / Vesting calculation utilities
// Vesting is calculated daily. Options vest monthly after cliff.

import type { OptionGrant } from '../types'

const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30.4375

export function optionsVested(grant: OptionGrant, asOf: Date = new Date()): number {
  const start = new Date(grant.vestingStartDate)
  if (asOf < start) return 0

  const monthsSinceStart = (asOf.getTime() - start.getTime()) / MS_PER_MONTH

  // Still in cliff period
  if (monthsSinceStart < grant.cliffMonths) return 0

  // After full vesting period, all options vested
  if (monthsSinceStart >= grant.vestingPeriodMonths) return grant.numOptions

  // Linear monthly vesting after cliff
  // (Simplified: spread all options evenly across the vesting period)
  return Math.floor((monthsSinceStart / grant.vestingPeriodMonths) * grant.numOptions)
}

export function optionsRemaining(grant: OptionGrant, asOf: Date = new Date()): number {
  return Math.max(0, grant.numOptions - optionsVested(grant, asOf))
}

export function vestingProgress(grant: OptionGrant, asOf: Date = new Date()): number {
  if (grant.numOptions === 0) return 0
  return Math.min(100, (optionsVested(grant, asOf) / grant.numOptions) * 100)
}

export function vestingStatus(grant: OptionGrant, asOf: Date = new Date()): 'in_cliff' | 'active' | 'fully_vested' | 'exercised' | 'cancelled' | 'expired' {
  if (grant.status === 'exercised') return 'exercised'
  if (grant.status === 'cancelled') return 'cancelled'
  if (grant.status === 'expired') return 'expired'
  const monthsSinceStart = (asOf.getTime() - new Date(grant.vestingStartDate).getTime()) / MS_PER_MONTH
  if (monthsSinceStart < grant.cliffMonths) return 'in_cliff'
  if (optionsVested(grant, asOf) >= grant.numOptions) return 'fully_vested'
  return 'active'
}
