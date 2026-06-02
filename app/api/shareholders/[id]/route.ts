import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/mock/db'
import { authFromHeader } from '@/lib/server-auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = authFromHeader(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const item = db.shareholders.find(s => s.id === params.id)
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ shareholder: item })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = authFromHeader(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.user.role === 'investor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const idx = db.shareholders.findIndex(s => s.id === params.id)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const item = db.shareholders[idx]
  if (auth.user.role === 'startup_admin' && auth.user.companyId !== item.companyId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  db.shareholders.splice(idx, 1)
  db.auditLogs.push({
    id: 'al' + Date.now(), userId: auth.user.id, action: 'shareholder.removed',
    resourceType: 'shareholder', resourceId: params.id, oldValue: item, timestamp: new Date().toISOString(),
  } as any)
  return NextResponse.json({ ok: true })
}
