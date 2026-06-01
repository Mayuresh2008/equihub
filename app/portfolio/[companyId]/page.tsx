'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/lib/store/auth'
import { db } from '@/lib/mock/db'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { StatCard } from '@/components/shared/StatCard'
import { FileText, TrendingUp, Building2, MapPin, Calendar } from 'lucide-react'
import { formatCurrency, formatNumber, formatPct, formatDate } from '@/lib/utils'
import { totalIssuedShares, buildDilutionHistory } from '@/lib/utils/calculations'
import { OwnershipPieChart } from '@/components/captable/OwnershipPieChart'

export default function HoldingsDetailPage() {
  const { user } = useAuthStore()
  const params = useParams()
  const companyId = params?.companyId as string

  if (!user) return null
  if (user.role !== 'investor') return <DashboardLayout><div className="text-center py-12 text-gray-500">Investor access only</div></DashboardLayout>

  const investment = db.investments.find(i => i.investorUserId === user.id && i.companyId === companyId)
  if (!investment) return <DashboardLayout><div className="text-center py-12 text-gray-500">No investment found</div></DashboardLayout>

  const company = db.companies.find(c => c.id === companyId)!
  const shareholders = db.shareholders.filter(s => s.companyId === companyId)
  const totalShares = totalIssuedShares(shareholders)
  const myPct = totalShares > 0 ? (investment.sharesReceived / totalShares) * 100 : 0
  const ret = investment.currentValue ? ((investment.currentValue - investment.amountInvested) / investment.amountInvested) * 100 : 0
  const rounds = db.fundingRounds.filter(r => r.companyId === companyId)
  const dilutionHistory = buildDilutionHistory(shareholders, rounds)
  const myDocs = db.documents.filter(d => d.companyId === companyId)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Link href="/portfolio" className="text-sm text-gray-500 hover:text-gray-700">← Back to Portfolio</Link>

        <div className="card">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-light to-gold rounded-xl flex items-center justify-center text-white font-bold text-2xl">
              {company.companyName[0]}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{company.companyName}</h1>
              <p className="text-sm text-gray-500 mt-1">{company.industry} · {company.country}</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-gray-600">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {company.country}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Founded {formatDate(company.foundedDate)}</span>
                <span className="badge badge-blue">{company.fundingStage.replace('_', '-')}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Current FMV</div>
              <div className="text-2xl font-bold text-emerald-600">{formatCurrency(investment.currentValue || investment.amountInvested)}</div>
              <div className={`text-sm font-semibold ${ret >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{ret >= 0 ? '+' : ''}{formatPct(ret)}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Amount Invested" value={formatCurrency(investment.amountInvested, investment.currency)} icon={TrendingUp} color="blue" />
          <StatCard label="Shares Owned" value={formatNumber(investment.sharesReceived)} sub={`${investment.shareClass} class`} color="amber" />
          <StatCard label="My Ownership" value={formatPct(myPct)} sub="of total cap table" color="green" />
          <StatCard label="Price at Investment" value={`$${(investment.amountInvested / investment.sharesReceived).toFixed(2)}`} sub={`Date: ${formatDate(investment.investmentDate)}`} color="purple" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Company Ownership</h2>
            <OwnershipPieChart shareholders={shareholders} totalShares={totalShares} />
          </div>
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">My Dilution History</h2>
            {dilutionHistory.length === 0 ? <div className="text-sm text-gray-500 text-center py-8">No rounds yet</div> : (
              <div className="space-y-3">
                {dilutionHistory.map(h => {
                  const myChange = h.changes.find(c => c.name === user.fullName) || h.changes[0]
                  return (
                    <div key={h.roundId} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-sm">{h.roundName}</div>
                        <div className="text-xs text-gray-500">{formatDate(h.roundDate)}</div>
                      </div>
                      <div className="text-xs">
                        <span className="text-gray-500">After this round: </span>
                        <span className="font-semibold text-gray-900">{formatPct(myChange.pctAfter)}</span>
                        <span className={`ml-2 ${myChange.change < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          ({myChange.change > 0 ? '+' : ''}{formatPct(myChange.change)})
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">My Documents</h2>
          {myDocs.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-8">No documents yet</div>
          ) : (
            <div className="space-y-2">
              {myDocs.map(d => (
                <Link key={d.id} href={`/documents/${d.id}`} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-brand hover:bg-blue-50/30">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{d.documentName}</div>
                      <div className="text-xs text-gray-500">{d.documentType}</div>
                    </div>
                  </div>
                  <span className={`badge ${d.status === 'signed' ? 'badge-green' : d.status === 'pending_signature' ? 'badge-yellow' : 'badge-gray'}`}>
                    {d.status.replace('_', ' ')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
