'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/lib/store/auth'
import { api } from '@/lib/api-client'
import { toast } from '@/lib/store/toast'
import { Plus, RefreshCw, Download, ArrowLeftRight, Calculator, Users, Eye, EyeOff } from 'lucide-react'
import { CapTableSummaryPanel } from '@/components/captable/CapTableSummaryPanel'
import { ShareholderTable } from '@/components/captable/ShareholderTable'
import { OwnershipPieChart } from '@/components/captable/OwnershipPieChart'
import { TypeBreakdownSection } from '@/components/captable/TypeBreakdownSection'
import { DilutionHistory } from '@/components/captable/DilutionHistory'
import { AddShareholderModal } from '@/components/captable/AddShareholderModal'
import { EditShareholderModal } from '@/components/captable/EditShareholderModal'
import { TransferSharesModal } from '@/components/captable/TransferSharesModal'
import { DilutionCalculator } from '@/components/captable/DilutionCalculator'
import type { ShareholderView, CapTableSummary, Company, FundingRound, ShareholderRole } from '@/lib/types'
import { formatNumber } from '@/lib/utils'
import { ExportButton } from '@/components/shared/ExportButton'
import { totalIssuedShares } from '@/lib/utils/captable'

type Tab = 'shareholders' | 'type-breakdown' | 'calculator' | 'history'

