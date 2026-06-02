'use client'

import { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, ArrowRight, Check, User, Briefcase, Shield, ChevronRight, AlertCircle, TrendingDown, TrendingUp } from 'lucide-react'
import { SlideOver, Field, Select, Toggle, Avatar } from '@/components/shared/Modal'
import { COUNTRIES, SHAREHOLDER_ROLE_META, SHARE_CLASS_META } from '@/lib/types'
import type { Shareholder, ShareholderRole, ShareClass, ShareholderRights, VestingSchedule, ShareholderView } from '@/lib/types'
import { calculateDilutionImpact } from '@/lib/utils/captable'
import { formatCurrency, formatNumber, formatPct } from '@/lib/utils'
import { api } from '@/lib/api-client'
import { toast } from '@/lib/store/toast'

interface Props {
  companyId: string
  authorized: number
  currentShareholders: ShareholderView[]
  onClose: () => void
  onSuccess: () => void
}

interface FormState {
  // Step 1
  name: string
  email: string
  phone: string
  roleType: ShareholderRole
  country: string
  // Step 2
  sharesOwned: number
  shareClass: ShareClass
  pricePerShare: number
  dateIssued: string
  // Step 3
  boardSeat: boolean
  votingRights: boolean
  proRataRights: boolean
  antiDilution: boolean
  liquidationPreference: number
  vestingEnabled: boolean
  vestingStartDate: string
  cliffMonths: number
  totalMonths: number
  vestingType: 'monthly' | 'quarterly' | 'annual'
  acceleration: boolean
  notes: string
}

const STEPS = [
  { id: 1, title: 'Personal Info', icon: User },
  { id: 2, title: 'Equity Details', icon: Briefcase },
  { id: 3, title: 'Rights & Confirmation', icon: Shield },
]

