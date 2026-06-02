import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/mock/db'
import { authFromHeader } from '@/lib/server-auth'

export async function GET(req: NextRequest) {
  const auth = authFromHeader(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.user.role !== 'main_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return NextResponse.json({ users: db.users })
}

export async function PATCH(req: NextRequest) {
  const auth = authFromHeader(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.user.role !== 'main_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const body = await req.json()
    const idx = db.users.findIndex(u => u.id === body.id)
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const old = db.users[idx]
    const next = { ...old, ...body, updatedAt: new Date().toISOString() } as any
    db.users[idx] = next
    db.auditLogs.push({
      id: 'al' + Date.now(), userId: auth.user.id, action: 'user.updated',
      resourceType: 'user', resourceId: body.id, oldValue: old, newValue: body, timestamp: new Date().toISOString(),
    } as any)
    return NextResponse.json({ user: next })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
