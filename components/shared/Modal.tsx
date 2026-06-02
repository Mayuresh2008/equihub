'use client'

import { X, Building2 } from 'lucide-react'
import type { ShareholderRole } from '@/lib/types'
import { SHAREHOLDER_ROLE_META } from '@/lib/types'
import { getInitials } from '@/lib/utils/captable'

export function ModalShell({ title, onClose, children, size = 'md', icon }: { title: string; onClose: () => void; children: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl'; icon?: React.ReactNode }) {
  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' }
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className={`bg-white rounded-xl ${sizes[size]} w-full p-6 max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            {icon ?? <Building2 className="w-5 h-5 text-brand" />}
            {title}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

// Slide-over panel from the right (Carta-style)
export function SlideOver({ title, onClose, children, width = 'max-w-2xl' }: { title: string; onClose: () => void; children: React.ReactNode; width?: string }) {
  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/40 transition-opacity" onClick={onClose} />
      <div className={`absolute inset-y-0 right-0 ${width} w-full bg-white shadow-2xl flex flex-col transform transition-transform`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

export function Field({ label, value, onChange, type = 'text', required, placeholder, hint, error }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string; hint?: string; error?: string }) {
  return (
    <div>
      <label className="label">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type={type} className={`input ${error ? 'border-red-500 focus:ring-red-500' : ''}`} value={value} onChange={e => onChange(e.target.value)} required={required} placeholder={placeholder} />
      {hint && !error && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}

export function Select({ label, value, onChange, options, required, hint, error }: { label: string; value: string; onChange: (v: string) => void; options: Array<{ value: string; label: string }>; required?: boolean; hint?: string; error?: string }) {
  return (
    <div>
      <label className="label">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <select className={`input ${error ? 'border-red-500 focus:ring-red-500' : ''}`} value={value} onChange={e => onChange(e.target.value)} required={required}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {hint && !error && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}

export function Toggle({ label, value, onChange, hint }: { label: string; value: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <div className="text-sm font-medium text-gray-700">{label}</div>
        {hint && <div className="text-xs text-gray-500">{hint}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-brand' : 'bg-gray-200'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  )
}

// Avatar with initials fallback (Carta-style)
export function Avatar({ name, roleType, size = 'md' }: { name: string; roleType?: ShareholderRole; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizes = { sm: 'w-6 h-6 text-xs', md: 'w-8 h-8 text-sm', lg: 'w-10 h-10 text-base', xl: 'w-16 h-16 text-xl' }
  const meta = roleType ? SHAREHOLDER_ROLE_META[roleType] : null
  const bgColor = meta?.color || '#6B7280'
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}
      style={{ backgroundColor: bgColor }}
      title={name}
    >
      {getInitials(name) || (meta?.icon ?? '👤')}
    </div>
  )
}
