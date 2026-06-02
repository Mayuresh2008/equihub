import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/mock/db'
import { authFromHeader } from '@/lib/server-auth'

export async function GET(req: NextRequest) {
  const auth = authFromHeader(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let items = db.optionGrants
  if (auth.user.role === 'startup_admin' && auth.user.companyId) {
    items = items.filter(g => g.companyId === auth.user.companyId)
  }
  return NextResponse.json({ optionGrants: items })
}

export async function POST(req: NextRequest) {
  const auth = authFromHeader(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.user.role === 'investor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const body = await req.json()
    if (auth.user.role === 'startup_admin' && auth.user.companyId !== body.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const item = {
      id: 'og' + Date.now(),
      companyId: body.companyId,
      employeeId: body.employeeId,
      numOptions: Number(body.numOptions) || 0,
      exercisePrice: Number(body.exercisePrice) || 0,
      grantDate: body.grantDate || new Date().toISOString().split('T')[0],
      vestingStartDate: body.vestingStartDate || body.grantDate || new Date().toISOString().split('T')[0],
      cliffMonths: Number(body.cliffMonths) || 12,
      vestingPeriodMonths: Number(body.vestingPeriodMonths) || 48,
      status: 'active' as const,
      createdAt: new Date().toISOString(),
    }
    db.optionGrants.push(item as any)
    db.auditLogs.push({
      id: 'al' + Date.now(), userId: auth.user.id, action: 'option_grant.added',
      resourceType: 'option_grant', resourceId: item.id, newValue: item, timestamp: new Date().toISOString(),
    } as any)
    return NextResponse.json({ optionGrant: item }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
