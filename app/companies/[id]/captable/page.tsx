'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/lib/store/auth'
import { db } from '@/lib/mock/db'
import { useParams } from 'next/navigation'
import { ShareholderTable } from '@/components/captable/ShareholderTable'
import { OwnershipPieChart } from '@/components/captable/OwnershipPieChart'
import { FundingRoundsTable } from '@/components/captable/FundingRoundsTable'
import { ESOPTracker } from '@/components/captable/ESOPTracker'
import { DilutionHistory } from '@/components/captable/DilutionHistory'
import { StatCard } from '@/components/shared/StatCard'
import { ExportButton } from '@/components/shared/ExportButton'
import { Plus, FileText, Download } from 'lucide-react'
import Link from 'next/link'
import { totalIssuedShares, calculateOwnership } from '@/lib/utils/calculations'
import { formatCurrency, formatNumber } from '@/lib/utils'

export default function CapTablePage() {
  const { user } = useAuthStore()
  const params = useParams()
  const id = params?.id as string
  const [tab, setTab] = useState<'shareholders' | 'funding' | 'esop' | 'dilution'>('shareholders')
  const [showAdd, setShowAdd] = useState(false)

  if (!user) return null
  const company = db.companies.find(c => c.id === id)
  if (!company) return <DashboardLayout><div>Company not found</div></DashboardLayout>
  if (user.role === 'startup_admin' && user.companyId !== company.id) {
    return <DashboardLayout><div className="text-center py-12 text-gray-500">Access denied</div></DashboardLayout>
  }
  if (user.role === 'investor') {
    return <DashboardLayout><div className="text-center py-12 text-gray-500">Access denied</div></DashboardLayout>
  }

  const shareholders = db.shareholders.filter(s => s.companyId === company.id)
  const rounds = db.fundingRounds.filter(r => r.companyId === company.id)
  const grants = db.optionGrants.filter(g => g.companyId === company.id)
  const total = totalIssuedShares(shareholders)
  const unissued = Math.max(0, company.totalAuthorizedShares - total)

  const exportData = shareholders.map(s => ({
    name: s.name, role: s.roleType, email: s.email, class: s.shareClass,
    shares: s.sharesOwned, ownership_pct: calculateOwnership(s.sharesOwned, total).toFixed(2),
  }))

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href={`/companies/${company.id}`} className="text-sm text-gray-500 hover:text-gray-700">← {company.companyName}</Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Cap Table</h1>
            <p className="text-sm text-gray-500 mt-0.5">Auto-calculated ownership · {formatNumber(total)} of {formatNumber(company.totalAuthorizedShares)} shares issued</p>
          </div>
          <div className="flex gap-2">
            <ExportButton data={exportData} filename={`${company.companyName}-captable`} />
            {user.role === 'startup_admin' && (
              <button onClick={() => setShowAdd(true)} className="btn btn-primary">
                <Plus className="w-4 h-4" /> Add Shareholder
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Issued Shares" value={formatNumber(total)} sub="Total outstanding" />
          <StatCard label="Unissued Shares" value={formatNumber(unissued)} sub="Available pool" color="amber" />
          <StatCard label="Shareholders" value={shareholders.length} sub="On cap table" color="blue" />
          <StatCard label="Current Valuation" value={formatCurrency(company.currentValuation || 0)} sub="Post-money" color="green" />
        </div>

        <div className="border-b border-gray-200 flex gap-1">
          {[
            { id: 'shareholders', label: 'Shareholders' },
            { id: 'funding', label: 'Funding Rounds' },
            { id: 'esop', label: 'ESOP Tracker' },
            { id: 'dilution', label: 'Dilution History' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'shareholders' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card">
              <h2 className="font-semibold text-gray-900 mb-4">Shareholders</h2>
              <ShareholderTable shareholders={shareholders} />
            </div>
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4">Ownership</h2>
              <OwnershipPieChart shareholders={shareholders} totalShares={total} />
            </div>
          </div>
        )}

        {tab === 'funding' && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Funding Rounds</h2>
              {user.role === 'startup_admin' && <button className="btn btn-primary btn-sm"><Plus className="w-3.5 h-3.5" /> Add Round</button>}
            </div>
            <FundingRoundsTable rounds={rounds} />
          </div>
        )}

        {tab === 'esop' && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">ESOP / Option Grants</h2>
              {user.role === 'startup_admin' && <button className="btn btn-primary btn-sm"><Plus className="w-3.5 h-3.5" /> Add Grant</button>}
            </div>
            <ESOPTracker grants={grants} shareholders={shareholders} />
          </div>
        )}

        {tab === 'dilution' && (
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Dilution History</h2>
            <DilutionHistory shareholders={shareholders} rounds={rounds} />
          </div>
        )}

        {showAdd && <AddShareholderModal companyId={company.id} onClose={() => setShowAdd(false)} />}
      </div>
    </DashboardLayout>
  )
}

