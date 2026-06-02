'use client'

import { useToastStore } from '@/lib/store/toast'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
}

const STYLES = {
  success: 'bg-green-50 border-green-200 text-green-900',
  error: 'bg-red-50 border-red-200 text-red-900',
  info: 'bg-blue-50 border-blue-200 text-blue-900',
  warning: 'bg-amber-50 border-amber-200 text-amber-900',
}

const ICON_COLORS = {
  success: 'text-green-600',
  error: 'text-red-600',
  info: 'text-blue-600',
  warning: 'text-amber-600',
}

export function ToastContainer() {
  const toasts = useToastStore(s => s.toasts)
  const dismiss = useToastStore(s => s.dismiss)
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => {
        const Icon = ICONS[t.variant]
        return (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto min-w-[280px] max-w-sm border rounded-lg shadow-lg p-3 flex items-start gap-2 animate-in slide-in-from-right',
              STYLES[t.variant]
            )}
          >
            <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', ICON_COLORS[t.variant])} />
            <div className="flex-1 min-w-0">
              {t.title && <div className="font-semibold text-sm">{t.title}</div>}
              <div className="text-sm">{t.message}</div>
            </div>
            <button onClick={() => dismiss(t.id)} className="text-gray-400 hover:text-gray-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
