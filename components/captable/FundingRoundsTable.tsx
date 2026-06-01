'use client'

import type { FundingRound } from '@/lib/types'
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils'

export function FundingRoundsTable({ rounds }: { rounds: FundingRound[] }) {
  const sorted = [...rounds].sort((a, b) => new Date(b.roundDate).getTime() - new Date(a.roundDate).getTime())
  if (sorted.length === 0) {
    return <div className="text-center py-8 text-gray-500 text-sm">No funding rounds recorded</div>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200">
            <th className="py-3 px-2">Round</th>
            <th className="py-3 px-2">Date</th>
            <th className="py-3 px-2">Lead Investor</th>
            <th className="py-3 px-2 text-right">Amount</th>
            <th className="py-3 px-2 text-right">Pre-Money</th>
            <th className="py-3 px-2 text-right">Post-Money</th>
            <th className="py-3 px-2 text-right">Price/Share</th>
            <th className="py-3 px-2 text-right">New Shares</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(r => (
            <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-2 font-medium text-gray-900">
                <span className="badge badge-blue">{r.roundName}</span>
              </td>
              <td className="py-3 px-2 text-gray-600 text-xs">{formatDate(r.roundDate)}</td>
              <td className="py-3 px-2 text-gray-700">{r.leadInvestor || '—'}</td>
              <td className="py-3 px-2 text-right font-semibold text-gray-900 tabular-nums">{formatCurrency(r.amountRaised, r.currency)}</td>
              <td className="py-3 px-2 text-right text-gray-600 tabular-nums">{formatCurrency(r.preMoneyValuation, r.currency)}</td>
              <td className="py-3 px-2 text-right text-gray-900 tabular-nums font-medium">{formatCurrency(r.postMoneyValuation, r.currency)}</td>
              <td className="py-3 px-2 text-right text-gray-600 tabular-nums">${r.pricePerShare.toFixed(2)}</td>
              <td className="py-3 px-2 text-right text-gray-600 tabular-nums">{formatNumber(r.newSharesIssued)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
