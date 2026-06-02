import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/mock/db'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const idx = db.companies.findIndex(c => c.id === params.id)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ company: db.companies[idx] })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const idx = db.companies.findIndex(c => c.id === params.id)
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const old = db.companies[idx]
    const next = { ...old, ...body, updatedAt: new Date().toISOString() }
    db.companies[idx] = next as any
    db.auditLogs.push({
      id: 'al' + Date.now(), userId: body._actor, action: 'company.updated',
      resourceType: 'company', resourceId: params.id, oldValue: old, newValue: body, timestamp: new Date().toISOString(),
    } as any)
    return NextResponse.json({ company: next })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const idx = db.companies.findIndex(c => c.id === params.id)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const [removed] = db.companies.splice(idx, 1)
  db.auditLogs.push({
    id: 'al' + Date.now(), action: 'company.deleted',
    resourceType: 'company', resourceId: params.id, oldValue: removed, timestamp: new Date().toISOString(),
  } as any)
  return NextResponse.json({ ok: true })
}
