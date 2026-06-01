'use client'

import type { OptionGrant, Shareholder } from '@/lib/types'
import { optionsVested, optionsRemaining, vestingProgress, vestingStatus } from '@/lib/utils/vesting'
import { formatNumber, formatDate, formatCurrency } from '@/lib/utils'

const STATUS_BADGE = {
  active: 'badge-green', in_cliff: 'badge-yellow', fully_vested: 'badge-blue',
  exercised: 'badge-purple', cancelled: 'badge-red', expired: 'badge-gray',
}
const STATUS_LABEL = {
  active: 'Active', in_cliff: 'In Cliff', fully_vested: 'Fully Vested',
  exercised: 'Exercised', cancelled: 'Cancelled', expired: 'Expired',
}

export function ESOPTracker({ grants, shareholders }: { grants: OptionGrant[]; shareholders: Shareholder[] }) {
  if (grants.length === 0) {
    return <div className="text-center py-8 text-gray-500 text-sm">No option grants recorded</div>
  }
  const shareholderById = new Map(shareholders.map(s => [s.id, s]))
  return (
    <div className="space-y-3">
      {grants.map(g => {
        const employee = shareholderById.get(g.employeeId)
        const vested = optionsVested(g)
        const remaining = optionsRemaining(g)
        const progress = vestingProgress(g)
        const status = vestingStatus(g)
        return (
          <div key={g.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-medium text-gray-900">{employee?.name || 'Unknown Employee'}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Granted {formatDate(g.grantDate)} · Exercise price {formatCurrency(g.exercisePrice)}
                </div>
              </div>
              <span className={`badge ${STATUS_BADGE[status]}`}>{STATUS_LABEL[status]}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
              <div>
                <div className="text-xs text-gray-500">Total Options</div>
                <div className="font-semibold text-gray-900">{formatNumber(g.numOptions)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Vested</div>
                <div className="font-semibold text-emerald-600">{formatNumber(vested)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Remaining</div>
                <div className="font-semibold text-gray-700">{formatNumber(remaining)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Cliff / Vesting</div>
                <div className="font-semibold text-gray-700">{g.cliffMonths}m / {g.vestingPeriodMonths}m</div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Vesting Progress</span>
                <span className="font-semibold text-gray-900">{progress.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
