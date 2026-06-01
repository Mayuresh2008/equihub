'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth'
import { Building2, FileText, PieChart, Shield, Sparkles, TrendingUp, Users, Lock, Zap } from 'lucide-react'

const FEATURES = [
  { icon: PieChart, title: 'Real-time cap table', desc: 'Ownership %, pre/post-money valuation, price-per-share — all auto-calculated.' },
  { icon: TrendingUp, title: 'Funding rounds', desc: 'Track SAFE, priced seed, Series A and beyond with full dilution history.' },
  { icon: Users, title: 'ESOP tracker', desc: 'Daily-vested options with cliff, accelerator, and grant lifecycle management.' },
  { icon: FileText, title: 'Document library', desc: 'SHA, SAFE, term sheets, option grants, board resolutions — sign in-app.' },
  { icon: Sparkles, title: 'AI document generator', desc: 'AWS Bedrock (Claude 3 Sonnet) drafts investor-grade legal docs from prompts.' },
  { icon: Shield, title: 'Role-based access', desc: 'Main Admin, Startup Admin, Investor — strict isolation at the data layer.' },
]

export default function Home() {
  const router = useRouter()
  const { user, isLoading, initialize } = useAuthStore()
  useEffect(() => { initialize() }, [initialize])

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>
  }

  if (user) {
    if (typeof window !== 'undefined') router.replace('/dashboard')
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Redirecting...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      <header className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-brand-light to-gold rounded-lg flex items-center justify-center text-white font-bold">E</div>
          <span className="font-bold text-xl text-gray-900">EquiHub</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-brand px-3 py-2">Sign in</Link>
          <Link href="/login" className="btn btn-primary text-sm">Get started</Link>
        </nav>
      </header>

      <section className="max-w-7xl mx-auto px-6 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-brand text-xs font-medium mb-5">
          <Sparkles className="w-3.5 h-3.5 text-gold" /> Powered by AWS Bedrock · Built for startups & investors
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight max-w-4xl mx-auto">
          Equity management,<br />
          <span className="text-brand">simplified</span> for everyone.
        </h1>
        <p className="text-lg text-gray-600 mt-5 max-w-2xl mx-auto">
          The all-in-one platform for cap tables, funding rounds, ESOP, and investor-grade legal documents. Built like Carta, faster to use, designed for AI.
        </p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <Link href="/login" className="btn btn-primary text-base px-6 py-3">Try the demo →</Link>
          <a href="https://github.com/Mayuresh2008/equihub" target="_blank" rel="noreferrer" className="btn btn-secondary text-base px-6 py-3">View on GitHub</a>
        </div>
        <p className="text-xs text-gray-500 mt-4">Demo accounts: admin@equihub.com · alex@neuralpath.io · david@accel.vc (any password)</p>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-light/10 to-gold/10 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-brand" />
              </div>
              <h3 className="font-semibold text-gray-900">{f.title}</h3>
              <p className="text-sm text-gray-600 mt-2">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-br from-brand to-brand-light text-white">
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <Zap className="w-10 h-10 text-gold mx-auto mb-4" />
          <h2 className="text-3xl font-bold">Three roles. One platform. Zero friction.</h2>
          <p className="text-blue-100 mt-3 max-w-2xl mx-auto">
            Main Admins see everything. Startup Admins see only their company. Investors see only their holdings. All enforced at the data layer with audit logging.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10 max-w-4xl mx-auto">
            {[
              { role: 'Main Admin', desc: 'Full platform control, AI generator, all companies' },
              { role: 'Startup Admin', desc: 'Own cap table, funding rounds, ESOP, team' },
              { role: 'Investor', desc: 'Portfolio holdings, dilution history, signed docs' },
            ].map(r => (
              <div key={r.role} className="bg-white/10 backdrop-blur rounded-xl p-5 border border-white/20">
                <div className="font-semibold">{r.role}</div>
                <div className="text-sm text-blue-100 mt-1">{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-brand-light to-gold rounded flex items-center justify-center text-white text-xs font-bold">E</div>
            <span>EquiHub © 2026</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Next.js 14 · Prisma · AWS-ready</span>
            <Lock className="w-3.5 h-3.5" /> JWT + Cognito (mock)
          </div>
        </div>
      </footer>
    </div>
  )
}
