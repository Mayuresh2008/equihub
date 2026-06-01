// Mock data store - simulates AWS RDS PostgreSQL
// In production, this would be replaced with real Prisma queries against AWS RDS

import type {
  User, Company, Shareholder, EquityTransaction, FundingRound,
  OptionGrant, Investment, Document, AuditLog, Notification
} from '../types'

// Use a single global object so it persists across HMR
const g = globalThis as any

if (!g.__EQUIHUB_DB__) {
  g.__EQUIHUB_DB__ = createSeedData()
}

export const db = g.__EQUIHUB_DB__

function createSeedData() {
  const now = new Date().toISOString()

  // USERS
  const users: User[] = [
    { id: 'u1', fullName: 'Sarah Chen', email: 'admin@equihub.com', passwordHash: 'demo', role: 'main_admin', isActive: true, createdAt: now },
    { id: 'u2', fullName: 'Alex Patel', email: 'alex@neuralpath.io', passwordHash: 'demo', role: 'startup_admin', companyId: 'c1', isActive: true, createdAt: now },
    { id: 'u3', fullName: 'Maria Rodriguez', email: 'maria@greengrid.com', passwordHash: 'demo', role: 'startup_admin', companyId: 'c2', isActive: true, createdAt: now },
    { id: 'u4', fullName: 'James Park', email: 'james@payflow.com', passwordHash: 'demo', role: 'startup_admin', companyId: 'c3', isActive: true, createdAt: now },
    { id: 'u5', fullName: 'Lisa Wang', email: 'lisa@blockvault.com', passwordHash: 'demo', role: 'startup_admin', companyId: 'c4', isActive: true, createdAt: now },
    { id: 'u6', fullName: 'David Kim', email: 'david@accel.vc', passwordHash: 'demo', role: 'investor', isActive: true, createdAt: now },
    { id: 'u7', fullName: 'Emma Johnson', email: 'emma@sequoia.vc', passwordHash: 'demo', role: 'investor', isActive: true, createdAt: now },
    { id: 'u8', fullName: 'Raj Patel', email: 'raj@ycombinator.com', passwordHash: 'demo', role: 'investor', isActive: true, createdAt: now },
    { id: 'u9', fullName: 'Dr. Mike Johnson', email: 'mike@medisync.com', passwordHash: 'demo', role: 'startup_admin', companyId: 'c5', isActive: true, createdAt: now },
  ]

  // COMPANIES
  const companies: Company[] = [
    { id: 'c1', companyName: 'NeuralPath AI', registrationNumber: 'NP-2024-001', country: 'United States', foundedDate: '2023-01-15', industry: 'Artificial Intelligence', fundingStage: 'series_a', totalAuthorizedShares: 10000000, currentValuation: 25000000, createdById: 'u1', createdAt: now },
    { id: 'c2', companyName: 'GreenGrid Energy', registrationNumber: 'GG-2023-042', country: 'Germany', foundedDate: '2022-06-20', industry: 'CleanTech', fundingStage: 'seed', totalAuthorizedShares: 8000000, currentValuation: 12000000, createdById: 'u1', createdAt: now },
    { id: 'c3', companyName: 'PayFlow Inc', registrationNumber: 'PF-2022-118', country: 'United States', foundedDate: '2021-03-10', industry: 'FinTech', fundingStage: 'series_b', totalAuthorizedShares: 12000000, currentValuation: 80000000, createdById: 'u1', createdAt: now },
    { id: 'c4', companyName: 'BlockVault', registrationNumber: 'BV-2024-007', country: 'Singapore', foundedDate: '2023-09-01', industry: 'Cybersecurity', fundingStage: 'pre_seed', totalAuthorizedShares: 6000000, currentValuation: 4000000, createdById: 'u1', createdAt: now },
    { id: 'c5', companyName: 'MediSync Labs', registrationNumber: 'MS-2022-091', country: 'United Kingdom', foundedDate: '2021-11-05', industry: 'HealthTech', fundingStage: 'series_a', totalAuthorizedShares: 9000000, currentValuation: 32000000, createdById: 'u1', createdAt: now },
  ]

  // SHAREHOLDERS
  const shareholders: Shareholder[] = [
    // NeuralPath AI
    { id: 's1', companyId: 'c1', name: 'Alex Patel', email: 'alex@neuralpath.io', roleType: 'founder', sharesOwned: 3500000, shareClass: 'common', dateIssued: '2023-01-15', country: 'United States', createdAt: now },
    { id: 's2', companyId: 'c1', name: 'Priya Singh', email: 'priya@neuralpath.io', roleType: 'co_founder', sharesOwned: 2000000, shareClass: 'common', dateIssued: '2023-01-15', country: 'United States', createdAt: now },
    { id: 's3', companyId: 'c1', name: 'Accel Ventures', email: 'deals@accel.vc', roleType: 'vc_investor', sharesOwned: 1500000, shareClass: 'preferred', dateIssued: '2024-03-20', country: 'United States', createdAt: now },
    { id: 's4', companyId: 'c1', name: 'ESOP Pool', email: 'esop@neuralpath.io', roleType: 'employee', sharesOwned: 1000000, shareClass: 'options', dateIssued: '2023-01-15', country: 'United States', createdAt: now },
    { id: 's5', companyId: 'c1', name: 'John Angel', email: 'john@angel.com', roleType: 'angel', sharesOwned: 200000, shareClass: 'safe', dateIssued: '2023-06-10', country: 'United States', createdAt: now },
    // GreenGrid
    { id: 's6', companyId: 'c2', name: 'Maria Rodriguez', email: 'maria@greengrid.com', roleType: 'founder', sharesOwned: 3000000, shareClass: 'common', dateIssued: '2022-06-20', country: 'Germany', createdAt: now },
    { id: 's7', companyId: 'c2', name: 'Klaus Mueller', email: 'klaus@greengrid.com', roleType: 'co_founder', sharesOwned: 1500000, shareClass: 'common', dateIssued: '2022-06-20', country: 'Germany', createdAt: now },
    { id: 's8', companyId: 'c2', name: 'Climate Capital', email: 'invest@climate.vc', roleType: 'vc_investor', sharesOwned: 800000, shareClass: 'preferred', dateIssued: '2023-09-15', country: 'United Kingdom', createdAt: now },
    { id: 's9', companyId: 'c2', name: 'ESOP Pool', email: 'esop@greengrid.com', roleType: 'employee', sharesOwned: 500000, shareClass: 'options', dateIssued: '2022-06-20', country: 'Germany', createdAt: now },
    // PayFlow
    { id: 's10', companyId: 'c3', name: 'James Park', email: 'james@payflow.com', roleType: 'founder', sharesOwned: 2500000, shareClass: 'common', dateIssued: '2021-03-10', country: 'United States', createdAt: now },
    { id: 's11', companyId: 'c3', name: 'Aisha Khan', email: 'aisha@payflow.com', roleType: 'co_founder', sharesOwned: 1500000, shareClass: 'common', dateIssued: '2021-03-10', country: 'United States', createdAt: now },
    { id: 's12', companyId: 'c3', name: 'Sequoia Capital', email: 'deals@sequoia.vc', roleType: 'vc_investor', sharesOwned: 2000000, shareClass: 'preferred', dateIssued: '2022-08-12', country: 'United States', createdAt: now },
    { id: 's13', companyId: 'c3', name: 'Andreessen Horowitz', email: 'deals@a16z.com', roleType: 'vc_investor', sharesOwned: 1500000, shareClass: 'preferred', dateIssued: '2024-02-20', country: 'United States', createdAt: now },
    { id: 's14', companyId: 'c3', name: 'ESOP Pool', email: 'esop@payflow.com', roleType: 'employee', sharesOwned: 1800000, shareClass: 'options', dateIssued: '2021-03-10', country: 'United States', createdAt: now },
    // BlockVault
    { id: 's15', companyId: 'c4', name: 'Lisa Wang', email: 'lisa@blockvault.com', roleType: 'founder', sharesOwned: 4000000, shareClass: 'common', dateIssued: '2023-09-01', country: 'Singapore', createdAt: now },
    { id: 's16', companyId: 'c4', name: 'ESOP Pool', email: 'esop@blockvault.com', roleType: 'employee', sharesOwned: 800000, shareClass: 'options', dateIssued: '2023-09-01', country: 'Singapore', createdAt: now },
    { id: 's17', companyId: 'c4', name: 'Cyber Angels', email: 'invest@cyberangels.vc', roleType: 'angel', sharesOwned: 300000, shareClass: 'safe', dateIssued: '2024-01-15', country: 'United States', createdAt: now },
    // MediSync
    { id: 's18', companyId: 'c5', name: 'Dr. Mike Johnson', email: 'mike@medisync.com', roleType: 'founder', sharesOwned: 2800000, shareClass: 'common', dateIssued: '2021-11-05', country: 'United Kingdom', createdAt: now },
    { id: 's19', companyId: 'c5', name: 'Dr. Sarah Lee', email: 'sarah@medisync.com', roleType: 'co_founder', sharesOwned: 1600000, shareClass: 'common', dateIssued: '2021-11-05', country: 'United Kingdom', createdAt: now },
    { id: 's20', companyId: 'c5', name: 'Y Combinator', email: 'deals@ycombinator.com', roleType: 'vc_investor', sharesOwned: 1200000, shareClass: 'preferred', dateIssued: '2022-04-10', country: 'United States', createdAt: now },
    { id: 's21', companyId: 'c5', name: 'Index Ventures', email: 'deals@index.vc', roleType: 'vc_investor', sharesOwned: 800000, shareClass: 'preferred', dateIssued: '2024-01-25', country: 'United Kingdom', createdAt: now },
    { id: 's22', companyId: 'c5', name: 'ESOP Pool', email: 'esop@medisync.com', roleType: 'employee', sharesOwned: 900000, shareClass: 'options', dateIssued: '2021-11-05', country: 'United Kingdom', createdAt: now },
  ]

  // EQUITY TRANSACTIONS (immutable ledger)
  const equityTransactions: EquityTransaction[] = [
    { id: 't1', companyId: 'c1', toShareholderId: 's1', transactionType: 'issuance', numShares: 3500000, pricePerShare: 0.001, transactionDate: '2023-01-15', status: 'completed', createdAt: now, notes: 'Founder share issuance' },
    { id: 't2', companyId: 'c1', toShareholderId: 's2', transactionType: 'issuance', numShares: 2000000, pricePerShare: 0.001, transactionDate: '2023-01-15', status: 'completed', createdAt: now, notes: 'Co-founder share issuance' },
    { id: 't3', companyId: 'c1', toShareholderId: 's4', transactionType: 'issuance', numShares: 1000000, pricePerShare: 0.001, transactionDate: '2023-01-15', status: 'completed', createdAt: now, notes: 'ESOP pool created' },
    { id: 't4', companyId: 'c1', toShareholderId: 's5', transactionType: 'conversion', numShares: 200000, pricePerShare: 2.50, transactionDate: '2023-06-10', status: 'completed', createdAt: now, notes: 'SAFE conversion' },
    { id: 't5', companyId: 'c1', toShareholderId: 's3', transactionType: 'issuance', numShares: 1500000, pricePerShare: 3.33, transactionDate: '2024-03-20', status: 'completed', createdAt: now, notes: 'Series A investment' },
    { id: 't6', companyId: 'c3', toShareholderId: 's12', transactionType: 'issuance', numShares: 2000000, pricePerShare: 5.00, transactionDate: '2022-08-12', status: 'completed', createdAt: now, notes: 'Series A investment' },
    { id: 't7', companyId: 'c3', toShareholderId: 's13', transactionType: 'issuance', numShares: 1500000, pricePerShare: 8.00, transactionDate: '2024-02-20', status: 'completed', createdAt: now, notes: 'Series B investment' },
  ]

  // FUNDING ROUNDS
  const fundingRounds: FundingRound[] = [
    { id: 'fr1', companyId: 'c1', roundName: 'Pre-Seed', amountRaised: 500000, currency: 'USD', roundDate: '2023-06-10', leadInvestor: 'John Angel', preMoneyValuation: 4000000, postMoneyValuation: 4500000, pricePerShare: 0.50, newSharesIssued: 1000000, createdAt: now },
    { id: 'fr2', companyId: 'c1', roundName: 'Series A', amountRaised: 5000000, currency: 'USD', roundDate: '2024-03-20', leadInvestor: 'Accel Ventures', preMoneyValuation: 20000000, postMoneyValuation: 25000000, pricePerShare: 3.33, newSharesIssued: 1500000, createdAt: now },
    { id: 'fr3', companyId: 'c2', roundName: 'Seed', amountRaised: 2500000, currency: 'USD', roundDate: '2023-09-15', leadInvestor: 'Climate Capital', preMoneyValuation: 9500000, postMoneyValuation: 12000000, pricePerShare: 1.50, newSharesIssued: 800000, createdAt: now },
    { id: 'fr4', companyId: 'c3', roundName: 'Series A', amountRaised: 10000000, currency: 'USD', roundDate: '2022-08-12', leadInvestor: 'Sequoia Capital', preMoneyValuation: 30000000, postMoneyValuation: 40000000, pricePerShare: 5.00, newSharesIssued: 2000000, createdAt: now },
    { id: 'fr5', companyId: 'c3', roundName: 'Series B', amountRaised: 40000000, currency: 'USD', roundDate: '2024-02-20', leadInvestor: 'Andreessen Horowitz', preMoneyValuation: 40000000, postMoneyValuation: 80000000, pricePerShare: 8.00, newSharesIssued: 1500000, createdAt: now },
    { id: 'fr6', companyId: 'c4', roundName: 'Pre-Seed', amountRaised: 800000, currency: 'USD', roundDate: '2024-01-15', leadInvestor: 'Cyber Angels', preMoneyValuation: 3200000, postMoneyValuation: 4000000, pricePerShare: 0.40, newSharesIssued: 300000, createdAt: now },
    { id: 'fr7', companyId: 'c5', roundName: 'Seed', amountRaised: 3000000, currency: 'USD', roundDate: '2022-04-10', leadInvestor: 'Y Combinator', preMoneyValuation: 12000000, postMoneyValuation: 15000000, pricePerShare: 2.00, newSharesIssued: 1200000, createdAt: now },
    { id: 'fr8', companyId: 'c5', roundName: 'Series A', amountRaised: 17000000, currency: 'USD', roundDate: '2024-01-25', leadInvestor: 'Index Ventures', preMoneyValuation: 15000000, postMoneyValuation: 32000000, pricePerShare: 4.00, newSharesIssued: 800000, createdAt: now },
  ]

  // OPTION GRANTS (ESOP)
  const optionGrants: OptionGrant[] = [
    { id: 'og1', companyId: 'c1', employeeId: 's1', numOptions: 50000, exercisePrice: 1.00, grantDate: '2024-01-15', vestingStartDate: '2024-01-15', cliffMonths: 12, vestingPeriodMonths: 48, status: 'active', createdAt: now },
    { id: 'og2', companyId: 'c1', employeeId: 's2', numOptions: 40000, exercisePrice: 1.00, grantDate: '2024-01-15', vestingStartDate: '2024-01-15', cliffMonths: 12, vestingPeriodMonths: 48, status: 'active', createdAt: now },
    { id: 'og3', companyId: 'c2', employeeId: 's7', numOptions: 30000, exercisePrice: 0.75, grantDate: '2023-03-01', vestingStartDate: '2023-03-01', cliffMonths: 12, vestingPeriodMonths: 48, status: 'active', createdAt: now },
    { id: 'og4', companyId: 'c3', employeeId: 's10', numOptions: 80000, exercisePrice: 3.00, grantDate: '2023-06-01', vestingStartDate: '2023-06-01', cliffMonths: 12, vestingPeriodMonths: 48, status: 'active', createdAt: now },
    { id: 'og5', companyId: 'c3', employeeId: 's11', numOptions: 60000, exercisePrice: 3.00, grantDate: '2023-06-01', vestingStartDate: '2023-06-01', cliffMonths: 12, vestingPeriodMonths: 48, status: 'active', createdAt: now },
    { id: 'og6', companyId: 'c5', employeeId: 's18', numOptions: 70000, exercisePrice: 1.50, grantDate: '2022-09-01', vestingStartDate: '2022-09-01', cliffMonths: 12, vestingPeriodMonths: 48, status: 'active', createdAt: now },
    { id: 'og7', companyId: 'c5', employeeId: 's19', numOptions: 50000, exercisePrice: 1.50, grantDate: '2022-09-01', vestingStartDate: '2022-09-01', cliffMonths: 12, vestingPeriodMonths: 48, status: 'active', createdAt: now },
  ]

  // INVESTMENTS
  const investments: Investment[] = [
    { id: 'i1', investorUserId: 'u6', companyId: 'c1', fundingRoundId: 'fr2', amountInvested: 5000000, currency: 'USD', sharesReceived: 1500000, shareClass: 'preferred', investmentDate: '2024-03-20', currentValue: 6250000, createdAt: now },
    { id: 'i2', investorUserId: 'u7', companyId: 'c3', fundingRoundId: 'fr4', amountInvested: 10000000, currency: 'USD', sharesReceived: 2000000, shareClass: 'preferred', investmentDate: '2022-08-12', currentValue: 26000000, createdAt: now },
    { id: 'i3', investorUserId: 'u7', companyId: 'c3', fundingRoundId: 'fr5', amountInvested: 25000000, currency: 'USD', sharesReceived: 937500, shareClass: 'preferred', investmentDate: '2024-02-20', currentValue: 30000000, createdAt: now },
    { id: 'i4', investorUserId: 'u8', companyId: 'c5', fundingRoundId: 'fr7', amountInvested: 3000000, currency: 'USD', sharesReceived: 1200000, shareClass: 'preferred', investmentDate: '2022-04-10', currentValue: 6000000, createdAt: now },
    { id: 'i5', investorUserId: 'u8', companyId: 'c5', fundingRoundId: 'fr8', amountInvested: 10000000, currency: 'USD', sharesReceived: 500000, shareClass: 'preferred', investmentDate: '2024-01-25', currentValue: 12000000, createdAt: now },
    { id: 'i6', investorUserId: 'u6', companyId: 'c2', fundingRoundId: 'fr3', amountInvested: 2500000, currency: 'USD', sharesReceived: 800000, shareClass: 'preferred', investmentDate: '2023-09-15', currentValue: 3000000, createdAt: now },
  ]

  // DOCUMENTS
  const documents: Document[] = [
    { id: 'd1', companyId: 'c1', documentType: 'sha', documentName: 'NeuralPath SHA - Accel Ventures', fileUrl: '/docs/d1.pdf', generatedById: 'u1', status: 'pending_signature', signatories: [{ userId: 'u2', name: 'Alex Patel', email: 'alex@neuralpath.io', signed: false }, { userId: 'u6', name: 'David Kim', email: 'david@accel.vc', signed: false }], createdAt: now, updatedAt: now, content: 'This Shareholder Agreement is entered into on March 20, 2024, between NeuralPath AI ("Company") and Accel Ventures ("Investor"). The Investor agrees to purchase 1,500,000 shares of Series A Preferred Stock at $3.33 per share for a total consideration of $5,000,000.' },
    { id: 'd2', companyId: 'c1', documentType: 'safe', documentName: 'NeuralPath SAFE - John Angel', generatedById: 'u1', status: 'signed', signatories: [{ userId: 'u2', name: 'Alex Patel', email: 'alex@neuralpath.io', signed: true }, { userId: 's5', name: 'John Angel', email: 'john@angel.com', signed: true }], signedAt: '2023-06-10T00:00:00Z', createdAt: now, updatedAt: now, content: 'SAFE Agreement between NeuralPath AI and John Angel for $500,000 investment.' },
    { id: 'd3', companyId: 'c2', documentType: 'term_sheet', documentName: 'GreenGrid Seed Term Sheet', generatedById: 'u1', status: 'draft', signatories: [], createdAt: now, updatedAt: now, content: 'Term sheet for GreenGrid Energy seed round led by Climate Capital.' },
    { id: 'd4', companyId: 'c3', documentType: 'sha', documentName: 'PayFlow Series B - a16z', fileUrl: '/docs/d4.pdf', generatedById: 'u1', status: 'pending_signature', signatories: [{ userId: 'u4', name: 'James Park', email: 'james@payflow.com', signed: true }, { userId: 's13', name: 'Marc Andreessen', email: 'marc@a16z.com', signed: false }], createdAt: now, updatedAt: now, content: 'Series B Investment Agreement between PayFlow Inc and Andreessen Horowitz for $40,000,000 total round.' },
    { id: 'd5', companyId: 'c5', documentType: 'option_grant', documentName: 'MediSync Option Grant - Dr. Lee', generatedById: 'u1', status: 'signed', signatories: [{ userId: 'u9', name: 'Dr. Mike Johnson', email: 'mike@medisync.com', signed: true }, { userId: 's19', name: 'Dr. Sarah Lee', email: 'sarah@medisync.com', signed: true }], signedAt: '2022-09-01T00:00:00Z', createdAt: now, updatedAt: now, content: 'Option grant letter for Dr. Sarah Lee: 50,000 options at $1.50 exercise price, 4-year vesting with 1-year cliff.' },
  ]

  // AUDIT LOGS
  const auditLogs: AuditLog[] = [
    { id: 'al1', userId: 'u1', action: 'company.created', resourceType: 'Company', resourceId: 'c1', newValue: { name: 'NeuralPath AI' }, timestamp: now },
    { id: 'al2', userId: 'u6', action: 'investment.recorded', resourceType: 'Investment', resourceId: 'i1', newValue: { amount: 5000000, company: 'NeuralPath AI' }, timestamp: now },
    { id: 'al3', userId: 'u1', action: 'document.generated', resourceType: 'Document', resourceId: 'd1', newValue: { type: 'SHA', company: 'NeuralPath AI' }, timestamp: now },
    { id: 'al4', userId: 'u2', action: 'captable.viewed', resourceType: 'Company', resourceId: 'c1', timestamp: now },
    { id: 'al5', userId: 'u1', action: 'user.created', resourceType: 'User', resourceId: 'u2', newValue: { email: 'alex@neuralpath.io', role: 'startup_admin' }, timestamp: now },
    { id: 'al6', userId: 'u1', action: 'ai.document.generated', resourceType: 'Document', resourceId: 'd3', newValue: { type: 'Term Sheet', model: 'claude-3-sonnet' }, timestamp: now },
    { id: 'al7', userId: 'u7', action: 'portfolio.viewed', resourceType: 'Company', resourceId: 'c3', timestamp: now },
    { id: 'al8', userId: 'u1', action: 'document.signed', resourceType: 'Document', resourceId: 'd5', timestamp: now },
  ]

  // NOTIFICATIONS
  const notifications: Notification[] = [
    { id: 'n1', userId: 'u2', type: 'document.pending_signature', message: 'Shareholder Agreement from Accel Ventures is awaiting your signature', isRead: false, createdAt: now },
    { id: 'n2', userId: 'u6', type: 'document.pending_signature', message: 'NeuralPath SHA is awaiting your signature', isRead: false, createdAt: now },
    { id: 'n3', userId: 'u4', type: 'document.signed', message: 'PayFlow Series B Investment Agreement has been signed by all parties', isRead: true, createdAt: now },
    { id: 'n4', userId: 'u7', type: 'funding.round.completed', message: 'PayFlow Inc has completed a Series B round of $40,000,000', isRead: false, createdAt: now },
    { id: 'n5', userId: 'u8', type: 'options.vested', message: 'Your MediSync Labs options have new vesting milestones', isRead: false, createdAt: now },
    { id: 'n6', userId: 'u2', type: 'captable.updated', message: 'NeuralPath AI cap table has been updated', isRead: true, createdAt: now },
  ]

  return {
    users, companies, shareholders, equityTransactions, fundingRounds,
    optionGrants, investments, documents, auditLogs, notifications
  }
}
