'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { ShareholderView, ShareholderRole } from '@/lib/types'
import { SHAREHOLDER_ROLE_META } from '@/lib/types'
import { colorForRole } from '@/lib/utils/captable'
import { formatNumber, formatPct } from '@/lib/utils'

const GROUP_LABELS: Record<string, { label: string; icon: string; bg: string }> = {
  founder: { label: 'Founders', icon: '👤', bg: 'bg-blue-50' },
  co_founder: { label: 'Co-Founders', icon: '👥', bg: 'bg-blue-50' },
  angel: { label: 'Angel Investors', icon: '💰', bg: 'bg-emerald-50' },
  vc_investor: { label: 'VC Investors', icon: '🏦', bg: 'bg-emerald-50' },
  employee: { label: 'Employees (ESOP)', icon: '👨‍💼', bg: 'bg-purple-50' },
  advisor: { label: 'Advisors', icon: '🤝', bg: 'bg-amber-50' },
  corporate_investor: { label: 'Corporate Investors', icon: '🏢', bg: 'bg-cyan-50' },
  strategic_partner: { label: 'Strategic Partners', icon: '🌐', bg: 'bg-pink-50' },
}

export function TypeBreakdownSection({ shareholders, view = 'undiluted' }: { shareholders: ShareholderView[]; view?: 'undiluted' | 'fully_diluted' }) {
  // Group by role
  const active = shareholders.filter(s => s.status === 'active')
  const totalShares = active.reduce((sum, s) => sum + s.sharesOwned, 0)
  const groups: Record<string, { count: number; shares: number; pct: number }> = {}
  for (const s of active) {
    const key = s.roleType
    if (!groups[key]) groups[key] = { count: 0, shares: 0, pct: 0 }
    groups[key].count += 1
    groups[key].shares += s.sharesOwned
  }
  for (const k of Object.keys(groups)) {
    groups[k].pct = totalShares > 0 ? (groups[k].shares / totalShares) * 100 : 0
  }

  const data = Object.entries(groups).map(([k, v], i) => {
    const roleIdx = 0
    return {
      name: GROUP_LABELS[k]?.label || k,
      icon: GROUP_LABELS[k]?.icon || '👤',
      roleType: k,
      value: v.shares,
      pct: v.pct,
      count: v.count,
      color: colorForRole(k as ShareholderRole, roleIdx),
    }
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Breakdown table */}
      <div className="card">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Ownership by Stakeholder Type</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200">
                <th className="py-2.5 pr-3">Type</th>
                <th className="py-2.5 pr-3 text-right">#</th>
                <th className="py-2.5 pr-3 text-right">Total Shares</th>
                <th className="py-2.5 text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {data.map(d => (
                <tr key={d.roleType} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded flex items-center justify-center text-sm" style={{ backgroundColor: d.color + '22' }}>{d.icon}</span>
                      <span className="font-medium text-gray-900">{d.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-3 text-right text-gray-700 tabular-nums">{d.count}</td>
                  <td className="py-2.5 pr-3 text-right text-gray-700 tabular-nums">{formatNumber(d.value)}</td>
                  <td className="py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, d.pct)}%`, backgroundColor: d.color }} />
                      </div>
                      <span className="font-semibold text-gray-900 tabular-nums w-14 text-right">{formatPct(d.pct)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-gray-300 font-semibold">
              <tr>
                <td className="py-2.5 pr-3 text-gray-900">TOTAL</td>
                <td className="py-2.5 pr-3 text-right text-gray-900 tabular-nums">{active.length}</td>
                <td className="py-2.5 pr-3 text-right text-gray-900 tabular-nums">{formatNumber(totalShares)}</td>
                <td className="py-2.5 text-right text-gray-900 tabular-nums">100.00%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Donut chart by type */}
      <div className="card">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Donut by Group</h3>
        {data.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No data</div>
        ) : (
          <div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" outerRadius={90} innerRadius={55} dataKey="value" paddingAngle={2} animationDuration={800}>
                  {data.map((d, i) => <Cell key={i} fill={d.color} stroke="white" strokeWidth={2} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                  formatter={(value: any, _: any, props: any) => [`${formatNumber(value)} (${formatPct(props.payload.pct)})`, props.payload.name]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2">
              {data.map(d => (
                <div key={d.roleType} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-gray-700 truncate flex-1">{d.name}</span>
                  <span className="font-semibold text-gray-900 tabular-nums">{formatPct(d.pct)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
