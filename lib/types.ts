// Type definitions matching Prisma schema (for mock data)

export type Role = 'main_admin' | 'startup_admin' | 'investor'
export type FundingStage = 'pre_seed' | 'seed' | 'series_a' | 'series_b' | 'series_c' | 'ipo'
export type ShareholderRole =
  | 'founder'
  | 'co_founder'
  | 'angel'
  | 'vc_investor'
  | 'employee'
  | 'advisor'
  | 'corporate_investor'
  | 'strategic_partner'
export type ShareClass =
  | 'common'
  | 'preferred_seed'
  | 'preferred_a'
  | 'preferred_b'
  | 'preferred_c'
  | 'options'
  | 'safe'
  | 'convertible_note'
  | 'warrant'
  | 'preferred'
export type ShareholderStatus = 'active' | 'transferred' | 'cancelled' | 'pending'
export type DocumentStatus = 'draft' | 'pending_signature' | 'signed' | 'voided'
export type OptionStatus = 'active' | 'exercised' | 'cancelled' | 'expired'
export type DocumentType = 'sha' | 'safe' | 'term_sheet' | 'option_grant' | 'board_resolution' | 'employment_agreement' | 'nda' | 'other'
export type VestingType = 'monthly' | 'quarterly' | 'annual'
export type TransactionType = 'issuance' | 'transfer' | 'cancellation' | 'exercise' | 'conversion'

export interface User {
  id: string
  fullName: string
  email: string
  passwordHash: string
  role: Role
  companyId?: string
  isActive: boolean
  createdAt: string
}

export interface Company {
  id: string
  companyName: string
  registrationNumber?: string
  country: string
  foundedDate: string
  industry: string
  fundingStage: FundingStage
  totalAuthorizedShares: number
  currentValuation?: number
  createdById: string
  createdAt: string
}

export interface ShareholderRights {
  boardSeat: boolean
  votingRights: boolean
  proRataRights: boolean
  antiDilution: boolean
  liquidationPreference: number
}

export interface VestingSchedule {
  enabled: boolean
  startDate?: string
  cliffMonths: number
  totalMonths: number
  type: VestingType
  acceleration: boolean
}

export interface Shareholder {
  id: string
  companyId: string
  userId?: string
  name: string
  email: string
  phone?: string
  country: string
  avatarUrl?: string
  roleType: ShareholderRole
  sharesOwned: number
  shareClass: ShareClass
  pricePerShare: number
  investmentAmount: number
  dateIssued: string
  certificateNumber: string
  rights: ShareholderRights
  vesting: VestingSchedule
  status: ShareholderStatus
  notes?: string
  documentLinks?: {
    shareCertificate?: string
    shaAgreement?: string
    investmentAgreement?: string
  }
  createdAt: string
  updatedAt?: string
}

export interface EquityTransaction {
  id: string
  companyId: string
  fromShareholderId?: string
  toShareholderId?: string
  transactionType: TransactionType
  numShares: number
  pricePerShare?: number
  transactionDate: string
  documentId?: string
  status: 'pending' | 'completed' | 'cancelled'
  notes?: string
  pctBefore?: number
  pctAfter?: number
  reason?: string
  createdAt: string
}

export interface ShareTransfer {
  id: string
  companyId: string
  fromShareholderId: string
  toShareholderId: string
  numShares: number
  pricePerShare: number
  transferDate: string
  reason?: string
  documentId?: string
  createdById: string
  createdAt: string
}

export interface FundingRound {
  id: string
  companyId: string
  roundName: string
  amountRaised: number
  currency: string
  roundDate: string
  leadInvestor?: string
  preMoneyValuation: number
  postMoneyValuation: number
  pricePerShare: number
  newSharesIssued: number
  createdAt: string
}

export interface OptionGrant {
  id: string
  companyId: string
  employeeId: string
  numOptions: number
  exercisePrice: number
  grantDate: string
  vestingStartDate: string
  cliffMonths: number
  vestingPeriodMonths: number
  status: OptionStatus
  createdAt: string
}

export interface Investment {
  id: string
  investorUserId: string
  companyId: string
  fundingRoundId: string
  amountInvested: number
  currency: string
  sharesReceived: number
  shareClass: string
  investmentDate: string
  currentValue?: number
  createdAt: string
}

export interface Document {
  id: string
  companyId: string
  documentType: DocumentType
  documentName: string
  fileUrl?: string
  content?: string
  generatedById: string
  status: DocumentStatus
  signatories: Array<{ userId: string; name: string; email: string; signed: boolean; signedAt?: string }>
  signedAt?: string
  createdAt: string
  updatedAt: string
}

