'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/lib/store/auth'
import { db } from '@/lib/mock/db'
import { api } from '@/lib/api-client'
import { toast } from '@/lib/store/toast'
import { Plus, Search, Edit } from 'lucide-react'
import { ModalShell, Field } from '@/components/shared/Modal'
import { formatCurrency } from '@/lib/utils'
import type { FundingStage } from '@/lib/types'

export default function CompaniesPage() {
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  useEffect(() => { setTick(t => t + 1) }, [db.companies.length])

  if (!user) return null
  if (user.role !== 'main_admin') return <DashboardLayout><div className="text-center py-12 text-gray-500">Main Admin access only</div></DashboardLayout>

  const filtered = db.companies.filter(c =>
    (stageFilter === 'all' || c.fundingStage === stageFilter) &&
    c.companyName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Companies</h1>
            <p className="text-sm text-gray-500 mt-1">{db.companies.length} companies on the platform</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn btn-primary">
            <Plus className="w-4 h-4" /> New Company
          </button>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input className="input pl-10" placeholder="Search companies..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="input w-auto" value={stageFilter} onChange={e => setStageFilter(e.target.value)}>
              <option value="all">All Stages</option>
              {['pre_seed','seed','series_a','series_b','series_c','ipo'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
            </select>
          </div>
          <table className="w-full text-sm" data-tick={tick}>
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200">
                <th className="py-3">Company</th>
                <th className="py-3">Industry</th>
                <th className="py-3">Stage</th>
                <th className="py-3">Shareholders</th>
                <th className="py-3 text-right">Valuation</th>
                <th className="py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const shareholderCount = db.shareholders.filter(s => s.companyId === c.id).length
                return (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-light to-gold flex items-center justify-center text-white font-semibold text-sm">
                          {c.companyName.split(' ').map(w => w[0]).join('').slice(0,2)}
                        </div>
                        <div>
                          <a href={`/companies/${c.id}`} className="font-medium text-gray-900 hover:text-brand">{c.companyName}</a>
                          <div className="text-xs text-gray-500">{c.country} · {new Date(c.foundedDate).getFullYear()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-gray-600">{c.industry}</td>
                    <td className="py-3"><span className="badge badge-blue">{c.fundingStage.replace('_',' ')}</span></td>
                    <td className="py-3 text-gray-600">{shareholderCount}</td>
                    <td className="py-3 text-right font-medium text-gray-900">{c.currentValuation ? formatCurrency(Number(c.currentValuation)) : '—'}</td>
                    <td className="py-3 text-right">
                      <button onClick={() => setEditing(c.id)} className="text-xs text-gray-500 hover:text-brand inline-flex items-center gap-1">
                        <Edit className="w-3 h-3" /> Edit
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && <CreateCompanyModal onClose={() => setShowCreate(false)} />}
      {editing && <EditCompanyModal id={editing} onClose={() => setEditing(null)} />}
    </DashboardLayout>
  )
}

function CreateCompanyModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuthStore()
  const [form, setForm] = useState({
    companyName: '',
    country: 'United States',
    industry: 'Technology',
    fundingStage: 'seed' as FundingStage,
    totalAuthorizedShares: 10_000_000,
    currentValuation: '',
  })
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setBusy(true)
    try {
      const res = await api.post<{ company: any }>('/api/companies', {
        companyName: form.companyName,
        country: form.country,
        industry: form.industry,
        fundingStage: form.fundingStage,
        totalAuthorizedShares: Number(form.totalAuthorizedShares),
        currentValuation: form.currentValuation ? Number(form.currentValuation) : undefined,
        createdById: user.id,
      })
      db.companies.push(res.company)
      toast.success(`Company "${form.companyName}" created`)
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create')
    } finally {
      setBusy(false)
    }
  }

  return (
    <ModalShell title="Create Company" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Company Name *" value={form.companyName} onChange={v => setForm({ ...form, companyName: v })} required />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Country" value={form.country} onChange={v => setForm({ ...form, country: v })} />
          <Field label="Industry" value={form.industry} onChange={v => setForm({ ...form, industry: v })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Funding Stage</label>
            <select className="input" value={form.fundingStage} onChange={e => setForm({ ...form, fundingStage: e.target.value as FundingStage })}>
              {['pre_seed','seed','series_a','series_b','series_c','ipo'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
            </select>
          </div>
          <Field label="Total Authorized Shares" type="number" value={String(form.totalAuthorizedShares)} onChange={v => setForm({ ...form, totalAuthorizedShares: Number(v) })} />
        </div>
        <Field label="Current Valuation (USD, optional)" type="number" value={form.currentValuation} onChange={v => setForm({ ...form, currentValuation: v })} />
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn btn-secondary flex-1 justify-center">Cancel</button>
          <button type="submit" disabled={busy} className="btn btn-primary flex-1 justify-center disabled:opacity-50">
            {busy ? 'Creating...' : 'Create Company'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}

function EditCompanyModal({ id, onClose }: { id: string; onClose: () => void }) {
  const company = db.companies.find(c => c.id === id)
  const [form, setForm] = useState({
    companyName: company?.companyName || '',
    industry: company?.industry || '',
    country: company?.country || '',
    currentValuation: company?.currentValuation ? String(company.currentValuation) : '',
  })
  const [busy, setBusy] = useState(false)
  if (!company) return null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await api.put<{ company: any }>(`/api/companies/${id}`, {
        companyName: form.companyName, industry: form.industry, country: form.country,
        currentValuation: form.currentValuation ? Number(form.currentValuation) : null,
      })
      const idx = db.companies.findIndex(c => c.id === id)
      if (idx >= 0) db.companies[idx] = res.company
      toast.success('Company updated')
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update')
    } finally {
      setBusy(false)
    }
  }

  return (
    <ModalShell title="Edit Company" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Company Name *" value={form.companyName} onChange={v => setForm({ ...form, companyName: v })} required />
        <Field label="Industry" value={form.industry} onChange={v => setForm({ ...form, industry: v })} />
        <Field label="Country" value={form.country} onChange={v => setForm({ ...form, country: v })} />
        <Field label="Current Valuation (USD)" type="number" value={form.currentValuation} onChange={v => setForm({ ...form, currentValuation: v })} />
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn btn-secondary flex-1 justify-center">Cancel</button>
          <button type="submit" disabled={busy} className="btn btn-primary flex-1 justify-center disabled:opacity-50">
            {busy ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}
