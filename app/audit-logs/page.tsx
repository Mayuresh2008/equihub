'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/lib/store/auth'
import { db } from '@/lib/mock/db'
import { useState } from 'react'
import { Search, Activity } from 'lucide-react'
import { formatDate, timeAgo } from '@/lib/utils'

export default function AuditLogsPage() {
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')

  if (!user) return null
  if (user.role !== 'main_admin') return <DashboardLayout><div className="text-center py-12 text-gray-500">Main Admin access only</div></DashboardLayout>

  const actions: string[] = Array.from(new Set(db.auditLogs.map(l => l.action)))
  const filtered = db.auditLogs.filter(l =>
    (actionFilter === 'all' || l.action === actionFilter) &&
    (l.action.toLowerCase().includes(search.toLowerCase()) || l.resourceType.toLowerCase().includes(search.toLowerCase()))
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-sm text-gray-500 mt-1">Full activity log of all platform actions</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input className="input pl-10" placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="input w-auto" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
              <option value="all">All Actions</option>
              {actions.map(a => <option key={a} value={a as string}>{a}</option>)}
            </select>
          </div>
          <div className="space-y-1 max-h-[600px] overflow-y-auto">
            {filtered.map(log => {
              const u = db.users.find(user => user.id === log.userId)
              return (
                <div key={log.id} className="flex items-start gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">
                      <span className="font-medium text-gray-900">{u?.fullName || 'System'}</span>
                      <span className="text-gray-500"> performed </span>
                      <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{log.action}</code>
                      <span className="text-gray-500"> on </span>
                      <span className="font-medium text-gray-700">{log.resourceType}</span>
                    </div>
                    {log.newValue && (
                      <div className="text-xs text-gray-500 mt-1 font-mono bg-gray-50 px-2 py-1 rounded">
                        {JSON.stringify(log.newValue)}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 whitespace-nowrap">{timeAgo(log.timestamp)}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
