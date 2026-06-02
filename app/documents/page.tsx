'use client'

import { useState, useRef } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/lib/store/auth'
import { db } from '@/lib/mock/db'
import { AIGeneratorPanel } from '@/components/documents/AIGeneratorPanel'
import { ModalShell, Field } from '@/components/shared/Modal'
import { api } from '@/lib/api-client'
import { toast } from '@/lib/store/toast'
import { FileText, Search, Plus, Download, Eye, Upload, Brain, Trash2 } from 'lucide-react'
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
  const [showUpload, setShowUpload] = useState(false)
  const [tick, setTick] = useState(0)

  if (!user) return null

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

  const handleVoid = async (id: string, name: string) => {
    if (!confirm(`Void "${name}"? This cannot be undone.`)) return
    try {
      await api.delete(`/api/documents?id=${id}`)
      const idx = db.documents.findIndex(d => d.id === id)
      if (idx >= 0) db.documents.splice(idx, 1)
      setTick(t => t + 1)
      toast.success('Document voided')
    } catch (err: any) {
      toast.error(err.message || 'Failed to void')
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6" data-tick={tick}>
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
            {user.role !== 'investor' && (
              <button onClick={() => setShowUpload(true)} className="btn btn-secondary">
                <Upload className="w-4 h-4" /> Upload
              </button>
            )}
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
                            <Link href={`/documents/${d.id}`} className="font-medium text-gray-900 hover:text-brand">{d.documentName}</Link>
                            <div className="text-xs text-gray-500">{d.fileUrl ? '📎 attached' : 'text only'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-gray-700">{companyName(d.companyId)}</td>
                      <td className="py-3 px-2 text-gray-600 text-xs">{d.documentType}</td>
                      <td className="py-3 px-2"><span className={`badge ${STATUS_CONFIG[d.status as keyof typeof STATUS_CONFIG].className}`}>{STATUS_CONFIG[d.status as keyof typeof STATUS_CONFIG].label}</span></td>
                      <td className="py-3 px-2 text-xs text-gray-600">
                        {d.signatories.length > 0 ? `${signed} / ${d.signatories.length} signed` : 'No signatories'}
                      </td>
                      <td className="py-3 px-2 text-xs text-gray-500">{timeAgo(d.createdAt)}</td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/documents/${d.id}`} className="p-1.5 hover:bg-gray-100 rounded" title="View"><Eye className="w-4 h-4 text-gray-600" /></Link>
                          {d.status === 'signed' && d.fileUrl && (
                            <a href={d.fileUrl} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-gray-100 rounded" title="Download">
                              <Download className="w-4 h-4 text-gray-600" />
                            </a>
                          )}
                          {canSign && (
                            <Link href={`/documents/${d.id}`} className="px-2 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700">Sign</Link>
                          )}
                          {user.role === 'main_admin' && (
                            <button onClick={() => handleVoid(d.id, d.documentName)} className="p-1.5 hover:bg-red-50 rounded" title="Void">
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
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

      {showUpload && user && <UploadModal user={user} onClose={() => setShowUpload(false)} onSuccess={() => { setShowUpload(false); setTick(t => t + 1) }} />}
    </DashboardLayout>
  )
}

function UploadModal({ user, onClose, onSuccess }: { user: any; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ documentName: '', documentType: 'sha', companyId: user.companyId || (db.companies[0]?.id || '') })
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) { toast.error('Please choose a file'); return }
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('companyId', form.companyId)
      fd.append('documentName', form.documentName || file.name)
      fd.append('documentType', form.documentType)
      const res = await api.upload<{ document: any }>('/api/documents/upload', fd)
      db.documents.push(res.document)
      toast.success('Document uploaded to S3')
      onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'Upload failed')
    } finally { setBusy(false) }
  }

  return (
    <ModalShell title="Upload Document" onClose={onClose}>
      <form onSubmit={handleUpload} className="space-y-3">
        <Field label="Document Name" value={form.documentName} onChange={v => setForm({ ...form, documentName: v })} placeholder={file?.name || ''} />
        <div>
          <label className="label">Document Type *</label>
          <select className="input" value={form.documentType} onChange={e => setForm({ ...form, documentType: e.target.value })}>
            <option value="sha">SHA</option>
            <option value="safe">SAFE</option>
            <option value="term_sheet">Term Sheet</option>
            <option value="option_grant">Option Grant</option>
            <option value="board_resolution">Board Resolution</option>
            <option value="nda">NDA</option>
            <option value="other">Other</option>
          </select>
        </div>
        {user.role === 'main_admin' && (
          <div>
            <label className="label">Company *</label>
            <select className="input" value={form.companyId} onChange={e => setForm({ ...form, companyId: e.target.value })}>
              {db.companies.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="label">File *</label>
          <input ref={fileRef} type="file" className="text-sm" onChange={e => setFile(e.target.files?.[0] || null)} accept=".pdf,.doc,.docx,.txt" required />
          <p className="text-xs text-gray-500 mt-1">In production, uploaded to S3 ({`{S3_BUCKET_DOCUMENTS}`}). In dev mode, served via /api/files.</p>
        </div>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn btn-secondary flex-1 justify-center">Cancel</button>
          <button type="submit" disabled={busy} className="btn btn-primary flex-1 justify-center disabled:opacity-50">
            {busy ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}
