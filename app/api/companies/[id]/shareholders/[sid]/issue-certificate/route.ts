import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/mock/db'
import { authFromHeader } from '@/lib/server-auth'

// POST /api/companies/:id/shareholders/:sid/issue-certificate
// Body: { documentName? } — generates a new Document with type 'sha' or 'option_grant'
export async function POST(req: NextRequest, { params }: { params: { id: string; sid: string } }) {
  const auth = authFromHeader(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.user.role === 'investor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (auth.user.role === 'startup_admin' && auth.user.companyId !== params.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const s = db.shareholders.find(x => x.id === params.sid && x.companyId === params.id)
  if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await req.json().catch(() => ({}))
  const company = db.companies.find(c => c.id === params.id)
  const doc = {
    id: 'd' + Date.now(),
    companyId: params.id,
    documentType: s.shareClass === 'options' ? 'option_grant' : 'sha',
    documentName: body.documentName || `Share Certificate #${s.certificateNumber} — ${s.name}`,
    generatedById: auth.user.id,
    status: 'pending_signature' as const,
    signatories: [{ userId: s.userId || auth.user.id, name: s.name, email: s.email, signed: false }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    content: `SHARE CERTIFICATE #${s.certificateNumber}\n\nCompany: ${company?.companyName}\nShareholder: ${s.name}\nNumber of Shares: ${s.sharesOwned.toLocaleString()}\nShare Class: ${s.shareClass}\nDate of Issuance: ${s.dateIssued}\nPrice per Share: $${s.pricePerShare.toFixed(4)}\nTotal Investment: $${(s.sharesOwned * s.pricePerShare).toFixed(2)}`,
  }
  db.documents.push(doc as any)
  db.auditLogs.push({
    id: 'al' + Date.now(),
    userId: auth.user.id,
    action: 'share.certificate.issued',
    resourceType: 'Document',
    resourceId: doc.id,
    newValue: { shareholderId: s.id, certificateNumber: s.certificateNumber },
    timestamp: new Date().toISOString(),
  } as any)
  return NextResponse.json({ document: doc }, { status: 201 })
}
