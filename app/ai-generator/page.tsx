'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/lib/store/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { AIGeneratorPanel } from '@/components/documents/AIGeneratorPanel'
import { Sparkles, Lock } from 'lucide-react'

export default function AIGeneratorPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  useEffect(() => {
    if (user && user.role !== 'main_admin') router.replace('/dashboard')
  }, [user, router])
  if (!user) return null
  if (user.role !== 'main_admin') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <Lock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">AI Generator is exclusive to Main Admin</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-gold" />
            <h1 className="text-2xl font-bold text-gray-900">AI Document Generator</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">Powered by AWS Bedrock (Claude 3 Sonnet). Generate investor-grade legal documents from a few natural language inputs.</p>
        </div>
        <div className="card">
          <AIGeneratorPanel />
        </div>
      </div>
    </DashboardLayout>
  )
}
