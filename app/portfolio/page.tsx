'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/lib/store/auth'
import { db } from '@/lib/mock/db'
import { Briefcase, TrendingUp, Wallet, Building2 } from 'lucide-react'
import { StatCard } from '@/components/shared/StatCard'
import { formatCurrency, formatNumber, formatPct, formatDate } from '@/lib/utils'
import { totalIssuedShares } from '@/lib/utils/calculations'
import Link from 'next/link'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const COLORS = ['#1E3A8A', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6']

export default function PortfolioPage() {
  const { user } = useAuthStore()
  if (!user) return null
  if (user.role !== 'investor') {
    return <DashboardLayout><div className="text-center py-12 text-gray-500">Investor access only</div></DashboardLayout>
  }

  const investments = db.investments.filter(i => i.investorUserId === user.id)
  const totalDeployed = investments.reduce((s, i) => s + i.amountInvested, 0)
  const totalValue = investments.reduce((s, i) => s + (i.currentValue || i.amountInvested), 0)
  const returnPct = totalDeployed > 0 ? ((totalValue - totalDeployed) / totalDeployed) * 100 : 0
  const totalShares = investments.reduce((s, i) => s + i.sharesReceived, 0)

  const pieData = investments.map((inv, i) => {
    const company = db.companies.find(c => c.id === inv.companyId)
    return { name: company?.companyName || '', value: inv.amountInvested, color: COLORS[i % COLORS.length] }
  })

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Portfolio</h1>
          <p className="text-sm text-gray-500 mt-1">Your investment holdings across {investments.length} companies</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Companies" value={investments.length} sub="In your portfolio" icon={Building2} color="blue" />
          <StatCard label="Capital Deployed" value={formatCurrency(totalDeployed)} sub="Total invested" icon={Wallet} color="purple" />
          <StatCard label="Current Value" value={formatCurrency(totalValue)} sub={`+${formatPct(returnPct)} unrealized`} icon={TrendingUp} color="green" />
          <StatCard label="Total Shares" value={formatNumber(totalShares)} sub="All classes" icon={Briefcase} color="amber" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card">
            <h2 className="font-semibold text-gray-900 mb-4">Portfolio Detail</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <th className="py-3">Company</th>
                    <th className="py-3">Stage</th>
                    <th className="py-3 text-right">Amount</th>
                    <th className="py-3 text-right">Shares</th>
                    <th className="py-3 text-right">Value</th>
                    <th className="py-3 text-right">Return</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {investments.map(inv => {
                    const company = db.companies.find(c => c.id === inv.companyId)
                    const totalShares = totalIssuedShares(db.shareholders.filter(s => s.companyId === inv.companyId))
                    const myPct = totalShares > 0 ? (inv.sharesReceived / totalShares) * 100 : 0
                    const ret = inv.currentValue ? ((inv.currentValue - inv.amountInvested) / inv.amountInvested) * 100 : 0
                    return (
                      <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3">
                          <div className="font-medium text-gray-900">{company?.companyName}</div>
                          <div className="text-xs text-gray-500">{company?.industry} · {company?.country}</div>
                        </td>
                        <td className="py-3"><span className="badge badge-blue">{company?.fundingStage.replace('_', '-')}</span></td>
                        <td className="py-3 text-right tabular-nums">{formatCurrency(inv.amountInvested, inv.currency)}</td>
                        <td className="py-3 text-right tabular-nums">{formatNumber(inv.sharesReceived)}</td>
                        <td className="py-3 text-right tabular-nums font-medium">{formatCurrency(inv.currentValue || inv.amountInvested)}</td>
                        <td className="py-3 text-right">
                          <span className={`font-semibold ${ret >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {ret >= 0 ? '+' : ''}{formatPct(ret)}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <Link href={`/portfolio/${inv.companyId}`} className="text-brand hover:underline text-sm">View →</Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {investments.length === 0 && <div className="text-center py-12 text-gray-500">No investments yet</div>}
            </div>
          </div>
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Allocation</h2>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={2} label={(p) => `${((p.value / totalDeployed) * 100).toFixed(0)}%`} labelLine={false}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatCurrency(v as number)} />
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="text-center text-sm text-gray-500 py-12">No data</div>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
