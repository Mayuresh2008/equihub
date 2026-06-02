'use client'

import { useState, useMemo } from 'react'
import { ArrowRightLeft, AlertCircle, Check } from 'lucide-react'
import { SlideOver, Field, Select } from '@/components/shared/Modal'
import type { ShareholderView, Shareholder } from '@/lib/types'
import { validateTransfer, previewTransfer } from '@/lib/utils/captable'
import { formatNumber, formatPct, formatCurrency, formatDate } from '@/lib/utils'
import { api } from '@/lib/api-client'
import { toast } from '@/lib/store/toast'

interface Props {
  companyId: string
  from: ShareholderView
  shareholders: ShareholderView[]
  onClose: () => void
  onSuccess: () => void
}

export function TransferSharesModal({ companyId, from, shareholders, onClose, onSuccess }: Props) {
  const [toId, setToId] = useState<string>('')
  const [numShares, setNumShares] = useState<number>(0)
  const [pricePerShare, setPricePerShare] = useState<number>(from.pricePerShare)
  const [transferDate, setTransferDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [reason, setReason] = useState<string>('')
  const [busy, setBusy] = useState(false)

  const eligibleDestinations = shareholders.filter(s => s.id !== from.id && s.status === 'active')

  const to = shareholders.find(s => s.id === toId)
  const errors = useMemo(() => validateTransfer(
    from as any, to as any, numShares, transferDate,
  ), [from, to, numShares, transferDate])

  const preview = useMemo(() => {
    if (!to || errors.length > 0 || numShares <= 0) return null
    return previewTransfer(from as any, to as any, numShares, shareholders as any)
  }, [to, numShares, errors, from, to, shareholders])

  const submit = async () => {
    if (errors.length > 0) {
      toast.error(errors[0].message)
      return
    }
    setBusy(true)
    try {
      await api.post(`/api/companies/${companyId}/shareholders/${from.id}/transfer`, {
        toShareholderId: toId, numShares, pricePerShare, transferDate, reason,
      })
      toast.success(`${formatNumber(numShares)} shares transferred from ${from.name} to ${to!.name}`)
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Transfer failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <SlideOver title="Transfer Shares" onClose={onClose} width="max-w-xl">
      <div className="p-6 space-y-5">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
          <div className="text-xs text-blue-700 uppercase tracking-wider font-semibold mb-1">From</div>
          <div className="font-semibold text-gray-900">{from.name}</div>
          <div className="text-xs text-gray-600">Currently holds {formatNumber(from.sharesOwned)} shares · {formatPct(from.ownershipPct)}</div>
        </div>

        <Field label="Number of Shares to Transfer" type="number" value={String(numShares || '')} onChange={v => setNumShares(Number(v) || 0)} required placeholder="e.g. 100,000" error={errors.find(e => e.field === 'numShares')?.message} hint={`Max: ${formatNumber(from.sharesOwned)}`} />
        <Select label="Transfer To" value={toId} onChange={setToId} required
          options={[{ value: '', label: 'Select recipient…' }, ...eligibleDestinations.map(s => ({ value: s.id, label: `${s.name} (${formatNumber(s.sharesOwned)} shares)` }))]}
          error={errors.find(e => e.field === 'to')?.message} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Price per Share" type="number" value={String(pricePerShare || '')} onChange={v => setPricePerShare(Number(v) || 0)} />
          <Field label="Transfer Date" type="date" value={transferDate} onChange={setTransferDate} required error={errors.find(e => e.field === 'transferDate')?.message} />
        </div>
        <div>
          <label className="label">Reason for Transfer (optional)</label>
          <textarea className="input min-h-[60px]" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Internal reallocation, secondary sale..." />
        </div>

        {preview && (
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-4">
            <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-3">Preview · Impact After Transfer</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-gray-600 mb-1 font-medium">From: {from.name}</div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500 tabular-nums">{formatNumber(preview.fromBefore.shares)}</span>
                  <ArrowRightLeft className="w-3 h-3 text-rose-500" />
                  <span className="font-semibold text-rose-700 tabular-nums">{formatNumber(preview.fromAfter.shares)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs mt-1">
                  <span className="text-gray-500 tabular-nums">{formatPct(preview.fromBefore.pct)}</span>
                  <span>→</span>
                  <span className="font-semibold text-rose-600 tabular-nums">{formatPct(preview.fromAfter.pct)}</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1 font-medium">To: {to!.name}</div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500 tabular-nums">{formatNumber(preview.toBefore.shares)}</span>
                  <ArrowRightLeft className="w-3 h-3 text-emerald-500" />
                  <span className="font-semibold text-emerald-700 tabular-nums">{formatNumber(preview.toAfter.shares)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs mt-1">
                  <span className="text-gray-500 tabular-nums">{formatPct(preview.toBefore.pct)}</span>
                  <span>→</span>
                  <span className="font-semibold text-emerald-600 tabular-nums">{formatPct(preview.toAfter.pct)}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-emerald-200 text-xs text-gray-700 flex items-center justify-between">
              <span>Total Issued: {formatNumber(preview.totalBefore)} → {formatNumber(preview.totalAfter)} (unchanged)</span>
              <span className="font-semibold text-emerald-700">Total: {formatCurrency(numShares * pricePerShare)}</span>
            </div>
          </div>
        )}

        {errors.length > 0 && !preview && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-700 space-y-1">
            {errors.map((e, i) => <div key={i} className="flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {e.message}</div>)}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button onClick={submit} disabled={busy || errors.length > 0 || numShares <= 0} className="btn btn-primary disabled:opacity-50">
            <Check className="w-4 h-4" /> {busy ? 'Transferring…' : 'Confirm Transfer'}
          </button>
        </div>
      </div>
    </SlideOver>
  )
}
