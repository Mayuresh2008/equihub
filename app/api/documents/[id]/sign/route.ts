import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/mock/db'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const doc = db.documents.find(d => d.id === params.id)
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ document: doc })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, signature } = await req.json()
    const idx = db.documents.findIndex(d => d.id === params.id)
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const doc = db.documents[idx]
    const sig = doc.signatories?.find((s: any) => s.userId === userId && !s.signed)
    if (!sig) return NextResponse.json({ error: 'No pending signature for user' }, { status: 400 })
    sig.signed = true
    sig.signedAt = new Date().toISOString()
    sig.signatureData = signature || `mock-signature-${userId}-${Date.now()}`
    doc.status = doc.signatories?.every((s: any) => s.signed) ? 'signed' : 'pending_signature'
    if (doc.status === 'signed') {
      db.auditLogs.push({
        id: 'al' + Date.now(), userId, action: 'document.fully_signed',
        resourceType: 'document', resourceId: doc.id, timestamp: new Date().toISOString(),
      } as any)
    }
    return NextResponse.json({ document: doc })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
