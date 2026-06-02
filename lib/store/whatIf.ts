// What-If simulation store (in-memory only; no persistence)
import { create } from 'zustand'
import type { ShareholderRole, ShareClass, ShareholderRights, VestingSchedule } from '../types'

export interface SimulatedShareholder {
  // In-memory only — never persisted
  id: string
  name: string
  email: string
  phone: string
  country: string
  roleType: ShareholderRole
  shareClass: ShareClass
  sharesOwned: number
  pricePerShare: number
  dateIssued: string
  investmentAmount: number
  rights: ShareholderRights
  vesting: VestingSchedule
  notes: string
  addedAt: number
}

interface WhatIfState {
  // Per-company simulation buckets
  byCompany: Record<string, SimulatedShareholder[]>
  getForCompany: (companyId: string) => SimulatedShareholder[]
  addSimulatedHolder: (companyId: string, s: SimulatedShareholder) => void
  removeSimulatedHolder: (companyId: string, id: string) => void
  resetSimulation: (companyId: string) => void
  resetAll: () => void
}

const genId = () => 'wif-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)

export const useWhatIfStore = create<WhatIfState>((set, get) => ({
  byCompany: {},
  getForCompany: (companyId) => get().byCompany[companyId] || [],
  addSimulatedHolder: (companyId, s) => set(state => {
    const withId: SimulatedShareholder = { ...s, id: s.id || genId(), addedAt: Date.now() }
    const cur = state.byCompany[companyId] || []
    return { byCompany: { ...state.byCompany, [companyId]: [...cur, withId] } }
  }),
  removeSimulatedHolder: (companyId, id) => set(state => {
    const cur = state.byCompany[companyId] || []
    return { byCompany: { ...state.byCompany, [companyId]: cur.filter(x => x.id !== id) } }
  }),
  resetSimulation: (companyId) => set(state => {
    return { byCompany: { ...state.byCompany, [companyId]: [] } }
  }),
  resetAll: () => set({ byCompany: {} }),
}))

// Build a SimulatedShareholder payload from a form-state shape (used by the modal)
export function buildSimulatedHolder(input: {
  name: string
  email: string
  phone: string
  country: string
  roleType: ShareholderRole
  shareClass: ShareClass
  sharesOwned: number
  pricePerShare: number
  dateIssued: string
  rights: ShareholderRights
  vesting: VestingSchedule
  notes: string
}): SimulatedShareholder {
  return {
    id: '',
    name: input.name,
    email: input.email,
    phone: input.phone,
    country: input.country,
    roleType: input.roleType,
    shareClass: input.shareClass,
    sharesOwned: input.sharesOwned,
    pricePerShare: input.pricePerShare,
    dateIssued: input.dateIssued,
    investmentAmount: input.sharesOwned * input.pricePerShare,
    rights: input.rights,
    vesting: input.vesting,
    notes: input.notes,
    addedAt: 0,
  }
}
