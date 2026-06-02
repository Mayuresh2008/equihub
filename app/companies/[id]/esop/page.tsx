'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/lib/store/auth'
import { db } from '@/lib/mock/db'
import { useParams } from 'next/navigation'
import { ESOPTracker } from '@/components/captable/ESOPTracker'
import { StatCard } from '@/components/shared/StatCard'
import { ModalShell, Field } from '@/components/shared/Modal'
import { api } from '@/lib/api-client'
import { toast } from '@/lib/store/toast'
import { formatNumber, formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { Users, TrendingUp, Plus, Award } from 'lucide-react'

export default function ESOPPage() {
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
    return <DashboardLayout><div className="text-center py-12 text-gray-500">Investors cannot view ESOP</div></DashboardLayout>
  }

  const grants = db.optionGrants.filter(g => g.companyId === company.id)
  const employees = db.shareholders.filter(s => s.companyId === company.id && (s.roleType === 'employee' || s.roleType === 'founder' || s.roleType === 'co_founder'))
  const totalOptions = grants.reduce((s, g) => s + g.numOptions, 0)
  const totalExercised = grants.filter(g => g.status === 'exercised').reduce((s, g) => s + g.numOptions, 0)
  const totalVested = grants.reduce((s, g) => s + Math.floor(g.numOptions * 0.5), 0) // simple approximation
  const authPool = Number(company.totalAuthorizedShares) * 0.15 // ESOP pool typically 15%
  const authPoolPct = (authPool / Number(company.totalAuthorizedShares)) * 100

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <Link href={`/companies/${company.id}`} className="text-sm text-gray-500 hover:text-gray-700">← {company.companyName}</Link>
          <div className="flex items-center justify-between mt-1">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ESOP Tracker</h1>
              <p className="text-sm text-gray-500 mt-0.5">{grants.length} active grants · {employees.length} employees</p>
            </div>
            <button onClick={() => setShowAdd(true)} className="btn btn-primary"><Plus className="w-4 h-4" /> New Grant</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Total Options Granted" value={formatNumber(totalOptions)} icon={Award} color="blue" />
          <StatCard label="Estimated Vested" value={formatNumber(totalVested)} sub="~50% on avg" color="green" />
          <StatCard label="Exercised" value={formatNumber(totalExercised)} color="purple" />
          <StatCard label="ESOP Pool Target" value={`${authPoolPct.toFixed(1)}%`} sub={formatNumber(authPool) + ' shares'} color="amber" />
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">All Option Grants</h2>
          <ESOPTracker grants={grants} shareholders={employees} />
        </div>
      </div>

      {showAdd && <AddGrantModal companyId={company.id} employees={employees} onClose={() => setShowAdd(false)} />}
    </DashboardLayout>
  )
}

function AddGrantModal({ companyId, employees, onClose }: { companyId: string; employees: any[]; onClose: () => void }) {
  const [form, setForm] = useState({
    employeeId: employees[0]?.id || '',
    numOptions: '',
    exercisePrice: '',
    grantDate: new Date().toISOString().split('T')[0],
    vestingStartDate: new Date().toISOString().split('T')[0],
    cliffMonths: '12',
    vestingPeriodMonths: '48',
  })
  const [busy, setBusy] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await api.post<{ optionGrant: any }>('/api/option-grants', { ...form, companyId })
      db.optionGrants.push(res.optionGrant)
      toast.success(`Grant of ${form.numOptions} options added`)
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to add grant')
    } finally { setBusy(false) }
  }
  return (
    <ModalShell title="New Option Grant" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="label">Grantee *</label>
          <select className="input" value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} required>
            <option value="">Select employee</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.roleType})</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Number of Options *" type="number" value={form.numOptions} onChange={v => setForm({ ...form, numOptions: v })} required />
          <Field label="Strike Price (USD) *" type="number" value={form.exercisePrice} onChange={v => setForm({ ...form, exercisePrice: v })} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Grant Date" type="date" value={form.grantDate} onChange={v => setForm({ ...form, grantDate: v })} />
          <Field label="Vesting Start" type="date" value={form.vestingStartDate} onChange={v => setForm({ ...form, vestingStartDate: v })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cliff (months)" type="number" value={form.cliffMonths} onChange={v => setForm({ ...form, cliffMonths: v })} />
          <Field label="Vesting Period (months)" type="number" value={form.vestingPeriodMonths} onChange={v => setForm({ ...form, vestingPeriodMonths: v })} />
        </div>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn btn-secondary flex-1 justify-center">Cancel</button>
          <button type="submit" disabled={busy} className="btn btn-primary flex-1 justify-center disabled:opacity-50">
            {busy ? 'Adding...' : 'Add Grant'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}
