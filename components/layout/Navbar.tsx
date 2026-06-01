'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Search } from 'lucide-react'
import { useAuthStore } from '@/lib/store/auth'
import { db } from '@/lib/mock/db'
import { timeAgo, formatDate } from '@/lib/utils'
import { RoleBadge } from '../shared/RoleBadge'
import Link from 'next/link'

export default function Navbar() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted || !user) return null

  const notifications = db.notifications.filter(n => n.userId === user.id)
  const unread = notifications.filter(n => !n.isRead).length

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-30">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search companies, shareholders, documents..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <RoleBadge role={user.role} />
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unread}
              </span>
            )}
          </button>
          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  {unread > 0 && <span className="text-xs text-brand">{unread} new</span>}
                </div>
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-500">No notifications</div>
                ) : (
                  notifications.slice(0, 10).map(n => (
                    <div key={n.id} className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 ${!n.isRead ? 'bg-blue-50/50' : ''}`}>
                      <div className="text-sm text-gray-800">{n.message}</div>
                      <div className="text-xs text-gray-500 mt-1">{timeAgo(n.createdAt)}</div>
                    </div>
                  ))
                )}
                <div className="px-4 py-2 text-center border-t border-gray-100">
                  <Link href="/notifications" className="text-xs text-brand hover:underline">View all notifications</Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