function AddShareholderModal({ companyId, onClose }: { companyId: string; onClose: () => void }) {
  const [form, setForm] = useState({
    name: '', email: '', roleType: 'employee', shareClass: 'common',
    sharesOwned: 0, dateIssued: new Date().toISOString().split('T')[0], country: 'United States',
  })
  const { user } = useAuthStore()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || form.sharesOwned <= 0) return
    const newSH = {
      id: 's' + Date.now(),
      companyId,
      name: form.name,
      email: form.email,
      roleType: form.roleType as any,
      sharesOwned: Number(form.sharesOwned),
      shareClass: form.shareClass as any,
      dateIssued: form.dateIssued,
      country: form.country,
      createdAt: new Date().toISOString(),
    }
    db.shareholders.push(newSH)
    db.equityTransactions.push({
      id: 't' + Date.now(),
      companyId,
      toShareholderId: newSH.id,
      transactionType: 'issuance',
      numShares: newSH.sharesOwned,
      transactionDate: form.dateIssued,
      status: 'completed',
      createdAt: new Date().toISOString(),
    })
    if (user) {
      db.auditLogs.push({
        id: 'al' + Date.now(),
        userId: user.id,
        action: 'shareholder.added',
        resourceType: 'Shareholder',
        resourceId: newSH.id,
        newValue: { name: form.name, shares: newSH.sharesOwned },
        timestamp: new Date().toISOString(),
      })
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Add Shareholder</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">Name *</label>
            <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Email *</label>
            <input type="email" className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.roleType} onChange={e => setForm({ ...form, roleType: e.target.value })}>
                <option value="founder">Founder</option>
                <option value="co_founder">Co-Founder</option>
                <option value="angel">Angel</option>
                <option value="vc_investor">VC Investor</option>
                <option value="employee">Employee</option>
                <option value="advisor">Advisor</option>
              </select>
            </div>
            <div>
              <label className="label">Class</label>
              <select className="input" value={form.shareClass} onChange={e => setForm({ ...form, shareClass: e.target.value })}>
                <option value="common">Common</option>
                <option value="preferred">Preferred</option>
                <option value="options">Options</option>
                <option value="safe">SAFE</option>
                <option value="warrant">Warrant</option>
                <option value="convertible_note">Convertible Note</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Shares *</label>
              <input type="number" min="1" className="input" value={form.sharesOwned || ''} onChange={e => setForm({ ...form, sharesOwned: Number(e.target.value) })} required />
            </div>
            <div>
              <label className="label">Date Issued</label>
              <input type="date" className="input" value={form.dateIssued} onChange={e => setForm({ ...form, dateIssued: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Country</label>
            <input className="input" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} />
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            <strong>Note:</strong> Ownership % is auto-calculated. You cannot enter it manually.
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" className="btn btn-primary flex-1 justify-center">Add Shareholder</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function formatPct(n: number) { return n.toFixed(1) + '%' }