export function AddShareholderModal({ companyId, authorized, currentShareholders, onClose, onSuccess }: Props) {
  const [step, setStep] = useState(1)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState<FormState>({
    name: '', email: '', phone: '', roleType: 'employee', country: 'United States',
    sharesOwned: 0, shareClass: 'common', pricePerShare: 0, dateIssued: new Date().toISOString().split('T')[0],
    boardSeat: false, votingRights: true, proRataRights: false, antiDilution: false, liquidationPreference: 1,
    vestingEnabled: false, vestingStartDate: new Date().toISOString().split('T')[0], cliffMonths: 12, totalMonths: 48, vestingType: 'monthly', acceleration: false,
    notes: '',
  })

  // Live dilution preview (re-computed on every form change)
  const preview = useMemo(() => {
    return calculateDilutionImpact(
      currentShareholders.map(s => ({ ...s, status: s.status || 'active' }) as any),
      [{ isNew: true, name: form.name || 'New Shareholder', sharesDelta: Number(form.sharesOwned) || 0 }],
    )
  }, [form.sharesOwned, currentShareholders])

  const newTotal = preview.newTotal
  const newPct = preview.impacts.find(i => i.name === (form.name || 'New Shareholder'))?.pctAfter || 0
  const otherPct = 100 - newPct
  const wouldExceed = newTotal > authorized
  const unissuedRemaining = authorized - preview.oldTotal

  const investmentAmount = (Number(form.sharesOwned) || 0) * (Number(form.pricePerShare) || 0)

  // Step validation
  const stepValid = useMemo(() => {
    if (step === 1) {
      if (!form.name.trim()) return 'Name is required'
      if (!form.email.trim()) return 'Email is required'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Email format is invalid'
      const dup = currentShareholders.find(s => s.email.toLowerCase() === form.email.toLowerCase() && s.status === 'active')
      if (dup) return `${form.email} is already a shareholder of this company`
    }
    if (step === 2) {
      if (form.sharesOwned <= 0) return 'Shares must be a positive number'
      if (form.pricePerShare < 0) return 'Price per share must be ≥ 0'
      if (wouldExceed) return `Cannot issue — only ${unissuedRemaining.toLocaleString()} shares remaining`
    }
    return null
  }, [step, form, currentShareholders, wouldExceed, unissuedRemaining])

  const submit = async () => {
    setBusy(true)
    try {
      const rights: ShareholderRights = {
        boardSeat: form.boardSeat, votingRights: form.votingRights, proRataRights: form.proRataRights,
        antiDilution: form.antiDilution, liquidationPreference: form.liquidationPreference,
      }
      const vesting: VestingSchedule = {
        enabled: form.vestingEnabled, startDate: form.vestingStartDate, cliffMonths: form.cliffMonths,
        totalMonths: form.totalMonths, type: form.vestingType, acceleration: form.acceleration,
      }
      const res = await api.post<{ shareholder: Shareholder; dilutionImpact: any[] }>(`/api/companies/${companyId}/shareholders`, {
        ...form, rights, vesting,
      })
      const affected = (res.dilutionImpact || []).filter((i: any) => i.change < 0 && !i.isNew)
      toast.success(`${form.name} added. All shareholders diluted automatically.`)
      if (affected.length > 0) {
        const first = affected[0]
        toast.info(`${first.name}: ${formatPct(first.pctBefore)} → ${formatPct(first.pctAfter)} (${formatPct(first.change)})`)
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to add shareholder')
    } finally {
      setBusy(false)
    }
  }

  return (
    <SlideOver title="Add New Shareholder" onClose={onClose} width="max-w-2xl">
      <div className="p-6 space-y-6">
        {/* Stepper */}
        <div className="flex items-center gap-2">
          {STEPS.map(s => (
            <div key={s.id} className="flex items-center flex-1">
              <div className={`flex items-center gap-2 ${step >= s.id ? 'text-brand' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step >= s.id ? 'bg-brand text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {step > s.id ? <Check className="w-4 h-4" /> : s.id}
                </div>
                <div className="text-sm font-medium hidden sm:block">{s.title}</div>
              </div>
              {s.id < STEPS.length && <ChevronRight className="w-4 h-4 text-gray-300 mx-1" />}
            </div>
          ))}
        </div>

        {/* Step 1 — Personal Info */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Step 1 of 3 — Personal Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Field label="Full Name" value={form.name} onChange={v => setForm({ ...form, name: v })} required placeholder="Enter full legal name" />
              </div>
              <div className="col-span-2">
                <Field label="Email Address" type="email" value={form.email} onChange={v => setForm({ ...form, email: v })} required placeholder="name@company.com" />
              </div>
              <Field label="Phone Number" value={form.phone} onChange={v => setForm({ ...form, phone: v })} placeholder="+1 555-0000" />
              <Select label="Country" value={form.country} onChange={v => setForm({ ...form, country: v })} required
                options={COUNTRIES.map(c => ({ value: c, label: c }))} />
            </div>
            <Select label="Shareholder Type" value={form.roleType} onChange={v => setForm({ ...form, roleType: v as ShareholderRole })} required
              options={Object.entries(SHAREHOLDER_ROLE_META).map(([k, m]) => ({ value: k, label: `${m.icon}  ${m.label}` }))} />
          </div>
        )}

        {/* Step 2 — Equity Details */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Step 2 of 3 — Equity Details</h3>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Number of Shares" type="number" value={String(form.sharesOwned || '')} onChange={v => setForm({ ...form, sharesOwned: Number(v) || 0 })} required placeholder="e.g. 1,000,000" />
              <Field label="Date of Issuance" type="date" value={form.dateIssued} onChange={v => setForm({ ...form, dateIssued: v })} required />
            </div>

            {/* Live Dilution Preview */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">💡 Live Dilution Preview</div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-gray-600 text-xs">New Total Shares</div>
                  <div className="font-bold text-gray-900 text-lg tabular-nums">{formatNumber(newTotal)}</div>
                </div>
                <div>
                  <div className="text-gray-600 text-xs">This Holder&apos;s %</div>
                  <div className="font-bold text-emerald-600 text-lg tabular-nums">{formatPct(newPct)}</div>
                </div>
                <div>
                  <div className="text-gray-600 text-xs">Others Combined</div>
                  <div className="font-bold text-rose-600 text-lg tabular-nums">{formatPct(otherPct)}</div>
                </div>
              </div>
              {form.sharesOwned > 0 && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="text-xs text-gray-600 mb-2 font-medium">Top 3 affected shareholders:</div>
                  <div className="space-y-1.5">
                    {preview.impacts.filter(i => !i.isNew && i.change < 0).slice(0, 3).map(i => (
                      <div key={i.shareholderId} className="flex items-center justify-between text-xs">
                        <span className="text-gray-700">{i.name}</span>
                        <span className="flex items-center gap-1.5">
                          <span className="text-gray-500 tabular-nums">{formatPct(i.pctBefore)}</span>
                          <TrendingDown className="w-3 h-3 text-rose-500" />
                          <span className="text-rose-600 font-semibold tabular-nums">{formatPct(i.pctAfter)}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {wouldExceed && (
                <div className="mt-3 p-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Not enough authorized shares. Only {formatNumber(unissuedRemaining)} unissued shares remaining.
                </div>
              )}
            </div>

            <Select label="Share Class" value={form.shareClass} onChange={v => setForm({ ...form, shareClass: v as ShareClass })} required
              options={Object.entries(SHARE_CLASS_META).map(([k, m]) => ({ value: k, label: m.label }))} />

            <div className="grid grid-cols-2 gap-3">
              <Field label="Price Per Share" type="number" value={String(form.pricePerShare || '')} onChange={v => setForm({ ...form, pricePerShare: Number(v) || 0 })} required placeholder="0.00" />
              <div>
                <label className="label">Total Investment</label>
                <div className="input bg-gray-50 cursor-default font-semibold text-gray-900">{formatCurrency(investmentAmount)}</div>
                <p className="text-xs text-gray-500 mt-1">Auto: shares × price</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Rights & Confirmation */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Step 3 of 3 — Rights & Confirmation</h3>

            <div className="card !p-4 space-y-1">
              <div className="text-sm font-semibold text-gray-900 mb-2">Shareholder Rights</div>
              <Toggle label="Board Seat" value={form.boardSeat} onChange={v => setForm({ ...form, boardSeat: v })} />
              <Toggle label="Voting Rights" value={form.votingRights} onChange={v => setForm({ ...form, votingRights: v })} />
              <Toggle label="Pro-Rata Rights" value={form.proRataRights} onChange={v => setForm({ ...form, proRataRights: v })} hint="Right to participate in future rounds" />
              <Toggle label="Anti-Dilution Protection" value={form.antiDilution} onChange={v => setForm({ ...form, antiDilution: v })} />
              <div className="pt-2">
                <Select label="Liquidation Preference" value={String(form.liquidationPreference)} onChange={v => setForm({ ...form, liquidationPreference: Number(v) })}
                  options={[{ value: '1', label: '1x (standard)' }, { value: '2', label: '2x' }, { value: '3', label: '3x' }, { value: '0', label: 'None' }]} />
              </div>
            </div>

            {(form.roleType === 'employee' || form.roleType === 'advisor') && (
              <div className="card !p-4 space-y-2">
                <Toggle label="Has Vesting Schedule" value={form.vestingEnabled} onChange={v => setForm({ ...form, vestingEnabled: v })} />
                {form.vestingEnabled && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Field label="Vesting Start Date" type="date" value={form.vestingStartDate} onChange={v => setForm({ ...form, vestingStartDate: v })} />
                    <Select label="Vesting Type" value={form.vestingType} onChange={v => setForm({ ...form, vestingType: v as any })}
                      options={[{ value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'annual', label: 'Annual' }]} />
                    <Field label="Cliff (months)" type="number" value={String(form.cliffMonths)} onChange={v => setForm({ ...form, cliffMonths: Number(v) || 12 })} />
                    <Field label="Total Vesting (months)" type="number" value={String(form.totalMonths)} onChange={v => setForm({ ...form, totalMonths: Number(v) || 48 })} />
                    <div className="col-span-2">
                      <Toggle label="Acceleration Clause" value={form.acceleration} onChange={v => setForm({ ...form, acceleration: v })} hint="Accelerate vesting on change of control" />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="label">Notes</label>
              <textarea className="input min-h-[80px]" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes about this shareholder..." />
            </div>

            {/* Summary card */}
            <div className="card !p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
              <div className="text-sm font-semibold text-emerald-800 mb-3">Summary — Click &quot;Add Shareholder&quot; to confirm</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                <div className="text-gray-600">Name</div><div className="font-medium text-gray-900">{form.name}</div>
                <div className="text-gray-600">Type</div><div className="font-medium text-gray-900">{SHAREHOLDER_ROLE_META[form.roleType].label}</div>
                <div className="text-gray-600">Shares</div><div className="font-medium text-gray-900 tabular-nums">{formatNumber(form.sharesOwned)}</div>
                <div className="text-gray-600">Class</div><div className="font-medium text-gray-900">{SHARE_CLASS_META[form.shareClass].label}</div>
                <div className="text-gray-600">Price/Share</div><div className="font-medium text-gray-900">{formatCurrency(form.pricePerShare)}</div>
                <div className="text-gray-600">Investment</div><div className="font-medium text-gray-900">{formatCurrency(investmentAmount)}</div>
                <div className="text-gray-600">New %</div><div className="font-semibold text-emerald-700">{formatPct(newPct)}</div>
                <div className="text-gray-600">Others</div><div className="font-semibold text-rose-600">Will dilute to {formatPct(otherPct)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Validation error */}
        {stepValid && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {stepValid}
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button onClick={() => step > 1 ? setStep(step - 1) : onClose()} className="btn btn-secondary">
            {step > 1 ? <><ArrowLeft className="w-4 h-4" /> Back</> : 'Cancel'}
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!!stepValid}
              className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={busy || !!stepValid}
              className="btn btn-success disabled:opacity-50"
            >
              <Check className="w-4 h-4" /> {busy ? 'Adding...' : 'Add Shareholder'}
            </button>
          )}
        </div>
      </div>
    </SlideOver>
  )
}
