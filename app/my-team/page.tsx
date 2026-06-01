'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/lib/store/auth'
import { db } from '@/lib/mock/db'
import Link from 'next/link'
import { UserPlus, Mail, Shield } from 'lucide-react'
import { RoleBadge } from '@/components/shared/RoleBadge'

export default function MyTeamPage() {
  const { user } = useAuthStore()
  if (!user) return null
  if (user.role !== 'startup_admin' || !user.companyId) {
    return <DashboardLayout><div className="text-center py-12 text-gray-500">Startup Admin access only</div></DashboardLayout>
  }
  const shareholders = db.shareholders.filter(s => s.companyId === user.companyId)
  const founders = shareholders.filter(s => s.roleType === 'founder' || s.roleType === 'co_founder')
  const employees = shareholders.filter(s => s.roleType === 'employee')
  const advisors = shareholders.filter(s => s.roleType === 'advisor')
  const investors = shareholders.filter(s => s.roleType === 'vc_investor' || s.roleType === 'angel')

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Team</h1>
            <p className="text-sm text-gray-500 mt-1">Founders, employees, advisors, and investors on your cap table</p>
          </div>
          <Link href={`/companies/${user.companyId}/captable`} className="btn btn-primary">
            <UserPlus className="w-4 h-4" /> Add Member
          </Link>
        </div>

        {[
          { label: 'Founders', items: founders, color: 'badge-blue' },
          { label: 'Employees', items: employees, color: 'badge-yellow' },
          { label: 'Advisors', items: advisors, color: 'badge-gray' },
          { label: 'Investors', items: investors, color: 'badge-green' },
        ].map(group => (
          <div key={group.label} className="card">
            <h2 className="font-semibold text-gray-900 mb-3">{group.label} <span className="text-sm text-gray-500 font-normal">({group.items.length})</span></h2>
            {group.items.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4">No {group.label.toLowerCase()} yet</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.items.map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-light to-gold flex items-center justify-center text-white font-semibold text-sm">
                      {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 truncate">{s.name}</div>
                      <div className="text-xs text-gray-500 truncate">{s.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </DashboardLayout>
  )
}
