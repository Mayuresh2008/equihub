'use client'

import { useState } from 'react'
import type { Shareholder } from '@/lib/types'
import { totalIssuedShares, calculateOwnership } from '@/lib/utils/calculations'
import { formatNumber, formatPct, formatDate } from '@/lib/utils'

const ROLE_COLOR: Record<string, string> = {
  founder: 'badge-blue', co_founder: 'badge-blue', angel: 'badge-purple',
  vc_investor: 'badge-green', employee: 'badge-yellow', advisor: 'badge-gray',
}
const CLASS_COLOR: Record<string, string> = {
  common: 'badge-gray', preferred: 'badge-blue', options: 'badge-yellow',
  safe: 'badge-purple', warrant: 'badge-red', convertible_note: 'badge-green',
}

export function ShareholderTable({ shareholders }: { shareholders: Shareholder[] }) {
  const [sortBy, setSortBy] = useState<'name' | 'shares' | 'pct'>('pct')
  const total = totalIssuedShares(shareholders)
  const sorted = [...shareholders].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    if (sortBy === 'shares') return b.sharesOwned - a.sharesOwned
    return calculateOwnership(b.sharesOwned, total) - calculateOwnership(a.sharesOwned, total)
  })

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200">
            <th className="py-3 px-2 cursor-pointer" onClick={() => setSortBy('name')}>Shareholder</th>
            <th className="py-3 px-2">Role</th>
            <th className="py-3 px-2">Class</th>
            <th className="py-3 px-2">Email</th>
            <th className="py-3 px-2 text-right cursor-pointer" onClick={() => setSortBy('shares')}>Shares</th>
            <th className="py-3 px-2 text-right cursor-pointer" onClick={() => setSortBy('pct')}>Ownership</th>
            <th className="py-3 px-2">Issued</th>
            <th className="py-3 px-2">Country</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(s => {
            const pct = calculateOwnership(s.sharesOwned, total)
            return (
              <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-2 font-medium text-gray-900">{s.name}</td>
                <td className="py-3 px-2">
                  <span className={`badge ${ROLE_COLOR[s.roleType] || 'badge-gray'}`}>
                    {s.roleType.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <span className={`badge ${CLASS_COLOR[s.shareClass] || 'badge-gray'}`}>
                    {s.shareClass}
                  </span>
                </td>
                <td className="py-3 px-2 text-gray-600 text-xs">{s.email}</td>
                <td className="py-3 px-2 text-right tabular-nums">{formatNumber(s.sharesOwned)}</td>
                <td className="py-3 px-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-brand" style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                    <span className="font-semibold text-gray-900 tabular-nums w-14 text-right">{formatPct(pct)}</span>
                  </div>
                </td>
                <td className="py-3 px-2 text-gray-600 text-xs">{formatDate(s.dateIssued)}</td>
                <td className="py-3 px-2 text-gray-600 text-xs">{s.country}</td>
              </tr>
            )
          })}
          <tr className="border-t-2 border-gray-300 font-semibold bg-gray-50">
            <td className="py-3 px-2" colSpan={4}>Total</td>
            <td className="py-3 px-2 text-right tabular-nums">{formatNumber(total)}</td>
            <td className="py-3 px-2 text-right tabular-nums">100.00%</td>
            <td colSpan={2}></td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
