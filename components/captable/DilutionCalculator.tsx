'use client'

import { useState, useEffect, useMemo } from 'react'
import { Calculator, AlertCircle, TrendingDown, TrendingUp, Sparkles } from 'lucide-react'
import type { ShareholderView, ShareholderRole, ShareClass } from '@/lib/types'
import { SHAREHOLDER_ROLE_META, SHARE_CLASS_META } from '@/lib/types'
import { calculateDilutionImpact } from '@/lib/utils/captable'
import { formatCurrency, formatNumber, formatPct } from '@/lib/utils'
import { api } from '@/lib/api-client'
import { toast } from '@/lib/store/toast'

interface Props {
  companyId: string
  shareholders: ShareholderView[]
  authorized: number
  currentValuation?: number
}

export function DilutionCalculator({ companyId, shareholders, authorized, currentValuation = 0 }: Props) {
  const [shares, setShares] = useState(1_000_000)
  const [recipientType, setRecipientType] = useState<ShareholderRole>('vc_investor')
  const [shareClass, setShareClass] = useState<ShareClass>('preferred_a')
  const [pricePerShare, setPricePerShare] = useState(0)
  const [recipientName, setRecipientName] = useState('')
  const [useApi, setUseApi] = useState(false)
  const [apiResult, setApiResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Local preview (instant) — use the same dilution engine the API uses
  const preview = useMemo(() => {
    return calculateDilutionImpact(
      shareholders.map(s => ({ ...s, status: s.status || 'active' }) as any),
      [{ isNew: true, name: recipientName || 'New Recipient', sharesDelta: Number(shares) || 0 }],
    )
  }, [shares, recipientName, shareholders])

  // Optional: also call the API for parity
  useEffect(() => {
    if (!useApi) return
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const r = await api.post<any>(`/api/companies/${companyId}/dilution-preview`, {
          changes: [{ isNew: true, name: recipientName || 'New Recipient', sharesDelta: Number(shares) || 0 }],
        })
        setApiResult(r)
      } catch (e: any) {
        toast.error('Preview failed')
      } finally {
        setLoading(false)
      }
    }, 400)
    return () => clearTimeout(t)
  }, [shares, recipientName, useApi, companyId])

  const newPct = preview.impacts.find(i => i.name === (recipientName || 'New Recipient'))?.pctAfter || 0
  const newTotal = preview.newTotal
  const wouldExceed = newTotal > authorized
  const totalRaise = (Number(shares) || 0) * (Number(pricePerShare) || 0)
  const newValuation = currentValuation + totalRaise

  return (
    <div className="card border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/30">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-brand text-white flex items-center justify-center"><Calculator className="w-4 h-4" /></div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">Dilution Calculator (What-If)</h3>
          <p className="text-xs text-gray-500">Preview impact of issuing new shares without saving</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Inputs */}
        <div className="space-y-3">
          <div>
            <label className="label">How many new shares?</label>
            <input type="number" className="input" value={shares} onChange={e => setShares(Number(e.target.value) || 0)} />
          </div>
          <div>
            <label className="label">Recipient type</label>
            <select className="input" value={recipientType} onChange={e => setRecipientType(e.target.value as ShareholderRole)}>
              {Object.entries(SHAREHOLDER_ROLE_META).map(([k, m]) => <option key={k} value={k}>{m.icon} {m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Share class</label>
            <select className="input" value={shareClass} onChange={e => setShareClass(e.target.value as ShareClass)}>
              {Object.entries(SHARE_CLASS_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Price per share</label>
            <input type="number" className="input" value={pricePerShare} onChange={e => setPricePerShare(Number(e.target.value) || 0)} />
          </div>
          <div>
            <label className="label">Recipient name (optional)</label>
            <input type="text" className="input" placeholder="e.g. Acme Capital" value={recipientName} onChange={e => setRecipientName(e.target.value)} />
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="New Total Shares" value={formatNumber(newTotal)} color="blue" />
            <MiniStat label="New Holder %" value={formatPct(newPct)} color="emerald" />
            <MiniStat label="Total Raise" value={formatCurrency(totalRaise)} color="blue" />
            <MiniStat label="New Valuation" value={formatCurrency(newValuation)} color="purple" />
          </div>
          {wouldExceed && (
            <div className="bg-rose-50 border border-rose-200 rounded p-2.5 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Exceeds authorized by {formatNumber(newTotal - authorized)} shares
            </div>
          )}
          <div className="bg-white border border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto">
            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Impact on Existing Holders</div>
            <div className="space-y-1.5">
              {preview.impacts.filter(i => !i.isNew).sort((a, b) => a.change - b.change).map(i => (
                <div key={i.shareholderId} className="flex items-center justify-between text-xs">
                  <span className="text-gray-700 truncate flex-1">{i.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500 tabular-nums">{formatPct(i.pctBefore)}</span>
                    {i.change < 0 ? <TrendingDown className="w-3 h-3 text-rose-500" /> : i.change > 0 ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : null}
                    <span className={`font-semibold tabular-nums w-14 text-right ${i.change < 0 ? 'text-rose-600' : i.change > 0 ? 'text-emerald-600' : 'text-gray-500'}`}>
                      {formatPct(i.pctAfter)}
                    </span>
                    <span className={`tabular-nums w-14 text-right text-xs ${i.change < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      ({i.change >= 0 ? '+' : ''}{formatPct(i.change)})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Sparkles className="w-3 h-3" />
            <span>Live preview — nothing is saved</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function MiniStat({ label, value, color }: { label: string; value: string; color: 'blue' | 'emerald' | 'purple' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    purple: 'bg-purple-50 text-purple-700',
  }
  return (
    <div className={`rounded-lg p-2.5 ${colors[color]}`}>
      <div className="text-[10px] uppercase tracking-wider opacity-80 mb-0.5">{label}</div>
      <div className="text-lg font-bold tabular-nums">{value}</div>
    </div>
  )
}
