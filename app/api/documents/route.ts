import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/mock/db'
import { authFromHeader } from '@/lib/server-auth'

export async function GET(req: NextRequest) {
  const auth = authFromHeader(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let items = db.documents
  if (auth.user.role === 'startup_admin' && auth.user.companyId) {
    items = items.filter(d => d.companyId === auth.user.companyId)
  } else if (auth.user.role === 'investor') {
    const myInvestments = db.investments.filter(i => i.investorUserId === auth.user.id)
    const myDocs = items.filter(d => myInvestments.some(i => i.companyId === d.companyId))
    const mySignatoryDocs = items.filter(d => Array.isArray(d.signatories) && d.signatories.some((s: any) => s.userId === auth.user.id))
    const ids = new Set([...myDocs.map(d => d.id), ...mySignatoryDocs.map(d => d.id)])
    items = items.filter(d => ids.has(d.id))
  }
  return NextResponse.json({ documents: items })
}

export async function DELETE(req: NextRequest) {
  const auth = authFromHeader(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const idx = db.documents.findIndex(d => d.id === id)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const item = db.documents[idx]
  db.documents.splice(idx, 1)
  db.auditLogs.push({
    id: 'al' + Date.now(), userId: auth.user.id, action: 'document.voided',
    resourceType: 'document', resourceId: id, oldValue: item, timestamp: new Date().toISOString(),
  } as any)
  return NextResponse.json({ ok: true })
}
