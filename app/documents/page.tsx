'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/lib/store/auth'
import { db } from '@/lib/mock/db'
import { AIGeneratorPanel } from '@/components/documents/AIGeneratorPanel'
import { FileText, Search, Plus, Download, Eye, Check, X, Filter, Lock, Brain } from 'lucide-react'
import Link from 'next/link'
import { formatDate, timeAgo } from '@/lib/utils'

const STATUS_CONFIG = {
  draft: { label: 'Draft', className: 'badge-gray' },
  pending_signature: { label: 'Pending Signature', className: 'badge-yellow' },
  signed: { label: 'Signed', className: 'badge-green' },
  voided: { label: 'Voided', className: 'badge-red' },
}

export default function DocumentsPage() {
  const { user } = useAuthStore()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showAI, setShowAI] = useState(false)

  if (!user) return null

  // Filter docs by role
  let docs = db.documents
  if (user.role === 'startup_admin') docs = docs.filter(d => d.companyId === user.companyId)
  if (user.role === 'investor') {
    const myCompanyIds = db.investments.filter(i => i.investorUserId === user.id).map(i => i.companyId)
    docs = docs.filter(d => myCompanyIds.includes(d.companyId))
  }

  docs = docs.filter(d =>
    (filter === 'all' || d.status === filter) &&
    d.documentName.toLowerCase().includes(search.toLowerCase())
  )

  const companyName = (id: string) => db.companies.find(c => c.id === id)?.companyName || 'Unknown'

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Document Library</h1>
            <p className="text-sm text-gray-500 mt-1">
              {user.role === 'main_admin' && 'All documents across all companies'}
              {user.role === 'startup_admin' && 'Documents for your company'}
              {user.role === 'investor' && 'Documents for your investments'}
            </p>
          </div>
          <div className="flex gap-2">
            {user.role === 'main_admin' && (
              <button onClick={() => setShowAI(!showAI)} className="btn btn-primary">
                <Brain className="w-4 h-4" /> {showAI ? 'Hide' : 'Show'} AI Generator
              </button>
            )}
            {user.role !== 'investor' && <button className="btn btn-secondary"><Plus className="w-4 h-4" /> New Document</button>}
          </div>
        </div>

        {showAI && user.role === 'main_admin' && <AIGeneratorPanel />}

        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input className="input pl-10" placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="input w-auto" value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="pending_signature">Pending</option>
              <option value="signed">Signed</option>
              <option value="voided">Voided</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <th className="py-3 px-2">Document</th>
                  <th className="py-3 px-2">Company</th>
                  <th className="py-3 px-2">Type</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Signatories</th>
                  <th className="py-3 px-2">Created</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {docs.map(d => {
                  const signed = d.signatories.filter(s => s.signed).length
                  const canSign = user && d.status === 'pending_signature' && d.signatories.some(s => s.userId === user.id && !s.signed)
                  return (
                    <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900">{d.documentName}</div>
                            {d.status === 'signed' && <div className="flex items-center gap-1 text-xs text-emerald-600"><Lock className="w-3 h-3" /> Locked</div>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-gray-700">{companyName(d.companyId)}</td>
                      <td className="py-3 px-2 text-gray-600 text-xs">{d.documentType}</td>
                      <td className="py-3 px-2"><span className={`badge ${STATUS_CONFIG[d.status].className}`}>{STATUS_CONFIG[d.status].label}</span></td>
                      <td className="py-3 px-2 text-xs text-gray-600">
                        {d.signatories.length > 0 ? `${signed} / ${d.signatories.length} signed` : 'No signatories'}
                      </td>
                      <td className="py-3 px-2 text-xs text-gray-500">{timeAgo(d.createdAt)}</td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/documents/${d.id}`} className="p-1.5 hover:bg-gray-100 rounded" title="View">
                            <Eye className="w-4 h-4 text-gray-600" />
                          </Link>
                          {d.status === 'signed' && (
                            <button className="p-1.5 hover:bg-gray-100 rounded" title="Download">
                              <Download className="w-4 h-4 text-gray-600" />
                            </button>
                          )}
                          {canSign && (
                            <Link href={`/documents/${d.id}`} className="px-2 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700">Sign</Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {docs.length === 0 && <div className="text-center py-12 text-gray-500">No documents found</div>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
