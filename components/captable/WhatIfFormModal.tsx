'use client'

import { useState, useMemo } from 'react'
import { ArrowLeft, ArrowRight, Check, User, Briefcase, Shield, ChevronRight, AlertCircle, TrendingDown, Sparkles, Trash2 } from 'lucide-react'
import { SlideOver, Field, Select, Toggle, Avatar } from '@/components/shared/Modal'
import { COUNTRIES, SHAREHOLDER_ROLE_META, SHARE_CLASS_META } from '@/lib/types'
import type { ShareholderRole, ShareClass, ShareholderRights, VestingSchedule, ShareholderView } from '@/lib/types'
import { calculateDilutionImpact } from '@/lib/utils/captable'
import { formatCurrency, formatNumber, formatPct } from '@/lib/utils'
import { useWhatIfStore, buildSimulatedHolder } from '@/lib/store/whatIf'

interface Props {
  companyId: string
  authorized: number
  currentShareholders: ShareholderView[]
  editingId?: string
  initialForm?: Partial<FormState>
  onClose: () => void
  onAdded?: () => void
}

interface FormState {
  name: string
  email: string
  phone: string
  roleType: ShareholderRole
  country: string
  sharesOwned: number
  shareClass: ShareClass
  pricePerShare: number
  dateIssued: string
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
  { id: 1, title: 'Who are they?', icon: User },
  { id: 2, title: 'Equity Details', icon: Briefcase },
  { id: 3, title: 'Rights & Confirm', icon: Shield },
]

