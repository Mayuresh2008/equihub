'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { formatPct, formatNumber } from '@/lib/utils'
import type { Shareholder } from '@/lib/types'

const COLORS = ['#1E3A8A', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6366F1', '#14B8A6', '#F43F5E']

export function OwnershipPieChart({ shareholders, totalShares }: { shareholders: Shareholder[]; totalShares: number }) {
  const data = shareholders.map((s, i) => ({
    name: s.name,
    value: s.sharesOwned,
    pct: totalShares > 0 ? (s.sharesOwned / totalShares) * 100 : 0,
    color: COLORS[i % COLORS.length],
  }))

  if (data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No shareholders yet</div>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={100}
          innerRadius={50}
          paddingAngle={2}
          dataKey="value"
          label={({ pct }) => `${pct.toFixed(1)}%`}
          labelLine={false}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
          formatter={(value: any, name: any, props: any) => [
            `${formatNumber(value as number)} shares (${formatPct(props.payload.pct)})`,
            props.payload.name,
          ]}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          wrapperStyle={{ fontSize: 12 }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
