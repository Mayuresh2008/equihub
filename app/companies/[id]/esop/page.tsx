'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/lib/store/auth'
import { db } from '@/lib/mock/db'
import { useParams } from 'next/navigation'
import { ESOPTracker } from '@/components/captable/ESOPTracker'
import { StatCard } from '@/components/shared/StatCard'
import { Plus, Users } from 'lucide-react'
import Link from 'next/link'
import { optionsVested, optionsRemaining } from '@/lib/utils/vesting'
import { formatNumber } from '@/lib/utils'

export default function ESOPPage() {
  const { user } = useAuthStore()
  const params = useParams()
  const id = params?.id as string

  if (!user) return null
  const company = db.companies.find(c => c.id === id)
  if (!company) return <DashboardLayout><div>Company not found</div></DashboardLayout>
  if (user.role === 'startup_admin' && user.companyId !== company.id) {
    return <DashboardLayout><div className="text-center py-12 text-gray-500">Access denied</div></DashboardLayout>
  }

  const grants = db.optionGrants.filter(g => g.companyId === company.id)
  const shareholders = db.shareholders.filter(s => s.companyId === company.id)
  const totalGranted = grants.reduce((s, g) => s + g.numOptions, 0)
  const totalVested = grants.reduce((s, g) => s + optionsVested(g), 0)
  const totalRemaining = grants.reduce((s, g) => s + optionsRemaining(g), 0)
  const activeGrants = grants.filter(g => g.status === 'active').length

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href={`/companies/${company.id}`} className="text-sm text-gray-500 hover:text-gray-700">← {company.companyName}</Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">ESOP Tracker</h1>
            <p className="text-sm text-gray-500 mt-0.5">Option grants & vesting progress</p>
          </div>
          {user.role === 'startup_admin' && <button className="btn btn-primary"><Plus className="w-4 h-4" /> Add Grant</button>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Total Granted" value={formatNumber(totalGranted)} sub="Options issued" icon={Users} color="blue" />
          <StatCard label="Vested" value={formatNumber(totalVested)} sub="Auto-calculated daily" color="green" />
          <StatCard label="Remaining" value={formatNumber(totalRemaining)} sub="To be vested" color="amber" />
          <StatCard label="Active Grants" value={activeGrants} sub={`of ${grants.length} total`} color="purple" />
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">All Option Grants</h2>
          <ESOPTracker grants={grants} shareholders={shareholders} />
        </div>
      </div>
    </DashboardLayout>
  )
}
