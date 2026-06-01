'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/lib/store/auth'
import { db } from '@/lib/mock/db'
import { StatCard } from '@/components/shared/StatCard'
import { Building2, Users, FileText, TrendingUp, Briefcase, Wallet, PieChart, AlertCircle, Brain, Activity } from 'lucide-react'
import { formatCurrency, formatNumber, formatPct, timeAgo } from '@/lib/utils'
import { totalIssuedShares, calculateOwnership } from '@/lib/utils/calculations'
import { optionsVested } from '@/lib/utils/vesting'
import Link from 'next/link'

function MainAdminDashboard() {
  const totalCompanies = db.companies.length
  const totalShareholders = db.shareholders.length
  const totalValuation = db.companies.reduce((s, c) => s + (c.currentValuation || 0), 0)
  const totalRounds = db.fundingRounds.length
  const totalRaised = db.fundingRounds.reduce((s, r) => s + r.amountRaised, 0)
  const pendingDocs = db.documents.filter(d => d.status === 'pending_signature').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Main Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Full platform overview — all companies, users, and activity</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Companies" value={totalCompanies} sub={`${db.companies.filter(c => c.fundingStage === 'series_a' || c.fundingStage === 'series_b').length} funded`} icon={Building2} color="blue" />
        <StatCard label="Total Valuation" value={formatCurrency(totalValuation)} sub="Across all companies" icon={TrendingUp} color="green" />
        <StatCard label="Total Raised" value={formatCurrency(totalRaised)} sub={`${totalRounds} rounds`} icon={Wallet} color="amber" />
        <StatCard label="Pending Signatures" value={pendingDocs} sub="Documents awaiting" icon={FileText} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">All Companies</h2>
            <Link href="/companies" className="text-sm text-brand hover:underline">View all →</Link>
          </div>
          <div className="space-y-2">
            {db.companies.map(c => {
              const shareholders = db.shareholders.filter(s => s.companyId === c.id)
              const total = totalIssuedShares(shareholders)
              return (
                <Link
                  key={c.id}
                  href={`/companies/${c.id}`}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-brand hover:bg-blue-50/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-brand-light to-gold rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {c.companyName[0]}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{c.companyName}</div>
                      <div className="text-xs text-gray-500">{c.industry} · {c.country}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900 text-sm">{formatCurrency(c.currentValuation || 0)}</div>
                    <div className="text-xs text-gray-500">{shareholders.length} shareholders · {formatNumber(total)} shares</div>
                  </div>
                  <span className="badge badge-blue ml-3">{c.fundingStage.replace('_', '-')}</span>
                </Link>
              )
            })}
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {db.auditLogs.slice(0, 12).map(log => {
              const u = db.users.find(user => user.id === log.userId)
              return (
                <div key={log.id} className="text-sm">
                  <div className="text-gray-900">
                    <span className="font-medium">{u?.fullName || 'System'}</span>
                    <span className="text-gray-500"> · {log.action}</span>
                  </div>
                  <div className="text-xs text-gray-400">{timeAgo(log.timestamp)}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function StartupAdminDashboard() {
  const { user } = useAuthStore()
  if (!user?.companyId) return null
  const company = db.companies.find(c => c.id === user.companyId)!
  const shareholders = db.shareholders.filter(s => s.companyId === company.id)
  const rounds = db.fundingRounds.filter(r => r.companyId === company.id)
  const grants = db.optionGrants.filter(g => g.companyId === company.id)
  const docs = db.documents.filter(d => d.companyId === company.id)
  const total = totalIssuedShares(shareholders)
  const totalVested = grants.reduce((s, g) => s + optionsVested(g), 0)
  const totalOptions = grants.reduce((s, g) => s + g.numOptions, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{company.companyName}</h1>
        <p className="text-sm text-gray-500 mt-1">{company.industry} · {company.country} · {company.fundingStage.replace('_', '-')}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Issued Shares" value={formatNumber(total)} sub={`of ${formatNumber(company.totalAuthorizedShares)} authorized`} icon={PieChart} color="blue" />
        <StatCard label="Valuation" value={formatCurrency(company.currentValuation || 0)} sub="Current" icon={TrendingUp} color="green" />
        <StatCard label="ESOP Vested" value={formatNumber(totalVested)} sub={`of ${formatNumber(totalOptions)} granted`} icon={Users} color="amber" />
        <StatCard label="Documents" value={docs.length} sub={`${docs.filter(d => d.status === 'pending_signature').length} pending`} icon={FileText} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Top Shareholders</h2>
          <div className="space-y-2">
            {[...shareholders].sort((a, b) => b.sharesOwned - a.sharesOwned).slice(0, 5).map(s => {
              const pct = calculateOwnership(s.sharesOwned, total)
              return (
                <div key={s.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{s.name}</span>
                      <span className="text-sm font-semibold text-gray-700">{formatPct(pct)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand" style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Funding Rounds</h2>
          <div className="space-y-2">
            {rounds.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4">No funding rounds yet</div>
            ) : (
              rounds.map(r => (
                <div key={r.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div>
                    <div className="font-medium text-sm">{r.roundName}</div>
                    <div className="text-xs text-gray-500">{r.leadInvestor}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm">{formatCurrency(r.amountRaised, r.currency)}</div>
                    <div className="text-xs text-gray-500">@ ${r.pricePerShare.toFixed(2)}/share</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function InvestorDashboard() {
  const { user } = useAuthStore()
  if (!user) return null
  const myInvestments = db.investments.filter(i => i.investorUserId === user.id)
  const totalDeployed = myInvestments.reduce((s, i) => s + i.amountInvested, 0)
  const totalValue = myInvestments.reduce((s, i) => s + (i.currentValue || i.amountInvested), 0)
  const returnPct = totalDeployed > 0 ? ((totalValue - totalDeployed) / totalDeployed) * 100 : 0
  const totalShares = myInvestments.reduce((s, i) => s + i.sharesReceived, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user.fullName.split(' ')[0]}</h1>
        <p className="text-sm text-gray-500 mt-1">Your investment portfolio overview</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Companies" value={myInvestments.length} sub="In your portfolio" icon={Building2} color="blue" />
        <StatCard label="Capital Deployed" value={formatCurrency(totalDeployed)} sub="Total invested" icon={Wallet} color="purple" />
        <StatCard label="Current Value" value={formatCurrency(totalValue)} sub={`+${formatPct(returnPct)} return`} icon={TrendingUp} color="green" />
        <StatCard label="Total Shares" value={formatNumber(totalShares)} sub="Across portfolio" icon={Briefcase} color="amber" />
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">My Portfolio</h2>
          <Link href="/portfolio" className="text-sm text-brand hover:underline">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200">
                <th className="py-2">Company</th>
                <th className="py-2">Stage</th>
                <th className="py-2 text-right">Invested</th>
                <th className="py-2 text-right">Shares</th>
                <th className="py-2 text-right">Current Value</th>
                <th className="py-2 text-right">Return</th>
              </tr>
            </thead>
            <tbody>
              {myInvestments.map(inv => {
                const company = db.companies.find(c => c.id === inv.companyId)
                const shareholders = db.shareholders.filter(s => s.companyId === inv.companyId)
                const totalShares = totalIssuedShares(shareholders)
                const myPct = totalShares > 0 ? (inv.sharesReceived / totalShares) * 100 : 0
                const ret = inv.currentValue ? ((inv.currentValue - inv.amountInvested) / inv.amountInvested) * 100 : 0
                return (
                  <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3">
                      <Link href={`/portfolio/${inv.companyId}`} className="font-medium text-gray-900 hover:text-brand">{company?.companyName}</Link>
                      <div className="text-xs text-gray-500">{company?.industry}</div>
                    </td>
                    <td className="py-3"><span className="badge badge-blue">{company?.fundingStage.replace('_', '-')}</span></td>
                    <td className="py-3 text-right tabular-nums">{formatCurrency(inv.amountInvested, inv.currency)}</td>
                    <td className="py-3 text-right tabular-nums">{formatNumber(inv.sharesReceived)}</td>
                    <td className="py-3 text-right tabular-nums font-medium">{formatCurrency(inv.currentValue || inv.amountInvested, inv.currency)}</td>
                    <td className="py-3 text-right">
                      <span className={`font-semibold ${ret >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {ret >= 0 ? '+' : ''}{formatPct(ret)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  if (!user) return null
  return (
    <DashboardLayout>
      {user.role === 'main_admin' && <MainAdminDashboard />}
      {user.role === 'startup_admin' && <StartupAdminDashboard />}
      {user.role === 'investor' && <InvestorDashboard />}
    </DashboardLayout>
  )
}
