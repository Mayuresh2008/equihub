import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/mock/db'
import { signToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })
    const user = db.users.find(u => u.email === email && u.isActive)
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    const token = signToken(user)
    return NextResponse.json({ token, user })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