export interface AuditLog {
  id: string
  userId?: string
  action: string
  resourceType: string
  resourceId?: string
  oldValue?: any
  newValue?: any
  ipAddress?: string
  timestamp: string
}

export interface Notification {
  id: string
  userId: string
  type: string
  message: string
  isRead: boolean
  createdAt: string
}

// =============================================
// VIEW MODELS — Derived, computed at runtime
// =============================================

export interface ShareholderView extends Shareholder {
  ownershipPct: number
  fullyDilutedPct: number
  investmentValue: number
  isEsop: boolean
}

export interface DilutionEvent {
  eventId: string
  eventName: string
  eventType: 'founding' | 'funding' | 'transfer' | 'cancellation' | 'esop_topup' | 'conversion'
  eventDate: string
  changes: Array<{
    shareholderId: string
    name: string
    pctBefore: number
    pctAfter: number
    change: number
  }>
  newSharesIssued: number
  newTotal: number
}

export interface CapTableSummary {
  companyId: string
  totalAuthorized: number
  totalIssued: number
  totalUnissued: number
  totalFullyDiluted: number
  esopReserved: number
  totalHolders: number
  totalInvested: number
  currentValuation: number
  sharesByClass: Record<string, number>
  holdersByType: Record<ShareholderRole, number>
}

export const SHAREHOLDER_ROLE_META: Record<ShareholderRole, { label: string; icon: string; color: string; badge: string }> = {
  founder:              { label: 'Founder',              icon: '👤', color: '#1E3A8A', badge: 'badge-blue' },
  co_founder:           { label: 'Co-Founder',           icon: '👥', color: '#2563EB', badge: 'badge-blue' },
  angel:                { label: 'Angel Investor',       icon: '💰', color: '#059669', badge: 'badge-green' },
  vc_investor:          { label: 'VC Investor',          icon: '🏦', color: '#065F46', badge: 'badge-green' },
  employee:             { label: 'Employee',             icon: '👨‍💼', color: '#7C3AED', badge: 'badge-purple' },
  advisor:              { label: 'Advisor',              icon: '🤝', color: '#D97706', badge: 'badge-yellow' },
  corporate_investor:   { label: 'Corporate Investor',   icon: '🏢', color: '#0891B2', badge: 'badge-blue' },
  strategic_partner:    { label: 'Strategic Partner',    icon: '🌐', color: '#DB2777', badge: 'badge-purple' },
}

export const SHARE_CLASS_META: Record<ShareClass, { label: string; color: string; dot: string }> = {
  common:           { label: 'Common',                color: '#6B7280', dot: 'bg-gray-500' },
  preferred:        { label: 'Preferred',             color: '#1E3A8A', dot: 'bg-blue-700' },
  preferred_seed:   { label: 'Series Seed Preferred', color: '#0891B2', dot: 'bg-cyan-600' },
  preferred_a:      { label: 'Series A Preferred',    color: '#2563EB', dot: 'bg-blue-500' },
  preferred_b:      { label: 'Series B Preferred',    color: '#3B82F6', dot: 'bg-blue-400' },
  preferred_c:      { label: 'Series C Preferred',    color: '#60A5FA', dot: 'bg-blue-300' },
  options:          { label: 'Stock Options (ESOP)',  color: '#7C3AED', dot: 'bg-purple-500' },
  safe:             { label: 'SAFE',                  color: '#A855F7', dot: 'bg-purple-400' },
  convertible_note: { label: 'Convertible Note',      color: '#10B981', dot: 'bg-emerald-500' },
  warrant:          { label: 'Warrant',               color: '#F59E0B', dot: 'bg-amber-500' },
}

export const SHAREHOLDER_STATUS_META: Record<ShareholderStatus, { label: string; badge: string; icon: string }> = {
  active:      { label: 'Active',           badge: 'badge-green',  icon: '✅' },
  transferred: { label: 'Transferred',      badge: 'badge-blue',   icon: '🔄' },
  cancelled:   { label: 'Cancelled',        badge: 'badge-red',    icon: '❌' },
  pending:     { label: 'Pending Approval', badge: 'badge-yellow', icon: '⏳' },
}

export const COUNTRIES = [
  'United States', 'United Kingdom', 'Singapore', 'Germany', 'France', 'Canada',
  'Australia', 'India', 'China', 'Japan', 'Brazil', 'Mexico', 'Netherlands',
  'Switzerland', 'Sweden', 'Israel', 'United Arab Emirates', 'South Korea', 'Spain', 'Italy',
]
