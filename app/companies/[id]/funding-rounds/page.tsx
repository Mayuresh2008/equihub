'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/lib/store/auth'
import { db } from '@/lib/mock/db'
import { useParams } from 'next/navigation'
import { FundingRoundsTable } from '@/components/captable/FundingRoundsTable'
import { DilutionHistory } from '@/components/captable/DilutionHistory'
import Link from 'next/link'
import { StatCard } from '@/components/shared/StatCard'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { api } from '@/lib/api-client'
import { toast } from '@/lib/store/toast'
import { ModalShell, Field } from '@/components/shared/Modal'
import { TrendingUp, Plus } from 'lucide-react'

export default function FundingRoundsPage() {
  const { user } = useAuthStore()
  const params = useParams()
  const id = params?.id as string
  const [showAdd, setShowAdd] = useState(false)

  if (!user) return null
  const company = db.companies.find(c => c.id === id)
  if (!company) return <DashboardLayout><div>Company not found</div></DashboardLayout>
  if (user.role === 'startup_admin' && user.companyId !== company.id) {
    return <DashboardLayout><div className="text-center py-12 text-gray-500">Access denied</div></DashboardLayout>
  }
  if (user.role === 'investor') {
    return <DashboardLayout><div className="text-center py-12 text-gray-500">Investors cannot view funding rounds directly</div></DashboardLayout>
  }

  const rounds = db.fundingRounds.filter(r => r.companyId === company.id)
  const shareholders = db.shareholders.filter(s => s.companyId === company.id)
  const totalRaised = rounds.reduce((s, r) => s + r.amountRaised, 0)
  const totalNewShares = rounds.reduce((s, r) => s + r.newSharesIssued, 0)
  const latestRound = rounds.sort((a, b) => new Date(b.roundDate).getTime() - new Date(a.roundDate).getTime())[0]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <Link href={`/companies/${company.id}`} className="text-sm text-gray-500 hover:text-gray-700">← {company.companyName}</Link>
          <div className="flex items-center justify-between mt-1">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Funding Rounds</h1>
              <p className="text-sm text-gray-500 mt-0.5">{rounds.length} rounds · {formatCurrency(totalRaised)} total raised</p>
            </div>
            {user.role === 'startup_admin' && (
              <button onClick={() => setShowAdd(true)} className="btn btn-primary"><Plus className="w-4 h-4" /> Add Round</button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Total Raised" value={formatCurrency(totalRaised)} icon={TrendingUp} color="green" />
          <StatCard label="Rounds" value={rounds.length} sub="All time" color="blue" />
          <StatCard label="New Shares Issued" value={formatNumber(totalNewShares)} sub="Across all rounds" color="amber" />
          <StatCard label="Latest Round" value={latestRound?.roundName || '—'} sub={latestRound ? formatCurrency(latestRound.amountRaised) : ''} color="purple" />
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">All Funding Rounds</h2>
          <FundingRoundsTable rounds={rounds} />
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Dilution Impact per Round</h2>
          <DilutionHistory shareholders={shareholders} rounds={rounds} />
        </div>
      </div>

      {showAdd && <AddRoundModal companyId={company.id} onClose={() => setShowAdd(false)} />}
    </DashboardLayout>
  )
}

function AddRoundModal({ companyId, onClose }: { companyId: string; onClose: () => void }) {
  const [form, setForm] = useState({
    roundName: '',
    amountRaised: '',
    preMoneyValuation: '',
    pricePerShare: '',
    newSharesIssued: '',
    leadInvestor: '',
    roundDate: new Date().toISOString().split('T')[0],
  })
  const [busy, setBusy] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await api.post<{ fundingRound: any }>('/api/funding-rounds', { ...form, companyId })
      db.fundingRounds.push(res.fundingRound)
      toast.success(`Round "${form.roundName}" added`)
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to add round')
    } finally { setBusy(false) }
  }
  return (
    <ModalShell title="Add Funding Round" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Round Name *" value={form.roundName} onChange={v => setForm({ ...form, roundName: v })} required placeholder="Series A" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount Raised (USD) *" type="number" value={form.amountRaised} onChange={v => setForm({ ...form, amountRaised: v })} required />
          <Field label="Pre-money Valuation (USD) *" type="number" value={form.preMoneyValuation} onChange={v => setForm({ ...form, preMoneyValuation: v })} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Price per Share" type="number" value={form.pricePerShare} onChange={v => setForm({ ...form, pricePerShare: v })} />
          <Field label="New Shares Issued" type="number" value={form.newSharesIssued} onChange={v => setForm({ ...form, newSharesIssued: v })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Lead Investor" value={form.leadInvestor} onChange={v => setForm({ ...form, leadInvestor: v })} placeholder="Accel Ventures" />
          <Field label="Round Date" type="date" value={form.roundDate} onChange={v => setForm({ ...form, roundDate: v })} />
        </div>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn btn-secondary flex-1 justify-center">Cancel</button>
          <button type="submit" disabled={busy} className="btn btn-primary flex-1 justify-center disabled:opacity-50">
            {busy ? 'Adding...' : 'Add Round'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}
