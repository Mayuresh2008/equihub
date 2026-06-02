'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowUp, ArrowDown, MoreVertical, Eye, Edit, FileText, Award, ArrowRightLeft, X, Search, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import type { ShareholderView, ShareholderRole, ShareClass, ShareholderStatus } from '@/lib/types'
import { SHAREHOLDER_ROLE_META, SHARE_CLASS_META, SHAREHOLDER_STATUS_META } from '@/lib/types'
import { Avatar } from '@/components/shared/Modal'
import { formatNumber, formatPct, formatCurrency, formatDate } from '@/lib/utils'
import { totalIssuedShares } from '@/lib/utils/captable'

type SortKey = 'name' | 'role' | 'shares' | 'class' | 'pct' | 'investment' | 'status'
type SortDir = 'asc' | 'desc'

interface Props {
  shareholders: ShareholderView[]
  view: 'undiluted' | 'fully_diluted'
  companyId: string
  canEdit: boolean
  onEdit: (s: ShareholderView) => void
  onTransfer: (s: ShareholderView) => void
  onCancel: (s: ShareholderView) => void
  onIssueCertificate: (s: ShareholderView) => void
  onAdd?: () => void
}

export function ShareholderTable({ shareholders, view, companyId, canEdit, onEdit, onTransfer, onCancel, onIssueCertificate, onAdd }: Props) {
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterClass, setFilterClass] = useState<string>('all')
  const [sortKey, setSortKey] = useState<SortKey>('pct')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const total = totalIssuedShares(shareholders as any)

  const filtered = useMemo(() => {
    return shareholders.filter(s => {
      if (search) {
        const q = search.toLowerCase()
        if (!s.name.toLowerCase().includes(q) && !s.email.toLowerCase().includes(q) && !s.certificateNumber.toLowerCase().includes(q)) return false
      }
      if (filterRole !== 'all' && s.roleType !== filterRole) return false
      if (filterClass !== 'all' && s.shareClass !== filterClass) return false
      return true
    })
  }, [shareholders, search, filterRole, filterClass])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      let va: any, vb: any
      if (sortKey === 'name') { va = a.name; vb = b.name }
      else if (sortKey === 'role') { va = a.roleType; vb = b.roleType }
      else if (sortKey === 'shares') { va = a.sharesOwned; vb = b.sharesOwned }
      else if (sortKey === 'class') { va = a.shareClass; vb = b.shareClass }
      else if (sortKey === 'pct') { va = view === 'fully_diluted' ? a.fullyDilutedPct : a.ownershipPct; vb = view === 'fully_diluted' ? b.fullyDilutedPct : b.ownershipPct }
      else if (sortKey === 'investment') { va = a.investmentValue; vb = b.investmentValue }
      else if (sortKey === 'status') { va = a.status; vb = b.status }
      const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [filtered, sortKey, sortDir, view])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const pageItems = sorted.slice((page - 1) * pageSize, page * pageSize)

  const SortHeader = ({ k, children, align = 'left' }: { k: SortKey; children: React.ReactNode; align?: 'left' | 'right' | 'center' }) => (
    <th className={`py-3 px-2 cursor-pointer hover:bg-gray-100 select-none text-${align}`} onClick={() => {
      if (sortKey === k) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
      else { setSortKey(k); setSortDir(k === 'name' || k === 'role' || k === 'class' || k === 'status' ? 'asc' : 'desc') }
    }}>
      <div className={`inline-flex items-center gap-1 text-xs text-gray-500 uppercase tracking-wider font-semibold ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        {children}
        {sortKey === k && (sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-brand" /> : <ArrowDown className="w-3 h-3 text-brand" />)}
      </div>
    </th>
  )

  if (shareholders.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-3xl">👥</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">No shareholders yet</h3>
        <p className="text-sm text-gray-500 mb-4">Add your first shareholder to get started.</p>
        {canEdit && onAdd && (
          <button
            onClick={onAdd}
            className="btn btn-primary mx-auto"
            data-testid="empty-state-add-btn"
          >
            <Plus className="w-4 h-4" /> Add First Shareholder
          </button>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search by name, email, or certificate #"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select className="input sm:w-44" value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(1) }}>
          <option value="all">All Roles</option>
          {Object.entries(SHAREHOLDER_ROLE_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
        </select>
        <select className="input sm:w-44" value={filterClass} onChange={e => { setFilterClass(e.target.value); setPage(1) }}>
          <option value="all">All Classes</option>
          {Object.entries(SHARE_CLASS_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr className="border-b border-gray-200">
              <th className="py-3 px-3 text-xs text-gray-500 uppercase tracking-wider font-semibold text-left w-8">#</th>
              <SortHeader k="name">Shareholder</SortHeader>
              <SortHeader k="role">Role</SortHeader>
              <SortHeader k="class">Class</SortHeader>
              <SortHeader k="shares" align="right">Shares</SortHeader>
              <SortHeader k="pct" align="right">Ownership {view === 'fully_diluted' ? '(FD)' : ''}</SortHeader>
              <SortHeader k="investment" align="right">Investment</SortHeader>
              <SortHeader k="status">Status</SortHeader>
              {canEdit && <th className="py-3 px-3 text-xs text-gray-500 uppercase tracking-wider font-semibold text-right w-16">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {pageItems.map((s, idx) => {
              const pct = view === 'fully_diluted' ? s.fullyDilutedPct : s.ownershipPct
              const roleMeta = SHAREHOLDER_ROLE_META[s.roleType as ShareholderRole] || {
                label: s.roleType || 'Unknown', icon: '👤', color: '#6B7280', badge: 'badge-gray',
              }
              const classMeta = SHARE_CLASS_META[s.shareClass as ShareClass] || {
                label: s.shareClass || 'Unknown', color: '#6B7280', dot: 'bg-gray-400',
              }
              const statusMeta = SHAREHOLDER_STATUS_META[s.status as ShareholderStatus] || {
                label: s.status || 'unknown', badge: 'badge-gray', icon: '⚪',
              }
              const isCancellable = s.status === 'active' && canEdit
              return (
                <tr key={s.id} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                  <td className="py-3 px-3 text-gray-400 text-xs tabular-nums">{(page - 1) * pageSize + idx + 1}</td>
                  <td className="py-3 px-2">
                    <Link href={`/companies/${companyId}/shareholders/${s.id}`} className="flex items-center gap-2.5 group">
                      <Avatar name={s.name} roleType={s.roleType as ShareholderRole} size="md" />
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 group-hover:text-brand truncate max-w-[200px]">{s.name}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[200px]">{s.email}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`badge ${roleMeta.badge}`}>
                      <span className="mr-1">{roleMeta.icon}</span>{roleMeta.label}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${classMeta.dot}`} />
                      <span className="text-gray-700 text-xs">{classMeta.label}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right tabular-nums font-medium text-gray-900">{formatNumber(s.sharesOwned)}</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: roleMeta.color }} />
                      </div>
                      <span className="font-semibold text-gray-900 tabular-nums w-14 text-right">{formatPct(pct)}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right tabular-nums text-gray-700">{formatCurrency(s.investmentValue)}</td>
                  <td className="py-3 px-2">
                    <span className={`badge ${statusMeta.badge}`}>
                      <span className="mr-1">{statusMeta.icon}</span>{statusMeta.label}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="py-3 px-3 text-right">
                      <div className="relative inline-block">
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === s.id ? null : s.id) }}
                          className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {openMenu === s.id && (
                          <>
                            <div className="fixed inset-0 z-20" onClick={() => setOpenMenu(null)} />
                            <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-30 text-left">
                              <Link href={`/companies/${companyId}/shareholders/${s.id}`} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                <Eye className="w-3.5 h-3.5" /> View Full Profile
                              </Link>
                              <button onClick={() => { onEdit(s); setOpenMenu(null) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                <Edit className="w-3.5 h-3.5" /> Edit Shareholder
                              </button>
                              <Link href={`/documents?companyId=${s.companyId}`} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                <FileText className="w-3.5 h-3.5" /> View Documents
                              </Link>
                              <button onClick={() => { onIssueCertificate(s); setOpenMenu(null) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                <Award className="w-3.5 h-3.5" /> Issue Share Certificate
                              </button>
                              <button onClick={() => { onTransfer(s); setOpenMenu(null) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer Shares
                              </button>
                              {isCancellable && (
                                <>
                                  <div className="border-t border-gray-100 my-1" />
                                  <button onClick={() => { onCancel(s); setOpenMenu(null) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">
                                    <X className="w-3.5 h-3.5" /> Cancel / Remove Shares
                                  </button>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
          <tfoot className="sticky bottom-0 bg-gray-50 border-t-2 border-gray-300 font-semibold">
            <tr>
              <td colSpan={4} className="py-3 px-3 text-gray-900">TOTAL · {sorted.length} {sorted.length === 1 ? 'holder' : 'holders'}</td>
              <td className="py-3 px-2 text-right tabular-nums text-gray-900">{formatNumber(sorted.reduce((sum, s) => sum + s.sharesOwned, 0))}</td>
              <td className="py-3 px-2 text-right">
                <div className="flex items-center justify-end gap-2">
                  <span className="font-semibold text-gray-900 tabular-nums">100.00%</span>
                </div>
              </td>
              <td className="py-3 px-2 text-right tabular-nums text-gray-900">{formatCurrency(sorted.reduce((sum, s) => sum + s.investmentValue, 0))}</td>
              <td colSpan={canEdit ? 2 : 1}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Pagination */}
      {sorted.length > pageSize && (
        <div className="flex items-center justify-between mt-3 text-sm">
          <div className="text-gray-500">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} of {sorted.length}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
            <span className="px-3 text-gray-700">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  )
}
