'use client'

import { useState } from 'react'
import { Check, AlertCircle } from 'lucide-react'
import { SlideOver, Field, Select, Toggle } from '@/components/shared/Modal'
import { COUNTRIES, SHAREHOLDER_ROLE_META, SHARE_CLASS_META } from '@/lib/types'
import type { ShareholderView, ShareholderRole, ShareClass, ShareholderStatus } from '@/lib/types'
import { formatCurrency, formatNumber, formatPct } from '@/lib/utils'
import { api } from '@/lib/api-client'
import { toast } from '@/lib/store/toast'

interface Props {
  companyId: string
  shareholder: ShareholderView
  onClose: () => void
  onSuccess: () => void
}

export function EditShareholderModal({ companyId, shareholder, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    name: shareholder.name,
    email: shareholder.email,
    phone: shareholder.phone || '',
    country: shareholder.country,
    roleType: shareholder.roleType as ShareholderRole,
    shareClass: shareholder.shareClass as ShareClass,
    sharesOwned: shareholder.sharesOwned,
    pricePerShare: shareholder.pricePerShare,
    dateIssued: shareholder.dateIssued,
    status: shareholder.status as ShareholderStatus,
    boardSeat: shareholder.rights?.boardSeat || false,
    votingRights: shareholder.rights?.votingRights ?? true,
    proRataRights: shareholder.rights?.proRataRights || false,
    antiDilution: shareholder.rights?.antiDilution || false,
    liquidationPreference: shareholder.rights?.liquidationPreference || 1,
    notes: shareholder.notes || '',
  })
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    try {
      await api.put(`/api/companies/${companyId}/shareholders/${shareholder.id}`, {
        ...form,
        rights: {
          boardSeat: form.boardSeat, votingRights: form.votingRights, proRataRights: form.proRataRights,
          antiDilution: form.antiDilution, liquidationPreference: form.liquidationPreference,
        },
        investmentAmount: form.sharesOwned * form.pricePerShare,
      })
      toast.success(`${form.name} updated`)
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <SlideOver title={`Edit ${shareholder.name}`} onClose={onClose} width="max-w-2xl">
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Field label="Full Name" value={form.name} onChange={v => setForm({ ...form, name: v })} required />
          </div>
          <div className="col-span-2">
            <Field label="Email" type="email" value={form.email} onChange={v => setForm({ ...form, email: v })} required />
          </div>
          <Field label="Phone" value={form.phone} onChange={v => setForm({ ...form, phone: v })} />
          <Select label="Country" value={form.country} onChange={v => setForm({ ...form, country: v })}
            options={COUNTRIES.map(c => ({ value: c, label: c }))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select label="Role" value={form.roleType} onChange={v => setForm({ ...form, roleType: v as ShareholderRole })}
            options={Object.entries(SHAREHOLDER_ROLE_META).map(([k, m]) => ({ value: k, label: `${m.icon} ${m.label}` }))} />
          <Select label="Share Class" value={form.shareClass} onChange={v => setForm({ ...form, shareClass: v as ShareClass })}
            options={Object.entries(SHARE_CLASS_META).map(([k, m]) => ({ value: k, label: m.label }))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Shares" type="number" value={String(form.sharesOwned)} onChange={v => setForm({ ...form, sharesOwned: Number(v) || 0 })} required />
          <Field label="Date Issued" type="date" value={form.dateIssued} onChange={v => setForm({ ...form, dateIssued: v })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Price per Share" type="number" value={String(form.pricePerShare)} onChange={v => setForm({ ...form, pricePerShare: Number(v) || 0 })} />
          <div>
            <label className="label">Total Investment</label>
            <div className="input bg-gray-50 cursor-default font-semibold text-gray-900">{formatCurrency(form.sharesOwned * form.pricePerShare)}</div>
          </div>
        </div>
        <Select label="Status" value={form.status} onChange={v => setForm({ ...form, status: v as ShareholderStatus })}
          options={[
            { value: 'active', label: '✅ Active' },
            { value: 'transferred', label: '🔄 Transferred' },
            { value: 'pending', label: '⏳ Pending Approval' },
            { value: 'cancelled', label: '❌ Cancelled' },
          ]} />
        <div className="card !p-4 space-y-1">
          <div className="text-sm font-semibold text-gray-900 mb-2">Rights</div>
          <Toggle label="Board Seat" value={form.boardSeat} onChange={v => setForm({ ...form, boardSeat: v })} />
          <Toggle label="Voting Rights" value={form.votingRights} onChange={v => setForm({ ...form, votingRights: v })} />
          <Toggle label="Pro-Rata Rights" value={form.proRataRights} onChange={v => setForm({ ...form, proRataRights: v })} />
          <Toggle label="Anti-Dilution" value={form.antiDilution} onChange={v => setForm({ ...form, antiDilution: v })} />
          <div className="pt-2">
            <Select label="Liquidation Preference" value={String(form.liquidationPreference)} onChange={v => setForm({ ...form, liquidationPreference: Number(v) })}
              options={[{ value: '1', label: '1x' }, { value: '2', label: '2x' }, { value: '3', label: '3x' }, { value: '0', label: 'None' }]} />
          </div>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea className="input min-h-[60px]" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </div>
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button onClick={submit} disabled={busy} className="btn btn-primary disabled:opacity-50">
            <Check className="w-4 h-4" /> {busy ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </SlideOver>
  )
}
