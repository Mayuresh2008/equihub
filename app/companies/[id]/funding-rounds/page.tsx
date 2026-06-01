'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/lib/store/auth'
import { db } from '@/lib/mock/db'
import { useParams } from 'next/navigation'
import { FundingRoundsTable } from '@/components/captable/FundingRoundsTable'
import { DilutionHistory } from '@/components/captable/DilutionHistory'
import Link from 'next/link'
import { StatCard } from '@/components/shared/StatCard'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { TrendingUp, Plus } from 'lucide-react'

export default function FundingRoundsPage() {
  const { user } = useAuthStore()
  const params = useParams()
  const id = params?.id as string

  if (!user) return null
  const company = db.companies.find(c => c.id === id)
  if (!company) return <DashboardLayout><div>Company not found</div></DashboardLayout>
  if (user.role === 'startup_admin' && user.companyId !== company.id) {
    return <DashboardLayout><div className="text-center py-12 text-gray-500">Access denied</div></DashboardLayout>
  }

  const rounds = db.fundingRounds.filter(r => r.companyId === company.id)
  const shareholders = db.shareholders.filter(s => s.companyId === company.id)
  const totalRaised = rounds.reduce((s, r) => s + r.amountRaised, 0)
  const totalNewShares = rounds.reduce((s, r) => s + r.newSharesIssued, 0)
  const latestRound = rounds.sort((a, b) => new Date(b.roundDate).getTime() - new Date(a.roundDate).getTime())[0]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <Link href={`/companies/${company.id}`} className="text-sm text-gray-500 hover:text-gray-700">← {company.companyName}</Link>
          <div className="flex items-center justify-between mt-1">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Funding Rounds</h1>
              <p className="text-sm text-gray-500 mt-0.5">{rounds.length} rounds · {formatCurrency(totalRaised)} total raised</p>
            </div>
            {user.role === 'startup_admin' && <button className="btn btn-primary"><Plus className="w-4 h-4" /> Add Round</button>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Total Raised" value={formatCurrency(totalRaised)} icon={TrendingUp} color="green" />
          <StatCard label="Rounds" value={rounds.length} sub="All time" color="blue" />
          <StatCard label="New Shares Issued" value={formatNumber(totalNewShares)} sub="Across all rounds" color="amber" />
          <StatCard label="Latest Round" value={latestRound?.roundName || '—'} sub={latestRound ? formatCurrency(latestRound.amountRaised) : ''} color="purple" />
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">All Funding Rounds</h2>
          <FundingRoundsTable rounds={rounds} />
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Dilution Impact per Round</h2>
          <DilutionHistory shareholders={shareholders} rounds={rounds} />
        </div>
      </div>
    </DashboardLayout>
  )
}
