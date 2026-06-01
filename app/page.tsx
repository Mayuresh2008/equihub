'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth'

export default function Home() {
  const router = useRouter()
  const { user, isLoading, initialize } = useAuthStore()
  useEffect(() => { initialize() }, [initialize])
  useEffect(() => {
    if (!isLoading) router.push(user ? '/dashboard' : '/login')
  }, [isLoading, user, router])
  return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>
}
