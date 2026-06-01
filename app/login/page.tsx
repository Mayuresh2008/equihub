'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signToken } from '@/lib/auth'
import { useAuthStore } from '@/lib/store/auth'
import { db } from '@/lib/mock/db'
import type { Role } from '@/lib/types'
import { Building2, Lock, Mail, User, Sparkles } from 'lucide-react'

const ROLES: { value: Role; label: string; desc: string; demo: string }[] = [
  { value: 'main_admin', label: 'Main Admin', desc: 'Full platform access', demo: 'admin@equihub.com' },
  { value: 'startup_admin', label: 'Startup Admin', desc: 'Company-specific access', demo: 'alex@neuralpath.io' },
  { value: 'investor', label: 'Investor', desc: 'Portfolio view only', demo: 'david@accel.vc' },
]

export default function LoginPage() {
  const router = useRouter()
  const { setAuth, initialize } = useAuthStore()
  const [email, setEmail] = useState('admin@equihub.com')
  const [password, setPassword] = useState('demo')
  const [role, setRole] = useState<Role>('main_admin')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setTimeout(() => {
      const user = db.users.find(u => u.email === email && u.role === role && u.isActive)
      if (!user) {
        setError('Invalid credentials. Try one of the demo accounts below.')
        setLoading(false)
        return
      }
      const token = signToken(user)
      setAuth(user, token)
      db.auditLogs.push({
        id: 'al' + Date.now(),
        userId: user.id,
        action: 'user.login',
        resourceType: 'User',
        resourceId: user.id,
        timestamp: new Date().toISOString(),
      })
      router.push('/dashboard')
    }, 500)
  }

  const pickDemo = (demoEmail: string, demoRole: Role) => {
    setEmail(demoEmail)
    setRole(demoRole)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-brand to-[#0F172A] text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gold rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400 rounded-full blur-3xl" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-light to-gold rounded-xl flex items-center justify-center text-white font-bold text-xl">E</div>
            <div>
              <div className="text-2xl font-bold">EquiHub</div>
              <div className="text-xs text-gray-400">Equity Management Platform</div>
            </div>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Manage startup equity<br />like a pro.
          </h1>
          <p className="text-gray-300 text-lg max-w-md">
            A modern Carta-like platform for cap tables, equity agreements, ESOP, and investor portfolios — all in one place.
          </p>
        </div>
        <div className="relative grid grid-cols-2 gap-4 max-w-md">
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <div className="text-2xl font-bold text-gold">3</div>
            <div className="text-xs text-gray-300">User roles</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <div className="text-2xl font-bold text-gold">5</div>
            <div className="text-xs text-gray-300">Sample companies</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <div className="text-2xl font-bold text-gold">10</div>
            <div className="text-xs text-gray-300">Document types</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <div className="text-2xl font-bold text-gold">AI</div>
            <div className="text-xs text-gray-300">Doc generator</div>
          </div>
        </div>
      </div>

      {/* Right side - login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-light to-gold rounded-lg flex items-center justify-center text-white font-bold">E</div>
            <div className="text-xl font-bold text-gray-900">EquiHub</div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-sm text-gray-500 mb-8">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Role</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`p-3 border rounded-lg text-left text-xs transition-all ${
                      role === r.value ? 'border-brand bg-brand/5 ring-1 ring-brand' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900 text-sm">{r.label}</div>
                    <div className="text-gray-500 mt-0.5">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  className="input pl-10"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="label mb-0">Password</label>
                <a href="#" className="text-xs text-brand hover:underline">Forgot password?</a>
              </div>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  className="input pl-10"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter any password (demo)"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center py-2.5 disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Demo accounts
            </div>
            <div className="space-y-2">
              {ROLES.map(r => (
                <button
                  key={r.value}
                  onClick={() => pickDemo(r.demo, r.value)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                >
                  <span className="font-medium text-gray-700">{r.label}</span>
                  <span className="text-gray-500 font-mono">{r.demo}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
