'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/lib/store/auth'
import { db } from '@/lib/mock/db'
import { useParams } from 'next/navigation'
import { Building2, MapPin, Calendar, TrendingUp, Users, FileText, ChevronRight, Plus } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatNumber, formatDate, formatPct } from '@/lib/utils'
import { totalIssuedShares } from '@/lib/utils/captable'
import { OwnershipPieChart } from '@/components/captable/OwnershipPieChart'
import { StatCard } from '@/components/shared/StatCard'
import { AddShareholderModal } from '@/components/captable/AddShareholderModal'
import type { ShareholderView, CapTableSummary } from '@/lib/types'
import { useEffect } from 'react'
import { api } from '@/lib/api-client'
import { toast } from '@/lib/store/toast'

const STAGE_LABELS: Record<string, string> = {
  pre_seed: 'Pre-Seed', seed: 'Seed', series_a: 'Series A', series_b: 'Series B', series_c: 'Series C', ipo: 'IPO',
}

export default function CompanyDetailPage() {
  const { user } = useAuthStore()
  const params = useParams()
  const id = params?.id as string
  const company = db.companies.find(c => c.id === id)
  const [showAdd, setShowAdd] = useState(false)
  const [shareholders, setShareholders] = useState<ShareholderView[]>([])
  const [summary, setSummary] = useState<CapTableSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        const r = await api.get<{ shareholders: ShareholderView[]; summary: CapTableSummary }>(`/api/companies/${id}/shareholders`)
        setShareholders(r.shareholders)
        setSummary(r.summary)
      } catch (e: any) {
        toast.error('Failed to load cap table data')
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  if (!user) return null
  if (!company) return <DashboardLayout><div>Company not found</div></DashboardLayout>
  if (user.role === 'startup_admin' && user.companyId !== company.id) {
    return <DashboardLayout><div className="text-center py-12 text-gray-500">Access denied</div></DashboardLayout>
  }
  if (user.role === 'investor' && !db.investments.some(i => i.investorUserId === user.id && i.companyId === company.id)) {
    return <DashboardLayout><div className="text-center py-12 text-gray-500">Access denied</div></DashboardLayout>
  }

  const total = totalIssuedShares(shareholders as any) || summary?.totalIssued || 0
  const rounds = db.fundingRounds.filter(r => r.companyId === company.id)
  const docs = db.documents.filter(d => d.companyId === company.id)
  const authorizedPct = company.totalAuthorizedShares > 0 ? (total / company.totalAuthorizedShares) * 100 : 0
  const unissued = Math.max(0, company.totalAuthorizedShares - total)
  const canEdit = (user.role === 'startup_admin' && user.companyId === company.id) || user.role === 'main_admin'

  const refreshData = async () => {
    try {
      const r = await api.get<{ shareholders: ShareholderView[]; summary: CapTableSummary }>(`/api/companies/${id}/shareholders`)
      setShareholders(r.shareholders)
      setSummary(r.summary)
    } catch (e) { /* ignore */ }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Link href={user.role === 'investor' ? '/portfolio' : '/companies'} className="text-sm text-gray-500 hover:text-gray-700">← Back</Link>

        <div className="card">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-light to-gold rounded-xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
              {company.companyName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{company.companyName}</h1>
                  <p className="text-sm text-gray-500 mt-1">{company.industry} · {company.country}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="badge badge-blue">{STAGE_LABELS[company.fundingStage]}</span>
                  {canEdit && (
                    <button onClick={() => setShowAdd(true)} className="btn btn-primary" data-testid="company-add-shareholder-btn">
                      <Plus className="w-4 h-4" /> Add Shareholder
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                <div>
                  <div className="text-xs text-gray-500">Founded</div>
                  <div className="font-medium text-gray-900">{formatDate(company.foundedDate)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Registration</div>
                  <div className="font-medium text-gray-900">{company.registrationNumber || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Authorized Shares</div>
                  <div className="font-medium text-gray-900">{formatNumber(company.totalAuthorizedShares)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Current Valuation</div>
                  <div className="font-medium text-gray-900">{formatCurrency(company.currentValuation || 0)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Issued Shares" value={formatNumber(total)} sub={`${formatPct(authorizedPct)} of authorized`} />
          <StatCard label="Unissued Shares" value={formatNumber(unissued)} sub="Available pool" color="amber" />
          <StatCard label="Shareholders" value={shareholders.length} icon={Users} color="blue" />
          <StatCard label="Funding Rounds" value={rounds.length} icon={TrendingUp} color="green" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Ownership Distribution</h2>
              <Link href={`/companies/${company.id}/captable`} className="text-sm text-brand hover:underline">Full cap table →</Link>
            </div>
            {loading ? (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
            ) : shareholders.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-gray-500">
                <div className="text-3xl mb-2">🥧</div>
                <div className="text-sm mb-3">No shareholders yet</div>
                {canEdit && (
                  <button onClick={() => setShowAdd(true)} className="btn btn-primary btn-sm">
                    <Plus className="w-3.5 h-3.5" /> Add First Shareholder
                  </button>
                )}
              </div>
            ) : (
              <OwnershipPieChart shareholders={shareholders} totalShares={total} height={280} />
            )}
          </div>
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Quick Links</h2>
            <div className="space-y-2">
              {user.role === 'investor' ? (
                <Link href={`/portfolio/${company.id}`} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-brand hover:bg-blue-50/30">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium">My Holdings & Documents</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              ) : (
                <>
                  <Link href={`/companies/${company.id}/captable`} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-brand hover:bg-blue-50/30">
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium">Cap Table & Shareholders</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                  <Link href={`/companies/${company.id}/funding-rounds`} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-brand hover:bg-blue-50/30">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium">Funding Rounds & Dilution</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                  <Link href={`/companies/${company.id}/esop`} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-brand hover:bg-blue-50/30">
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium">ESOP & Vesting</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                </>
              )}
              <Link href="/documents" className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-brand hover:bg-blue-50/30">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium">Documents ({docs.length})</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
            </div>
          </div>
        </div>

        {showAdd && summary && (
          <AddShareholderModal
            companyId={company.id}
            authorized={company.totalAuthorizedShares}
            currentShareholders={shareholders}
            onClose={() => setShowAdd(false)}
            onSuccess={() => { refreshData(); toast.success('Shareholder added') }}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
