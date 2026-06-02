import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/mock/db'
import { authFromHeader } from '@/lib/server-auth'
import { s3 } from '@/lib/aws'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const auth = authFromHeader(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.user.role === 'investor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    const companyId = form.get('companyId') as string | null
    const documentName = form.get('documentName') as string | null
    const documentType = (form.get('documentType') as string | null) || 'other'
    if (!file || !companyId) return NextResponse.json({ error: 'file + companyId required' }, { status: 400 })

    if (auth.user.role === 'startup_admin' && auth.user.companyId !== companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const upload = await s3.uploadDocument(companyId, file.name, buffer, file.type || 'application/octet-stream')

    const doc = {
      id: 'd' + Date.now(),
      companyId,
      documentType,
      documentName: documentName || file.name,
      fileUrl: upload.url,
      content: '',
      generatedById: auth.user.id,
      status: 'pending_signature' as const,
      signatories: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    db.documents.push(doc as any)
    db.auditLogs.push({
      id: 'al' + Date.now(), userId: auth.user.id, action: 'document.uploaded',
      resourceType: 'document', resourceId: doc.id, newValue: { fileName: file.name, key: upload.key, provider: upload.provider }, timestamp: new Date().toISOString(),
    } as any)
    return NextResponse.json({ document: doc, upload }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
