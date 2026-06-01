// Type definitions matching Prisma schema (for mock data)

export type Role = 'main_admin' | 'startup_admin' | 'investor'
export type FundingStage = 'pre_seed' | 'seed' | 'series_a' | 'series_b' | 'series_c' | 'ipo'
export type ShareholderRole = 'founder' | 'co_founder' | 'angel' | 'vc_investor' | 'employee' | 'advisor'
export type ShareClass = 'common' | 'preferred' | 'options' | 'safe' | 'warrant' | 'convertible_note'
export type DocumentStatus = 'draft' | 'pending_signature' | 'signed' | 'voided'
export type OptionStatus = 'active' | 'exercised' | 'cancelled' | 'expired'
export type DocumentType = 'sha' | 'safe' | 'term_sheet' | 'option_grant' | 'board_resolution' | 'employment_agreement' | 'nda' | 'other'

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

export interface Shareholder {
  id: string
  companyId: string
  userId?: string
  name: string
  email: string
  roleType: ShareholderRole
  sharesOwned: number
  shareClass: ShareClass
  dateIssued: string
  country: string
  createdAt: string
}

export interface EquityTransaction {
  id: string
  companyId: string
  fromShareholderId?: string
  toShareholderId?: string
  transactionType: 'issuance' | 'transfer' | 'cancellation' | 'exercise' | 'conversion'
  numShares: number
  pricePerShare?: number
  transactionDate: string
  documentId?: string
  status: 'pending' | 'completed' | 'cancelled'
  notes?: string
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
  signatories: Array<{ userId: string; name: string; email: string; signed: boolean }>
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