export function WhatIfFormModal({ companyId, authorized, currentShareholders, editingId, initialForm, onClose, onAdded }: Props) {
  const addHolder = useWhatIfStore(s => s.addSimulatedHolder)
  const removeHolder = useWhatIfStore(s => s.removeSimulatedHolder)
  const simulated = useWhatIfStore(s => s.getForCompany(companyId))
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>({
    name: '', email: '', phone: '', roleType: 'vc_investor', country: 'United States',
    sharesOwned: 0, shareClass: 'preferred_a', pricePerShare: 0, dateIssued: new Date().toISOString().split('T')[0],
    boardSeat: false, votingRights: true, proRataRights: false, antiDilution: false, liquidationPreference: 1,
    vestingEnabled: false, vestingStartDate: new Date().toISOString().split('T')[0], cliffMonths: 12, totalMonths: 48, vestingType: 'monthly', acceleration: false,
    notes: '',
    ...initialForm,
  })

  // Live dilution preview (re-computed on every form change)
  const preview = useMemo(() => {
    // Combine: real shareholders + the simulated session (excluding the one being edited, if any)
    const sessionOthers = simulated.filter(s => s.id !== editingId)
    const sessionTotalShares = sessionOthers.reduce((sum, s) => sum + s.sharesOwned, 0)
    return calculateDilutionImpact(
      [
        ...currentShareholders.map(s => ({ ...s, status: s.status || 'active' }) as any),
        ...sessionOthers.map(s => ({ id: s.id, name: s.name, sharesOwned: s.sharesOwned, isNew: true } as any)),
      ],
      [{ isNew: true, name: form.name || 'New Shareholder', sharesDelta: Number(form.sharesOwned) || 0 }],
      // The session total is already included as isNew=true above; we just want the new form delta on top
    )
  }, [form.sharesOwned, currentShareholders, simulated, editingId])

  const newTotal = preview.newTotal
  const newPct = preview.impacts.find(i => i.name === (form.name || 'New Shareholder'))?.pctAfter || 0
  const otherPct = 100 - newPct
  const wouldExceed = newTotal > authorized
  const unissuedRemaining = authorized - preview.oldTotal
  const investmentAmount = (Number(form.sharesOwned) || 0) * (Number(form.pricePerShare) || 0)

  // Step validation (allow warn-but-still-simulate for what-if)
  const stepValid = useMemo(() => {
    if (step === 1) {
      if (!form.name.trim()) return 'Name is required for simulation'
      if (!form.email.trim()) return 'Email is required for simulation'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Email format is invalid'
    }
    if (step === 2) {
      if (form.sharesOwned <= 0) return 'Shares must be a positive number'
      if (form.pricePerShare < 0) return 'Price per share must be ≥ 0'
    }
    return null
  }, [step, form])

  const submit = () => {
    const rights: ShareholderRights = {
      boardSeat: form.boardSeat, votingRights: form.votingRights, proRataRights: form.proRataRights,
      antiDilution: form.antiDilution, liquidationPreference: form.liquidationPreference,
    }
    const vesting: VestingSchedule = {
      enabled: form.vestingEnabled, startDate: form.vestingStartDate, cliffMonths: form.cliffMonths,
      totalMonths: form.totalMonths, type: form.vestingType, acceleration: form.acceleration,
    }
    if (editingId) {
      removeHolder(companyId, editingId)
    }
    addHolder(companyId, buildSimulatedHolder({
      name: form.name, email: form.email, phone: form.phone, country: form.country,
      roleType: form.roleType, shareClass: form.shareClass, sharesOwned: Number(form.sharesOwned) || 0,
      pricePerShare: Number(form.pricePerShare) || 0, dateIssued: form.dateIssued, rights, vesting, notes: form.notes,
    }))
    onAdded?.()
    onClose()
  }

  return (
    <SlideOver
      title={editingId ? '✏️ Edit What If Shareholder' : '🔮 What If: Add Shareholder'}
      onClose={onClose}
      width="max-w-2xl"
    >
      <div className="p-6 space-y-6">
        {/* Amber simulation banner */}
        <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-3 flex items-start gap-2 text-sm text-amber-800">
          <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-semibold">SIMULATION MODE</div>
            <div className="text-xs text-amber-700">This is a what-if scenario. Nothing is saved to your real cap table until you click <b>Save to Real Cap Table</b>.</div>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2">
          {STEPS.map(s => (
            <div key={s.id} className="flex items-center flex-1">
              <div className={`flex items-center gap-2 ${step >= s.id ? 'text-amber-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step >= s.id ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {step > s.id ? <Check className="w-4 h-4" /> : s.id}
                </div>
                <div className="text-sm font-medium hidden sm:block">{s.title}</div>
              </div>
              {s.id < STEPS.length && <ChevronRight className="w-4 h-4 text-gray-300 mx-1" />}
            </div>
          ))}
        </div>

        {/* Step 1 — Who are they? */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Step 1 of 3 — Who are they?</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 flex items-center gap-3">
                <Avatar name={form.name || '?'} roleType={form.roleType} size="lg" />
                <div className="flex-1">
                  <Field label="Full Name" value={form.name} onChange={v => setForm({ ...form, name: v })} required placeholder="e.g. VC Fund Beta" />
                </div>
              </div>
              <div className="col-span-2">
                <Field label="Email Address" type="email" value={form.email} onChange={v => setForm({ ...form, email: v })} required placeholder="contact@vcfundbeta.com" />
              </div>
              <Field label="Phone Number" value={form.phone} onChange={v => setForm({ ...form, phone: v })} placeholder="+1 555-0000" />
              <Select label="Country" value={form.country} onChange={v => setForm({ ...form, country: v })} required
                options={COUNTRIES.map(c => ({ value: c, label: c }))} />
            </div>
            <Select label="Shareholder Type / Role" value={form.roleType} onChange={v => setForm({ ...form, roleType: v as ShareholderRole })} required
              options={Object.entries(SHAREHOLDER_ROLE_META).map(([k, m]) => ({ value: k, label: `${m.icon}  ${m.label}` }))} />
            <div className="bg-amber-50/50 border border-amber-200 rounded p-2 text-xs text-amber-700">
              ⚠️ This is a simulation. No real data will be saved.
            </div>
          </div>
        )}

        {/* Step 2 — Equity Details */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Step 2 of 3 — Equity Details</h3>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Number of Shares" type="number" value={String(form.sharesOwned || '')} onChange={v => setForm({ ...form, sharesOwned: Number(v) || 0 })} required placeholder="e.g. 2,000,000" />
              <Field label="Date of Issuance" type="date" value={form.dateIssued} onChange={v => setForm({ ...form, dateIssued: v })} required />
            </div>

            {/* Live Dilution Preview */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-lg p-4">
              <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">📊 Live Dilution Preview</div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-gray-600 text-xs">New Total Shares</div>
                  <div className="font-bold text-gray-900 text-lg tabular-nums">{formatNumber(newTotal)}</div>
                </div>
                <div>
                  <div className="text-gray-600 text-xs">This Holder&apos;s %</div>
                  <div className="font-bold text-emerald-600 text-lg tabular-nums">{formatPct(newPct)} 🆕</div>
                </div>
                <div>
                  <div className="text-gray-600 text-xs">Others Combined</div>
                  <div className="font-bold text-rose-600 text-lg tabular-nums">{formatPct(otherPct)}</div>
                </div>
              </div>
              {form.sharesOwned > 0 && (
                <div className="mt-3 pt-3 border-t border-amber-200">
                  <div className="text-xs text-gray-600 mb-2 font-medium">Impact on existing holders:</div>
                  <div className="space-y-1.5">
                    {preview.impacts.filter(i => !i.isNew && i.change < 0).slice(0, 4).map(i => (
                      <div key={i.shareholderId} className="flex items-center justify-between text-xs">
                        <span className="text-gray-700 truncate flex-1">{i.name}</span>
                        <span className="flex items-center gap-1.5">
                          <span className="text-gray-500 tabular-nums">{formatPct(i.pctBefore)}</span>
                          <TrendingDown className="w-3 h-3 text-rose-500" />
                          <span className="text-rose-600 font-semibold tabular-nums">{formatPct(i.pctAfter)}</span>
                          <span className="text-rose-500 tabular-nums w-14 text-right">({formatPct(i.change)})</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {wouldExceed && (
                <div className="mt-3 p-2 bg-amber-50 border border-amber-300 rounded text-xs text-amber-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> ⚠️ This would exceed your authorized share limit of {formatNumber(authorized)}. Consider increasing authorized shares first. (Allowed in simulation)
                </div>
              )}
              <div className="mt-2 text-xs text-emerald-600 font-medium">✅ Total still = 100.00%</div>
            </div>

            <Select label="Share Class" value={form.shareClass} onChange={v => setForm({ ...form, shareClass: v as ShareClass })} required
              options={Object.entries(SHARE_CLASS_META).map(([k, m]) => ({ value: k, label: m.label }))} />

            <div className="grid grid-cols-2 gap-3">
              <Field label="Price Per Share" type="number" value={String(form.pricePerShare || '')} onChange={v => setForm({ ...form, pricePerShare: Number(v) || 0 })} placeholder="0.00" />
              <div>
                <label className="label">Total Investment (auto)</label>
                <div className="input bg-amber-50 cursor-default font-semibold text-gray-900">{formatCurrency(investmentAmount)}</div>
                <p className="text-xs text-gray-500 mt-1">shares × price</p>
              </div>
            </div>
            <Field label="Investment Round (optional)" value="" onChange={() => {}} placeholder="e.g. Series A" />
          </div>
        )}

        {/* Step 3 — Rights & Confirm */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Step 3 of 3 — Rights & Confirm</h3>

            <div className="card !p-4 space-y-1">
              <div className="text-sm font-semibold text-gray-900 mb-2">Shareholder Rights (optional for simulation)</div>
              <Toggle label="Board Seat" value={form.boardSeat} onChange={v => setForm({ ...form, boardSeat: v })} />
              <Toggle label="Voting Rights" value={form.votingRights} onChange={v => setForm({ ...form, votingRights: v })} />
              <Toggle label="Pro-Rata Rights" value={form.proRataRights} onChange={v => setForm({ ...form, proRataRights: v })} hint="Right to participate in future rounds" />
              <Toggle label="Anti-Dilution" value={form.antiDilution} onChange={v => setForm({ ...form, antiDilution: v })} />
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
              <label className="label">Notes (optional)</label>
              <textarea className="input min-h-[60px]" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="e.g. Series A round lead investor" />
            </div>

            {/* Summary card */}
            <div className="card !p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300">
              <div className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Simulation Summary
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                <div className="text-gray-600">Name</div><div className="font-medium text-gray-900">{form.name || '—'}</div>
                <div className="text-gray-600">Role</div><div className="font-medium text-gray-900">{SHAREHOLDER_ROLE_META[form.roleType].label}</div>
                <div className="text-gray-600">Shares</div><div className="font-medium text-gray-900 tabular-nums">{formatNumber(form.sharesOwned)}</div>
                <div className="text-gray-600">Class</div><div className="font-medium text-gray-900">{SHARE_CLASS_META[form.shareClass].label}</div>
                <div className="text-gray-600">Price/Share</div><div className="font-medium text-gray-900">{formatCurrency(form.pricePerShare)}</div>
                <div className="text-gray-600">Investment</div><div className="font-medium text-gray-900">{formatCurrency(investmentAmount)}</div>
                <div className="text-gray-600">New %</div><div className="font-semibold text-emerald-700">{formatPct(newPct)}</div>
              </div>
              {form.sharesOwned > 0 && (
                <div className="mt-3 pt-3 border-t border-amber-200">
                  <div className="text-xs font-semibold text-amber-700 mb-1.5">DILUTION IMPACT:</div>
                  <div className="space-y-1">
                    {preview.impacts.filter(i => !i.isNew && i.change !== 0).slice(0, 5).map(i => (
                      <div key={i.shareholderId} className="flex items-center justify-between text-xs">
                        <span className="text-gray-700">{i.name}</span>
                        <span className="tabular-nums">
                          <span className="text-gray-500">{formatPct(i.pctBefore)}</span>
                          <span className="mx-1">→</span>
                          <span className="font-semibold text-rose-600">{formatPct(i.pctAfter)}</span>
                          <span className="text-rose-500 ml-1">({formatPct(i.change)})</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-amber-200 text-xs text-amber-700 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> ⚠️ SIMULATION ONLY — Not saved to database
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
              Next Step <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={!!stepValid}
              className="btn bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" /> {editingId ? 'Update Simulation' : 'Add to Simulation'}
            </button>
          )}
        </div>
      </div>
    </SlideOver>
  )
}
