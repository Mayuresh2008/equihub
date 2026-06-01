'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/lib/store/auth'
import { db } from '@/lib/mock/db'
import { Bell, Check } from 'lucide-react'
import { timeAgo } from '@/lib/utils'

export default function NotificationsPage() {
  const { user } = useAuthStore()
  if (!user) return null
  const notifications = db.notifications.filter(n => n.userId === user.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">All your alerts and updates</p>
        </div>
        <div className="card">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No notifications</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map(n => (
                <div key={n.id} className={`p-4 flex items-start gap-3 ${!n.isRead ? 'bg-blue-50/50' : ''}`}>
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{n.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{timeAgo(n.createdAt)} · {n.type.replace('.', ' ')}</p>
                  </div>
                  {!n.isRead && (
                    <button
                      onClick={() => { n.isRead = true }}
                      className="text-xs text-brand hover:underline flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Mark read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
