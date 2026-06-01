'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth'

export default function ShortcutPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuthStore()
  useEffect(() => {
    if (!user) return
    if (user.role === 'startup_admin' && user.companyId) {
      router.replace(`/companies/${user.companyId}/captable`)
    } else if (user.role === 'main_admin') {
      router.replace('/companies')
    } else {
      router.replace('/dashboard')
    }
  }, [user, router])
  return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>
}
