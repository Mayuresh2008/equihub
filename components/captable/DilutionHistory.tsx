'use client'

import type { Shareholder, FundingRound } from '@/lib/types'
import { buildDilutionHistory } from '@/lib/utils/calculations'
import { formatDate, formatPct } from '@/lib/utils'

export function DilutionHistory({ shareholders, rounds }: { shareholders: Shareholder[]; rounds: FundingRound[] }) {
  const history = buildDilutionHistory(shareholders, rounds)
  if (history.length === 0) {
    return <div className="text-center py-8 text-gray-500 text-sm">No dilution history available</div>
  }
  return (
    <div className="space-y-4">
      {history.map(h => (
        <div key={h.roundId} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-semibold text-gray-900">{h.roundName}</h4>
              <div className="text-xs text-gray-500 mt-0.5">{formatDate(h.roundDate)}</div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="py-2 pr-3">Shareholder</th>
                  <th className="py-2 pr-3 text-right">% Before</th>
                  <th className="py-2 pr-3 text-right">% After</th>
                  <th className="py-2 text-right">Change</th>
                </tr>
              </thead>
              <tbody>
                {h.changes.map(c => (
                  <tr key={c.shareholderId} className="border-b border-gray-50">
                    <td className="py-2 pr-3 text-gray-700">{c.name}</td>
                    <td className="py-2 pr-3 text-right text-gray-600 tabular-nums">{formatPct(c.pctBefore)}</td>
                    <td className="py-2 pr-3 text-right text-gray-900 font-medium tabular-nums">{formatPct(c.pctAfter)}</td>
                    <td className={`py-2 text-right tabular-nums font-semibold ${c.change < 0 ? 'text-red-600' : c.change > 0 ? 'text-emerald-600' : 'text-gray-500'}`}>
                      {c.change > 0 ? '+' : ''}{formatPct(c.change)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
