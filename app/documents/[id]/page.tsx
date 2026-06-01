'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/lib/store/auth'
import { db } from '@/lib/mock/db'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { FileText, Download, Check, Lock, ArrowLeft, Send, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { formatDate, timeAgo } from '@/lib/utils'

export default function DocumentDetailPage() {
  const { user } = useAuthStore()
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [signed, setSigned] = useState(false)
  const [docState, setDocState] = useState(() => db.documents.find(d => d.id === id))

  if (!user || !docState) return null
  const company = db.companies.find(c => c.id === docState.companyId)
  const canSign = docState.status === 'pending_signature' && docState.signatories.some(s => s.userId === user.id && !s.signed) && !signed

  const handleSign = () => {
    if (!canSign) return
    // Update signatory
    const updatedSigs = docState.signatories.map(s => s.userId === user.id ? { ...s, signed: true } : s)
    const allSigned = updatedSigs.every(s => s.signed)
    const newStatus = allSigned ? 'signed' as const : 'pending_signature' as const
    const updated = {
      ...docState,
      signatories: updatedSigs,
      status: newStatus,
      signedAt: allSigned ? new Date().toISOString() : docState.signedAt,
    }
    // Mutate mock db
    const idx = db.documents.findIndex(d => d.id === docState.id)
    db.documents[idx] = updated
    setDocState(updated)
    setSigned(true)
    db.auditLogs.push({
      id: 'al' + Date.now(),
      userId: user.id,
      action: 'document.signed',
      resourceType: 'Document',
      resourceId: docState.id,
      timestamp: new Date().toISOString(),
    })
    if (allSigned) {
      db.notifications.push({
        id: 'n' + Date.now(),
        userId: company?.createdById || user.id,
        type: 'document.signed',
        message: `${docState.documentName} has been fully signed by all parties`,
        isRead: false,
        createdAt: new Date().toISOString(),
      })
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card">
            <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <h1 className="text-xl font-bold text-gray-900">{docState.documentName}</h1>
                </div>
                <p className="text-sm text-gray-500 mt-1">{docState.documentType} · {company?.companyName}</p>
              </div>
              <span className={`badge ${docState.status === 'signed' ? 'badge-green' : docState.status === 'pending_signature' ? 'badge-yellow' : 'badge-gray'}`}>
                {docState.status === 'signed' && '🔒 '}{docState.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-h-[600px] overflow-y-auto">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">{docState.content || 'No content available'}</pre>
            </div>
          </div>

          <div className="space-y-4">
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3">Signatories</h3>
              {docState.signatories.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-4">No signatories yet</div>
              ) : (
                <div className="space-y-2">
                  {docState.signatories.map(sig => (
                    <div key={sig.userId} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${sig.signed ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {sig.signed ? <Check className="w-4 h-4" /> : sig.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{sig.name}</div>
                        <div className="text-xs text-gray-500 truncate">{sig.email}</div>
                      </div>
                      {sig.signed && <Check className="w-4 h-4 text-emerald-600" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {canSign && (
              <div className="card bg-emerald-50 border-emerald-200">
                <h3 className="font-semibold text-gray-900 mb-2">Action Required</h3>
                <p className="text-sm text-gray-700 mb-3">This document is awaiting your signature.</p>
                <button onClick={handleSign} className="btn btn-success w-full justify-center">
                  <Check className="w-4 h-4" /> Sign Document
                </button>
              </div>
            )}

            {signed && docState.status !== 'signed' && (
              <div className="card bg-blue-50 border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-1">✓ You signed this</h3>
                <p className="text-xs text-gray-600">Awaiting signatures from other parties.</p>
              </div>
            )}

            {docState.status === 'signed' && (
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-3">Actions</h3>
                <button className="btn btn-secondary w-full justify-center mb-2">
                  <Download className="w-4 h-4" /> Download Signed PDF
                </button>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Lock className="w-3 h-3" />
                  <span>Document is locked from editing</span>
                </div>
              </div>
            )}

            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3">Metadata</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Created</span><span>{formatDate(docState.createdAt)}</span></div>
                {docState.signedAt && <div className="flex justify-between"><span className="text-gray-500">Signed</span><span>{formatDate(docState.signedAt)}</span></div>}
                <div className="flex justify-between"><span className="text-gray-500">Status</span><span>{docState.status.replace('_', ' ')}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
