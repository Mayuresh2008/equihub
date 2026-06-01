'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/lib/store/auth'
import { db } from '@/lib/mock/db'
import { useParams, useRouter } from 'next/navigation'
import { Building2, MapPin, Calendar, TrendingUp, Users, FileText, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils'
import { totalIssuedShares, calculateOwnership } from '@/lib/utils/calculations'
import { OwnershipPieChart } from '@/components/captable/OwnershipPieChart'
import { StatCard } from '@/components/shared/StatCard'

const STAGE_LABELS: Record<string, string> = {
  pre_seed: 'Pre-Seed', seed: 'Seed', series_a: 'Series A', series_b: 'Series B', series_c: 'Series C', ipo: 'IPO',
}

export default function CompanyDetailPage() {
  const { user } = useAuthStore()
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const company = db.companies.find(c => c.id === id)

  if (!user) return null
  if (!company) return <DashboardLayout><div>Company not found</div></DashboardLayout>
  if (user.role === 'startup_admin' && user.companyId !== company.id) {
    return <DashboardLayout><div className="text-center py-12 text-gray-500">Access denied</div></DashboardLayout>
  }
  if (user.role === 'investor' && !db.investments.some(i => i.investorUserId === user.id && i.companyId === company.id)) {
    return <DashboardLayout><div className="text-center py-12 text-gray-500">Access denied</div></DashboardLayout>
  }

  const shareholders = db.shareholders.filter(s => s.companyId === company.id)
  const total = totalIssuedShares(shareholders)
  const rounds = db.fundingRounds.filter(r => r.companyId === company.id)
  const grants = db.optionGrants.filter(g => g.companyId === company.id)
  const docs = db.documents.filter(d => d.companyId === company.id)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Link href={user.role === 'investor' ? '/portfolio' : '/companies'} className="text-sm text-gray-500 hover:text-gray-700">← Back</Link>

        <div className="card">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-light to-gold rounded-xl flex items-center justify-center text-white font-bold text-2xl">
              {company.companyName[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{company.companyName}</h1>
                  <p className="text-sm text-gray-500 mt-1">{company.industry} · {company.country}</p>
                </div>
                <span className="badge badge-blue">{STAGE_LABELS[company.fundingStage]}</span>
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
          <StatCard label="Issued Shares" value={formatNumber(total)} sub={`${formatPct(0)} of authorized`} />
          <StatCard label="Unissued Shares" value={formatNumber(Math.max(0, company.totalAuthorizedShares - total))} sub="Available pool" color="amber" />
          <StatCard label="Shareholders" value={shareholders.length} icon={Users} color="blue" />
          <StatCard label="Funding Rounds" value={rounds.length} icon={TrendingUp} color="green" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Ownership Distribution</h2>
              <Link href={`/companies/${company.id}/captable`} className="text-sm text-brand hover:underline">Full cap table →</Link>
            </div>
            <OwnershipPieChart shareholders={shareholders} totalShares={total} />
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
      </div>
    </DashboardLayout>
  )
}

function formatPct(n: number) { return n.toFixed(1) + '%' }
