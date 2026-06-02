'use client'

import { useState, useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import {
  Plus, Sparkles, Trash2, RotateCcw, Save, Download, AlertCircle, TrendingDown, TrendingUp,
  CheckCircle2, User, Briefcase, Shield
} from 'lucide-react'
import { ModalShell } from '@/components/shared/Modal'
import { useWhatIfStore, type SimulatedShareholder } from '@/lib/store/whatIf'
import { SHAREHOLDER_ROLE_META, SHARE_CLASS_META } from '@/lib/types'
import type { ShareholderView, ShareholderRole } from '@/lib/types'
import { calculateDilutionImpact, colorForRole } from '@/lib/utils/captable'
import { formatNumber, formatPct, formatCurrency } from '@/lib/utils'
import { api } from '@/lib/api-client'
import { toast } from '@/lib/store/toast'
import { useRouter } from 'next/navigation'
import { WhatIfFormModal } from './WhatIfFormModal'

interface Props {
  companyId: string
  companyName: string
  shareholders: ShareholderView[]
  authorized: number
}

export function WhatIfSimulator({ companyId, companyName, shareholders, authorized }: Props) {
  const router = useRouter()
  const simulated = useWhatIfStore(s => s.getForCompany(companyId))
  const addHolder = useWhatIfStore(s => s.addSimulatedHolder)
  const removeHolder = useWhatIfStore(s => s.removeSimulatedHolder)
  const resetSimulation = useWhatIfStore(s => s.resetSimulation)

  const [showForm, setShowForm] = useState(false)
  const [editingSim, setEditingSim] = useState<SimulatedShareholder | null>(null)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // Real (current) totals
  const realTotal = useMemo(
    () => shareholders.reduce((sum, s) => sum + (s.status === 'active' ? s.sharesOwned : 0), 0),
    [shareholders]
  )

  // Projected: real + simulated combined into a single dilution calc
  const projection = useMemo(() => {
    const realHolders = shareholders
      .filter(s => s.status === 'active')
      .map(s => ({ ...s, status: s.status || 'active' }) as any)
    const sessionSumShares = simulated.reduce((sum, s) => sum + s.sharesOwned, 0)
    // The session simulated holders are passed in as existing + we ask to add a 0-share delta so the engine reports their current %
    // Simpler: compute projected % directly.
    const projectedTotal = realTotal + sessionSumShares
    const rows = [
      ...shareholders.filter(s => s.status === 'active').map(s => ({
        id: s.id, name: s.name, roleType: s.roleType, shareClass: s.shareClass,
        sharesOwned: s.sharesOwned, isReal: true, isSimulated: false,
        oldPct: realTotal > 0 ? (s.sharesOwned / realTotal) * 100 : 0,
        newPct: projectedTotal > 0 ? (s.sharesOwned / projectedTotal) * 100 : 0,
      })),
      ...simulated.map(s => ({
        id: s.id, name: s.name, roleType: s.roleType, shareClass: s.shareClass,
        sharesOwned: s.sharesOwned, isReal: false, isSimulated: true,
        oldPct: 0,
        newPct: projectedTotal > 0 ? (s.sharesOwned / projectedTotal) * 100 : 0,
      })),
    ]
    // Also compute top-3 affected (so we can show impact summary)
    const impacts = calculateDilutionImpact(
      realHolders,
      simulated.map(s => ({ isNew: true, name: s.name, sharesDelta: s.sharesOwned })),
    )
    return { rows, projectedTotal, realTotal, sessionSumShares, impacts }
  }, [shareholders, simulated, realTotal])

  const projectedTotal = projection.projectedTotal
  const wouldExceed = projectedTotal > authorized

  // Pie data
  const realPieData = shareholders
    .filter(s => s.status === 'active')
    .map(s => ({ name: s.name, value: s.sharesOwned, roleType: s.roleType as ShareholderRole, isSimulated: false }))

  const projectedPieData = [
    ...realPieData,
    ...simulated.map(s => ({ name: '🔮 ' + s.name, value: s.sharesOwned, roleType: s.roleType, isSimulated: true })),
  ]

  // For "Save to Real" — convert simulated to API payload
  const handleSaveAllToReal = async () => {
    if (simulated.length === 0) return
    setSaving(true)
    try {
      for (const s of simulated) {
        await api.post(`/api/companies/${companyId}/shareholders`, {
          name: s.name, email: s.email, phone: s.phone, country: s.country, roleType: s.roleType,
          shareClass: s.shareClass, sharesOwned: s.sharesOwned, pricePerShare: s.pricePerShare,
          dateIssued: s.dateIssued, rights: s.rights, vesting: s.vesting, notes: s.notes,
        })
      }
      toast.success(`✅ ${simulated.length} shareholder${simulated.length === 1 ? '' : 's'} added to your real cap table!`)
      resetSimulation(companyId)
      setShowSaveConfirm(false)
      router.push(`/companies/${companyId}/captable`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save some shareholders')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    resetSimulation(companyId)
    setShowResetConfirm(false)
    toast.info('🔄 Simulation reset')
  }

  // Custom CSV export for the projection
  const exportCsv = () => {
    const header = ['Name', 'Role', 'Class', 'Shares', 'Current %', 'Projected %', 'Change %', 'Status']
    const rows = projection.rows.map(r => [
      r.isSimulated ? '🔮 ' + r.name : r.name,
      SHAREHOLDER_ROLE_META[r.roleType as ShareholderRole]?.label || r.roleType,
      SHARE_CLASS_META[r.shareClass as keyof typeof SHARE_CLASS_META]?.label || r.shareClass,
      r.sharesOwned.toString(),
      r.oldPct.toFixed(2),
      r.newPct.toFixed(2),
      (r.newPct - r.oldPct).toFixed(2),
      r.isSimulated ? 'SIMULATED' : 'REAL',
    ])
    const csv = [header, ...rows].map(row => row.map(c => `"${(c || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${companyName}-whatif-projection-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('📤 Projection exported as CSV')
  }

  return (
    <div className="space-y-6">
      {/* Simulation mode banner */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-amber-900">🔮 SIMULATION MODE — Changes are not saved</div>
          <div className="text-sm text-amber-700 mt-0.5">
            See how new shareholders affect ownership. Nothing is saved to your real cap table until you click <b>Save to Real Cap Table</b> at the bottom.
          </div>
        </div>
      </div>

      {/* CURRENT (Real) Cap Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-gray-900">CURRENT CAP TABLE (Real Data — Read Only)</h2>
            <p className="text-xs text-gray-500 mt-0.5">{formatNumber(realTotal)} shares issued of {formatNumber(authorized)} authorized</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase border-b">
                <th className="py-2 pr-2">Name</th>
                <th className="py-2 pr-2">Type</th>
                <th className="py-2 pr-2 text-right">Shares</th>
                <th className="py-2 pr-2 text-right">%</th>
                <th className="py-2 pr-2">Class</th>
              </tr>
            </thead>
            <tbody>
              {shareholders.filter(s => s.status === 'active').map(s => (
                <tr key={s.id} className="border-b border-gray-50">
                  <td className="py-2 pr-2 font-medium text-gray-900">{s.name}</td>
                  <td className="py-2 pr-2 text-gray-600">{SHAREHOLDER_ROLE_META[s.roleType as ShareholderRole]?.icon} {SHAREHOLDER_ROLE_META[s.roleType as ShareholderRole]?.label}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{formatNumber(s.sharesOwned)}</td>
                  <td className="py-2 pr-2 text-right tabular-nums font-semibold">{formatPct(s.ownershipPct)}</td>
                  <td className="py-2 pr-2 text-gray-600">{SHARE_CLASS_META[s.shareClass as keyof typeof SHARE_CLASS_META]?.label}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-200 font-bold text-gray-900">
                <td className="py-2 pr-2">TOTAL</td>
                <td></td>
                <td className="py-2 pr-2 text-right tabular-nums">{formatNumber(realTotal)}</td>
                <td className="py-2 pr-2 text-right tabular-nums">100.00%</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Add button */}
      <div className="flex justify-center">
        <button
          onClick={() => { setEditingSim(null); setShowForm(true) }}
          className="bg-brand hover:bg-brand-dark text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add What If Shareholder</span>
          <span className="text-xs opacity-80 ml-1">— Simulate a new investor or holder</span>
        </button>
      </div>

      {/* Simulated Shareholders list */}
      {simulated.length > 0 && (
        <div className="card border-2 border-amber-200 bg-amber-50/30">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold text-amber-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Simulated Shareholders (in this session)
              </h2>
              <p className="text-xs text-amber-700 mt-0.5">{simulated.length} addition{simulated.length === 1 ? '' : 's'} · {formatNumber(projection.sessionSumShares)} shares</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowResetConfirm(true)} className="btn btn-secondary text-xs">
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
              <button onClick={() => { setEditingSim(null); setShowForm(true) }} className="btn bg-amber-500 hover:bg-amber-600 text-white text-xs">
                <Plus className="w-3.5 h-3.5" /> Add Another
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-amber-700 uppercase border-b border-amber-200">
                  <th className="py-2 pr-2">Name</th>
                  <th className="py-2 pr-2">Type</th>
                  <th className="py-2 pr-2">Class</th>
                  <th className="py-2 pr-2 text-right">Shares</th>
                  <th className="py-2 pr-2 text-right">Investment</th>
                  <th className="py-2 pr-2 text-right">Projected %</th>
                  <th className="py-2 pr-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {simulated.map(s => {
                  const newPct = projectedTotal > 0 ? (s.sharesOwned / projectedTotal) * 100 : 0
                  return (
                    <tr key={s.id} className="border-b border-amber-200/50 border-dashed bg-amber-50/50">
                      <td className="py-2 pr-2 font-medium text-amber-900">
                        <span className="inline-flex items-center gap-1.5">
                          🔮 {s.name}
                          <span className="text-[10px] uppercase font-semibold bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded">Simulated</span>
                        </span>
                      </td>
                      <td className="py-2 pr-2 text-amber-800">{SHAREHOLDER_ROLE_META[s.roleType]?.icon} {SHAREHOLDER_ROLE_META[s.roleType]?.label}</td>
                      <td className="py-2 pr-2 text-amber-800">{SHARE_CLASS_META[s.shareClass]?.label}</td>
                      <td className="py-2 pr-2 text-right tabular-nums font-semibold text-amber-900">{formatNumber(s.sharesOwned)}</td>
                      <td className="py-2 pr-2 text-right tabular-nums text-amber-900">{formatCurrency(s.investmentAmount)}</td>
                      <td className="py-2 pr-2 text-right tabular-nums font-bold text-emerald-700">{formatPct(newPct)}</td>
                      <td className="py-2 pr-2 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => { setEditingSim(s); setShowForm(true) }}
                            className="text-amber-700 hover:text-amber-900 p-1 rounded hover:bg-amber-100"
                            title="Edit"
                          >✏️</button>
                          <button
                            onClick={() => { removeHolder(companyId, s.id); toast.info('Removed from simulation') }}
                            className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50"
                            title="Remove"
                          ><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Projected Cap Table (After Simulation) */}
      <div className="card border-2 border-blue-200 bg-gradient-to-br from-blue-50/30 to-indigo-50/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              📊 Projected Cap Table (After Simulation)
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Live preview · {formatNumber(projectedTotal)} shares total</p>
          </div>
        </div>
        {wouldExceed && (
          <div className="mb-3 p-2.5 bg-amber-50 border border-amber-300 rounded text-xs text-amber-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> ⚠️ Projected total {formatNumber(projectedTotal)} exceeds authorized {formatNumber(authorized)} by {formatNumber(projectedTotal - authorized)} shares. Increase authorized shares before saving.
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase border-b">
                <th className="py-2 pr-2">Name</th>
                <th className="py-2 pr-2">Type</th>
                <th className="py-2 pr-2 text-right">Shares</th>
                <th className="py-2 pr-2 text-right">Old %</th>
                <th className="py-2 pr-2 text-right">Projected %</th>
                <th className="py-2 pr-2 text-right">Change</th>
              </tr>
            </thead>
            <tbody>
              {projection.rows.map(r => {
                const change = r.newPct - r.oldPct
                return (
                  <tr key={r.id} className={`border-b border-gray-100 ${r.isSimulated ? 'border-dashed border-amber-300 bg-amber-50/40' : ''}`}>
                    <td className="py-2 pr-2 font-medium text-gray-900">
                      {r.isSimulated && '🔮 '}{r.name}
                    </td>
                    <td className="py-2 pr-2 text-gray-600">{SHAREHOLDER_ROLE_META[r.roleType as ShareholderRole]?.icon} {SHAREHOLDER_ROLE_META[r.roleType as ShareholderRole]?.label}</td>
                    <td className="py-2 pr-2 text-right tabular-nums">{formatNumber(r.sharesOwned)}</td>
                    <td className="py-2 pr-2 text-right tabular-nums text-gray-500 line-through">{r.isSimulated ? '—' : formatPct(r.oldPct)}</td>
                    <td className="py-2 pr-2 text-right tabular-nums font-bold text-blue-700">{formatPct(r.newPct)}</td>
                    <td className="py-2 pr-2 text-right tabular-nums">
                      {r.isSimulated ? (
                        <span className="text-emerald-600 font-semibold">+{formatPct(r.newPct)} 🆕</span>
                      ) : change === 0 ? (
                        <span className="text-gray-400">0.00%</span>
                      ) : change < 0 ? (
                        <span className="text-rose-600 font-semibold flex items-center justify-end gap-0.5">
                          <TrendingDown className="w-3 h-3" /> {formatPct(change)}%
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-semibold flex items-center justify-end gap-0.5">
                          <TrendingUp className="w-3 h-3" /> +{formatPct(change)}%
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
              <tr className="border-t-2 border-gray-200 font-bold text-gray-900 bg-gray-50">
                <td className="py-2 pr-2">TOTAL</td>
                <td></td>
                <td className="py-2 pr-2 text-right tabular-nums">{formatNumber(projectedTotal)}</td>
                <td className="py-2 pr-2 text-right tabular-nums">100.00%</td>
                <td className="py-2 pr-2 text-right tabular-nums">100.00%</td>
                <td className="py-2 pr-2 text-right tabular-nums">✅</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Before vs After Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-2 text-sm flex items-center gap-2">
            🥧 CURRENT (Real) — {formatNumber(realTotal)} shares
          </h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={realPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e: any) => `${e.name}: ${(e.percent * 100).toFixed(1)}%`} labelLine={false}>
                  {realPieData.map((entry, i) => (
                    <Cell key={i} fill={colorForRole(entry.roleType)} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => formatNumber(Number(v)) + ' shares'} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card border-2 border-amber-200 bg-amber-50/20">
          <h3 className="font-semibold text-amber-900 mb-2 text-sm flex items-center gap-2">
            🔮 PROJECTED (Simulation) — {formatNumber(projectedTotal)} shares
          </h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={projectedPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e: any) => `${e.name}: ${(e.percent * 100).toFixed(1)}%`} labelLine={false}>
                  {projectedPieData.map((entry, i) => (
                    <Cell key={i} fill={entry.isSimulated ? '#F59E0B' : colorForRole(entry.roleType)} stroke={entry.isSimulated ? '#D97706' : 'none'} strokeWidth={entry.isSimulated ? 2 : 0} strokeDasharray={entry.isSimulated ? '4 2' : '0'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => formatNumber(Number(v)) + ' shares'} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-xs text-amber-700 mt-2">🔮 = simulated (dashed amber border)</div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-semibold text-gray-900">Ready to commit?</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {simulated.length === 0
                ? 'No simulated shareholders yet. Click "Add What If Shareholder" above to start.'
                : `${simulated.length} simulated shareholder${simulated.length === 1 ? '' : 's'} will be added to your real cap table.`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={exportCsv} disabled={simulated.length === 0} className="btn btn-secondary">
              <Download className="w-4 h-4" /> Export Projection
            </button>
            <button onClick={() => setShowResetConfirm(true)} disabled={simulated.length === 0} className="btn btn-secondary">
              <RotateCcw className="w-4 h-4" /> Reset Simulation
            </button>
            <button
              onClick={() => setShowSaveConfirm(true)}
              disabled={simulated.length === 0 || wouldExceed}
              className="btn btn-success disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> Save to Real Cap Table
            </button>
          </div>
        </div>
      </div>

      {/* The form modal */}
      {showForm && (
        <WhatIfFormModal
          companyId={companyId}
          authorized={authorized}
          currentShareholders={shareholders}
          editingId={editingSim?.id}
          initialForm={editingSim ? {
            name: editingSim.name, email: editingSim.email, phone: editingSim.phone,
            country: editingSim.country, roleType: editingSim.roleType, shareClass: editingSim.shareClass,
            sharesOwned: editingSim.sharesOwned, pricePerShare: editingSim.pricePerShare, dateIssued: editingSim.dateIssued,
            boardSeat: editingSim.rights.boardSeat, votingRights: editingSim.rights.votingRights,
            proRataRights: editingSim.rights.proRataRights, antiDilution: editingSim.rights.antiDilution,
            liquidationPreference: editingSim.rights.liquidationPreference,
            vestingEnabled: editingSim.vesting.enabled, vestingStartDate: editingSim.vesting.startDate || new Date().toISOString().split('T')[0],
            cliffMonths: editingSim.vesting.cliffMonths, totalMonths: editingSim.vesting.totalMonths,
            vestingType: editingSim.vesting.type, acceleration: editingSim.vesting.acceleration,
            notes: editingSim.notes,
          } : undefined}
          onClose={() => { setShowForm(false); setEditingSim(null) }}
        />
      )}

      {/* Save confirmation modal */}
      {showSaveConfirm && (
        <ModalShell title="⚠️ Save to Real Cap Table?" onClose={() => setShowSaveConfirm(false)} size="lg" icon={<Save className="w-5 h-5 text-emerald-600" />}>
          <div className="space-y-3 text-sm">
            <div className="bg-rose-50 border border-rose-200 rounded p-3 text-rose-700">
              You are about to add <b>{simulated.length}</b> shareholder{simulated.length === 1 ? '' : 's'} to your <b>REAL</b> cap table. This cannot be undone.
            </div>
            <div>
              <div className="font-semibold text-gray-900 mb-1">Shareholders to be added:</div>
              <ul className="space-y-1">
                {simulated.map(s => (
                  <li key={s.id} className="flex items-center gap-2 text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    🔮 <b>{s.name}</b> — {formatNumber(s.sharesOwned)} shares ({SHARE_CLASS_META[s.shareClass]?.label})
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="font-semibold text-gray-900 mb-1">Dilution of existing holders:</div>
              <ul className="space-y-1 text-xs">
                {projection.rows.filter(r => !r.isSimulated && r.newPct !== r.oldPct).map(r => (
                  <li key={r.id} className="flex items-center gap-2 text-gray-700">
                    {r.name}: {formatPct(r.oldPct)} → <b className="text-rose-600">{formatPct(r.newPct)}</b>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setShowSaveConfirm(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={handleSaveAllToReal} disabled={saving} className="btn btn-success">
              {saving ? 'Saving…' : '✅ Yes, Save to Cap Table'}
            </button>
          </div>
        </ModalShell>
      )}

      {/* Reset confirmation modal */}
      {showResetConfirm && (
        <ModalShell title="🔄 Reset Simulation?" onClose={() => setShowResetConfirm(false)} size="sm" icon={<RotateCcw className="w-5 h-5 text-amber-600" />}>
          <p className="text-sm text-gray-700">
            All <b>{simulated.length}</b> simulated shareholder{simulated.length === 1 ? '' : 's'} will be cleared. The projected cap table will revert to the real one. Your real database is not affected.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowResetConfirm(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={handleReset} className="btn bg-amber-500 hover:bg-amber-600 text-white">
              <RotateCcw className="w-4 h-4" /> Reset Simulation
            </button>
          </div>
        </ModalShell>
      )}
    </div>
  )
}
