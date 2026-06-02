'use client'

import { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from 'recharts'
import type { ShareholderView, ShareholderRole } from '@/lib/types'
import { SHAREHOLDER_ROLE_META, SHARE_CLASS_META } from '@/lib/types'
import { formatNumber, formatPct, formatCurrency } from '@/lib/utils'
import { colorForRole } from '@/lib/utils/captable'

interface Props {
  shareholders: ShareholderView[]
  totalShares: number
  view?: 'undiluted' | 'fully_diluted'
  onSelect?: (s: ShareholderView | null) => void
  height?: number
}

// Custom active shape for the "click highlight" effect
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props
  return (
    <g>
      <text x={cx} y={cy - 8} textAnchor="middle" fill="#111827" className="text-sm font-semibold" style={{ fontSize: 13 }}>
        {payload.name}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#1E3A8A" className="text-2xl font-bold" style={{ fontSize: 22, fontWeight: 800 }}>
        {formatPct(percent)}
      </text>
      <text x={cx} y={cy + 28} textAnchor="middle" fill="#6B7280" style={{ fontSize: 11 }}>
        {formatNumber(payload.value)} shares
      </text>
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.95}
      />
      <Sector
        cx={cx} cy={cy}
        innerRadius={outerRadius + 12}
        outerRadius={outerRadius + 14}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  )
}

export function OwnershipPieChart({ shareholders, totalShares, view = 'undiluted', onSelect, height = 360 }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Group by role to get color
  const data = shareholders
    .filter(s => s.status === 'active' || s.status === 'transferred')
    .map((s, i) => {
      const roleIdx = shareholders.filter(x => x.roleType === s.roleType).findIndex(x => x.id === s.id)
      return {
        name: s.name,
        roleType: s.roleType,
        shareClass: s.shareClass,
        value: s.sharesOwned,
        pct: view === 'fully_diluted' ? s.fullyDilutedPct : s.ownershipPct,
        investment: s.investmentValue,
        color: colorForRole(s.roleType as ShareholderRole, roleIdx),
        full: s,
      }
    })

  const totalHolders = data.length
  const totalValue = data.reduce((sum, d) => sum + d.value, 0)
  const totalInvestment = data.reduce((sum, d) => sum + d.investment, 0)

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
        <div className="text-center">
          <div className="text-4xl mb-2">🥧</div>
          <div>No shareholders yet</div>
          <div className="text-xs mt-1">Add a shareholder to see the pie chart</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="46%"
            outerRadius={activeIndex !== null ? 110 : 100}
            innerRadius={50}
            paddingAngle={1.5}
            dataKey="value"
            animationDuration={800}
            animationBegin={0}
            activeIndex={activeIndex !== null ? activeIndex : -1}
            activeShape={renderActiveShape}
            onClick={(_, idx) => {
              setActiveIndex(activeIndex === idx ? null : idx)
              onSelect?.(activeIndex === idx ? null : data[idx].full)
            }}
            onMouseEnter={(_, idx) => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
            label={activeIndex === null ? ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
              const RAD = Math.PI / 180
              const r = innerRadius + (outerRadius - innerRadius) * 0.5
              const x = cx + r * Math.cos(-midAngle * RAD)
              const y = cy + r * Math.sin(-midAngle * RAD)
              if (percent < 0.05) return null
              return (
                <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" style={{ fontSize: 11, fontWeight: 600 }}>
                  {`${(percent * 100).toFixed(1)}%`}
                </text>
              )
            } : false}
            labelLine={false}
          >
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.color}
                stroke="white"
                strokeWidth={2}
                style={{
                  filter: hoveredIndex === i ? 'brightness(1.1)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12, padding: '10px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null
              const d: any = payload[0].payload
              return (
                <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-lg text-xs min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="font-semibold text-gray-900">{d.name}</span>
                  </div>
                  <div className="space-y-1 text-gray-600">
                    <div className="flex justify-between gap-3"><span>Shares:</span><span className="font-medium text-gray-900 tabular-nums">{formatNumber(d.value)}</span></div>
                    <div className="flex justify-between gap-3"><span>Ownership:</span><span className="font-semibold text-brand tabular-nums">{formatPct(d.pct)}</span></div>
                    <div className="flex justify-between gap-3"><span>Class:</span><span className="font-medium text-gray-900">{SHARE_CLASS_META[d.shareClass as keyof typeof SHARE_CLASS_META]?.label || d.shareClass}</span></div>
                    <div className="flex justify-between gap-3"><span>Type:</span><span className="font-medium text-gray-900">{SHAREHOLDER_ROLE_META[d.roleType as ShareholderRole]?.label}</span></div>
                    <div className="flex justify-between gap-3 border-t border-gray-100 pt-1 mt-1"><span>Investment:</span><span className="font-semibold text-gray-900">{formatCurrency(d.investment)}</span></div>
                  </div>
                </div>
              )
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Center summary (when no slice active) */}
      {activeIndex === null && (
        <div className="text-center -mt-44 pointer-events-none">
          <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">Total</div>
          <div className="text-2xl font-bold text-gray-900 tabular-nums">{formatNumber(totalValue)}</div>
          <div className="text-xs text-gray-500 mt-0.5">{totalHolders} {totalHolders === 1 ? 'holder' : 'holders'} · {formatCurrency(totalInvestment)}</div>
        </div>
      )}

      {/* Custom legend */}
      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 max-h-32 overflow-y-auto">
        {data.map((d, i) => (
          <button
            key={i}
            onClick={() => { setActiveIndex(activeIndex === i ? null : i); onSelect?.(data[i].full) }}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={`flex items-center gap-2 text-xs text-left hover:bg-gray-50 rounded px-1 py-0.5 transition-colors ${activeIndex === i ? 'bg-blue-50' : ''}`}
          >
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-gray-700 truncate flex-1">{d.name}</span>
            <span className="font-semibold text-gray-900 tabular-nums">{formatPct(d.pct)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
