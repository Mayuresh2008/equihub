'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, initialize } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (!isLoading && !user) router.push('/login')
  }, [isLoading, user, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Sidebar />
      <div className="ml-64">
        <Navbar />
        <main className="p-8">{children}</main>
      </div>
    </div>
  )
}