export default function CapTablePage() {
  const { user } = useAuthStore()
  const params = useParams()
  const id = params?.id as string
  const [tab, setTab] = useState<Tab>('shareholders')
  const [view, setView] = useState<'undiluted' | 'fully_diluted'>('undiluted')
  const [selectedShareholder, setSelectedShareholder] = useState<ShareholderView | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [editShareholder, setEditShareholder] = useState<ShareholderView | null>(null)
  const [transferShareholder, setTransferShareholder] = useState<ShareholderView | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [shareholders, setShareholders] = useState<ShareholderView[]>([])
  const [summary, setSummary] = useState<CapTableSummary | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [rounds, setRounds] = useState<FundingRound[]>([])

  const refresh = useCallback(async (silent = false) => {
    if (!id) return
    if (!silent) setRefreshing(true)
    try {
      const [s, comp] = await Promise.all([
        api.get<{ shareholders: ShareholderView[]; summary: CapTableSummary }>(`/api/companies/${id}/shareholders`),
        api.get<{ companies: Company[] }>('/api/companies'),
      ])
      setShareholders(s.shareholders)
      setSummary(s.summary)
      setCompany(comp.companies.find(c => c.id === id) || null)
      // Rounds are needed by DilutionHistory component
      const r = await api.get<{ fundingRounds: FundingRound[] }>('/api/funding-rounds')
      setRounds((r.fundingRounds || []).filter(fr => fr.companyId === id))
    } catch (e: any) {
      toast.error('Failed to load cap table')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [id])

  useEffect(() => { refresh() }, [refresh])

  if (!user) return null
  if (loading) return <DashboardLayout><div className="text-center py-12 text-gray-500">Loading cap table…</div></DashboardLayout>
  if (!company) return <DashboardLayout><div className="text-center py-12 text-gray-500">Company not found</div></DashboardLayout>
  if (user.role === 'startup_admin' && user.companyId !== company.id) {
    return <DashboardLayout><div className="text-center py-12 text-gray-500">Access denied</div></DashboardLayout>
  }
  if (user.role === 'investor') {
    return <DashboardLayout><div className="text-center py-12 text-gray-500">Access denied</div></DashboardLayout>
  }

  const canEdit = user.role === 'startup_admin' && user.companyId === company.id
  const total = totalIssuedShares(shareholders as any)

  const handleCancel = async (s: ShareholderView) => {
    if (!confirm(`Cancel ${s.name}'s shares? This will set their status to cancelled and remove ${formatNumber(s.sharesOwned)} shares from the cap table. Other holders' % will be recalculated automatically.`)) return
    try {
      await api.delete(`/api/companies/${company.id}/shareholders/${s.id}`)
      toast.success(`${s.name} cancelled. All remaining shareholders' % recalculated.`)
      refresh()
    } catch (err: any) {
      toast.error(err.message || 'Cancel failed')
    }
  }
  const handleIssueCertificate = async (s: ShareholderView) => {
    try {
      const res = await api.post<{ document: any }>(`/api/companies/${company.id}/shareholders/${s.id}/issue-certificate`, { documentName: `Share Certificate #${s.certificateNumber} — ${s.name}` })
      toast.success(`Certificate generated: ${res.document.documentName}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to issue certificate')
    }
  }

  const exportData = shareholders.map(s => ({
    name: s.name, role: s.roleType, email: s.email, class: s.shareClass,
    shares: s.sharesOwned, ownership_pct: s.ownershipPct.toFixed(2),
    investment: s.investmentValue, certificate: s.certificateNumber, status: s.status,
  }))

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <Link href={`/companies/${company.id}`} className="text-sm text-gray-500 hover:text-gray-700">← {company.companyName}</Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Cap Table</h1>
            <p className="text-sm text-gray-500 mt-0.5">Auto-calculated ownership · {formatNumber(total)} of {formatNumber(company.totalAuthorizedShares)} shares issued</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => refresh()} disabled={refreshing} className="btn btn-secondary">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
            <ExportButton data={exportData} filename={`${company.companyName}-captable`} />
            {canEdit && (
              <button onClick={() => setShowAdd(true)} className="btn btn-primary">
                <Plus className="w-4 h-4" /> Add Shareholder
              </button>
            )}
          </div>
        </div>

        {/* Summary panel */}
        {summary && <CapTableSummaryPanel summary={summary} company={company} />}

        {/* View toggle (Undiluted / Fully Diluted) */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
            <button
              onClick={() => setView('undiluted')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${view === 'undiluted' ? 'bg-brand text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <Eye className="w-3.5 h-3.5" /> Undiluted View
            </button>
            <button
              onClick={() => setView('fully_diluted')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${view === 'fully_diluted' ? 'bg-brand text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <EyeOff className="w-3.5 h-3.5" /> Fully Diluted View
            </button>
          </div>
          <span className="text-xs text-gray-500">
            {view === 'undiluted' ? 'Issued shares only' : 'Including unexercised options'}
          </span>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 flex gap-1">
          {[
            { id: 'shareholders', label: 'Shareholders', count: shareholders.length },
            { id: 'type-breakdown', label: 'By Type', icon: Users },
            { id: 'calculator', label: 'What-If Calculator', icon: Calculator },
            { id: 'history', label: 'Dilution History' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as Tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                tab === t.id ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.icon && <t.icon className="w-4 h-4" />}
              {t.label}
              {t.count !== undefined && <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{t.count}</span>}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'shareholders' && summary && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card">
              <h2 className="font-semibold text-gray-900 mb-4">Shareholders</h2>
              <ShareholderTable
                shareholders={shareholders}
                view={view}
                companyId={company.id}
                canEdit={canEdit}
                onEdit={s => setEditShareholder(s)}
                onTransfer={s => setTransferShareholder(s)}
                onCancel={handleCancel}
                onIssueCertificate={handleIssueCertificate}
              />
            </div>
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4">Ownership Distribution</h2>
              <OwnershipPieChart
                shareholders={shareholders}
                totalShares={total}
                view={view}
                onSelect={s => setSelectedShareholder(s)}
                height={320}
              />
              {selectedShareholder && (
                <div className="mt-3 pt-3 border-t border-gray-100 text-xs">
                  <div className="text-gray-500 uppercase tracking-wider mb-1">Selected</div>
                  <div className="font-semibold text-gray-900">{selectedShareholder.name}</div>
                  <div className="text-gray-600">{formatNumber(selectedShareholder.sharesOwned)} shares · {formatNumber(selectedShareholder.ownershipPct)}%</div>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'type-breakdown' && (
          <TypeBreakdownSection shareholders={shareholders} view={view} />
        )}

        {tab === 'calculator' && summary && (
          <DilutionCalculator
            companyId={company.id}
            shareholders={shareholders}
            authorized={company.totalAuthorizedShares}
            currentValuation={summary.currentValuation}
          />
        )}

        {tab === 'history' && (
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Dilution History</h2>
            <DilutionHistory shareholders={shareholders as any} rounds={rounds} />
          </div>
        )}

        {/* Modals */}
        {showAdd && summary && (
          <AddShareholderModal
            companyId={company.id}
            authorized={company.totalAuthorizedShares}
            currentShareholders={shareholders}
            onClose={() => setShowAdd(false)}
            onSuccess={() => refresh()}
          />
        )}
        {editShareholder && (
          <EditShareholderModal
            companyId={company.id}
            shareholder={editShareholder}
            onClose={() => setEditShareholder(null)}
            onSuccess={() => refresh()}
          />
        )}
        {transferShareholder && (
          <TransferSharesModal
            companyId={company.id}
            from={transferShareholder}
            shareholders={shareholders}
            onClose={() => setTransferShareholder(null)}
            onSuccess={() => refresh()}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
