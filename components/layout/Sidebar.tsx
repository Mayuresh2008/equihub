'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth'
import {
  LayoutDashboard, Building2, PieChart, FileText, Users, Brain,
  UserCog, ScrollText, Settings, Briefcase, TrendingUp, Bell,
  LogOut, UserPlus
} from 'lucide-react'
import type { Role } from '@/lib/types'
import { cn } from '@/lib/utils'

const NAV: Record<Role, { section: string; items: { href: string; label: string; icon: any }[] }[]> = {
  main_admin: [
    { section: 'Main', items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ]},
    { section: 'Companies', items: [
      { href: '/companies', label: 'All Companies', icon: Building2 },
      { href: '/companies/c1/captable', label: 'Cap Tables', icon: PieChart },
      { href: '/companies/c1/funding-rounds', label: 'Funding Rounds', icon: TrendingUp },
      { href: '/companies/c1/esop', label: 'ESOP Tracker', icon: Users },
    ]},
    { section: 'Documents', items: [
      { href: '/documents', label: 'Document Library', icon: FileText },
      { href: '/ai-generator', label: 'AI Generator', icon: Brain },
    ]},
    { section: 'Admin', items: [
      { href: '/users', label: 'User Management', icon: UserCog },
      { href: '/audit-logs', label: 'Audit Logs', icon: ScrollText },
      { href: '/settings', label: 'Settings', icon: Settings },
    ]},
  ],
  startup_admin: [
    { section: 'Main', items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ]},
    { section: 'My Company', items: [
      { href: '/my-company', label: 'Company Profile', icon: Building2 },
      { href: '/my-captable', label: 'My Cap Table', icon: PieChart },
      { href: '/my-funding-rounds', label: 'Funding Rounds', icon: TrendingUp },
      { href: '/my-esop', label: 'ESOP Tracker', icon: Users },
      { href: '/my-team', label: 'My Team', icon: UserPlus },
    ]},
    { section: 'Documents', items: [
      { href: '/documents', label: 'My Documents', icon: FileText },
    ]},
  ],
  investor: [
    { section: 'Main', items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ]},
    { section: 'Portfolio', items: [
      { href: '/portfolio', label: 'My Portfolio', icon: Briefcase },
    ]},
    { section: 'Documents', items: [
      { href: '/documents', label: 'My Documents', icon: FileText },
    ]},
  ],
}

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const router = useRouter()

  if (!user) return null
  const sections = NAV[user.role] || []

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#0F172A] text-gray-300 flex flex-col z-40">
      <div className="px-5 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-light to-gold rounded-lg flex items-center justify-center text-white font-bold text-sm">E</div>
          <div>
            <div className="text-white font-bold text-lg leading-none">EquiHub</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Equity Management</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {sections.map((section) => (
          <div key={section.section} className="mb-2">
            <div className="px-5 py-2 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
              {section.section}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-5 py-2.5 text-sm transition-colors border-l-2',
                    isActive
                      ? 'bg-brand/20 text-white border-brand-light'
                      : 'border-transparent hover:bg-gray-800 hover:text-white'
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-light to-gold flex items-center justify-center text-white font-semibold text-sm">
            {user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white font-medium truncate">{user.fullName}</div>
            <div className="text-xs text-gray-500 truncate">{user.email}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
