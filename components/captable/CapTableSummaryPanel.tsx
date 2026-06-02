'use client'

import type { CapTableSummary, Company } from '@/lib/types'
import { formatNumber, formatPct, formatCurrency, formatDate } from '@/lib/utils'
import { TrendingUp, Users, FileCheck, Coins } from 'lucide-react'

export function CapTableSummaryPanel({ summary, company }: { summary: CapTableSummary; company: Company }) {
  const issuedPct = summary.totalAuthorized > 0 ? (summary.totalIssued / summary.totalAuthorized) * 100 : 0
  const esopPct = summary.totalAuthorized > 0 ? (summary.esopReserved / summary.totalAuthorized) * 100 : 0
  const freePct = Math.max(0, 100 - issuedPct - esopPct)
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{company.companyName}</span>
            <span>•</span>
            <span className="capitalize">{company.fundingStage.replace('_', '-')}</span>
            <span>•</span>
            <span>{company.country}</span>
          </div>
          <div className="text-xs text-gray-400 mt-0.5">Founded {formatDate(company.foundedDate)}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 uppercase tracking-wider">Current Valuation</div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(summary.currentValuation)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatBox label="Authorized" value={formatNumber(summary.totalAuthorized)} sub="total" color="gray" icon={Coins} />
        <StatBox label="Issued" value={formatNumber(summary.totalIssued)} sub={`${formatPct(issuedPct)} of auth`} color="blue" icon={FileCheck} />
        <StatBox label="Unissued" value={formatNumber(summary.totalUnissued)} sub="available" color="amber" icon={Coins} />
        <StatBox label="Fully Diluted" value={formatNumber(summary.totalFullyDiluted)} sub="with options" color="purple" icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBox label="Total Invested" value={formatCurrency(summary.totalInvested)} sub="capital raised" color="green" />
        <StatBox label="ESOP Reserved" value={formatNumber(summary.esopReserved)} sub="options pool" color="purple" />
        <StatBox label="Holders" value={summary.totalHolders} sub="on cap table" color="blue" icon={Users} />
        <StatBox label="Valuation" value={formatCurrency(summary.currentValuation)} sub="post-money" color="emerald" />
      </div>

      {/* Share usage progress bar */}
      <div className="mt-5 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
          <span className="font-semibold uppercase tracking-wider">Share Allocation</span>
          <span className="text-gray-700">{formatPct(issuedPct)} issued · {formatPct(esopPct)} ESOP · {formatPct(freePct)} free</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
          <div className="bg-blue-500 transition-all" style={{ width: `${issuedPct}%` }} title={`Issued ${formatPct(issuedPct)}`} />
          <div className="bg-purple-500 transition-all" style={{ width: `${esopPct}%` }} title={`ESOP ${formatPct(esopPct)}`} />
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" />Issued {formatNumber(summary.totalIssued)}</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500" />ESOP {formatNumber(summary.esopReserved)}</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-200" />Free {formatNumber(summary.totalAuthorized - summary.totalIssued - summary.esopReserved)}</div>
        </div>
      </div>
    </div>
  )
}

function StatBox({ label, value, sub, color, icon: Icon }: { label: string; value: any; sub: string; color: string; icon?: any }) {
  const colors: Record<string, string> = {
    gray: 'bg-gray-50 text-gray-700',
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    green: 'bg-emerald-50 text-emerald-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    purple: 'bg-purple-50 text-purple-700',
  }
  return (
    <div className={`rounded-lg p-3 ${colors[color] || colors.gray}`}>
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider opacity-80 mb-1">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </div>
      <div className="text-xl font-bold tabular-nums">{value}</div>
      <div className="text-xs opacity-75 mt-0.5">{sub}</div>
    </div>
  )
}
