'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/lib/store/auth'
import { db } from '@/lib/mock/db'
import { Building2, Search, Plus, MapPin, Calendar, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils'
import { totalIssuedShares } from '@/lib/utils/calculations'
import { ExportButton } from '@/components/shared/ExportButton'

const STAGE_LABELS: Record<string, string> = {
  pre_seed: 'Pre-Seed', seed: 'Seed', series_a: 'Series A', series_b: 'Series B', series_c: 'Series C', ipo: 'IPO',
}

export default function CompaniesPage() {
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('all')

  if (!user || user.role !== 'main_admin') {
    return <DashboardLayout><div className="text-center py-12 text-gray-500">Main Admin access only</div></DashboardLayout>
  }

  const filtered = db.companies.filter(c =>
    (stageFilter === 'all' || c.fundingStage === stageFilter) &&
    c.companyName.toLowerCase().includes(search.toLowerCase())
  )

  const exportData = db.companies.map(c => ({
    name: c.companyName, industry: c.industry, country: c.country,
    stage: c.fundingStage, founded: c.foundedDate, valuation: c.currentValuation || 0,
  }))

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Companies</h1>
            <p className="text-sm text-gray-500 mt-1">Manage {db.companies.length} companies on the platform</p>
          </div>
          <div className="flex gap-2">
            <ExportButton data={exportData} filename="companies" />
            <button className="btn btn-primary"><Plus className="w-4 h-4" /> Add Company</button>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input className="input pl-10" placeholder="Search companies..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="input w-auto" value={stageFilter} onChange={e => setStageFilter(e.target.value)}>
              <option value="all">All stages</option>
              {Object.entries(STAGE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(c => {
              const shareholders = db.shareholders.filter(s => s.companyId === c.id)
              const total = totalIssuedShares(shareholders)
              return (
                <Link
                  key={c.id}
                  href={`/companies/${c.id}`}
                  className="block p-5 border border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-brand-light to-gold rounded-xl flex items-center justify-center text-white font-bold text-lg">
                      {c.companyName[0]}
                    </div>
                    <span className="badge badge-blue">{STAGE_LABELS[c.fundingStage]}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{c.companyName}</h3>
                  <p className="text-xs text-gray-500 mb-3">{c.industry}</p>
                  <div className="space-y-1.5 text-xs text-gray-600">
                    <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {c.country}</div>
                    <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Founded {formatDate(c.foundedDate)}</div>
                    <div className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> {formatCurrency(c.currentValuation || 0)}</div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-500">{shareholders.length} shareholders</span>
                    <span className="font-semibold text-gray-900">{formatNumber(total)} shares</span>
                  </div>
                </Link>
              )
            })}
          </div>
          {filtered.length === 0 && <div className="text-center py-12 text-gray-500">No companies match your search</div>}
        </div>
      </div>
    </DashboardLayout>
  )
}
