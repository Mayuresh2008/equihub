// Server-side auth helper for API routes
// Reads Bearer token (mock base64) from Authorization header and verifies it
// In production this would verify a Cognito JWT signature

import type { NextRequest } from 'next/server'
import { verifyToken } from './auth'
import { db } from './mock/db'
import type { User } from './types'

export interface ServerAuth {
  user: User
}

export function authFromHeader(req: NextRequest): ServerAuth | null {
  const auth = req.headers.get('authorization') || ''
  if (!auth.startsWith('Bearer ')) return null
  const token = auth.slice(7)
  const payload = verifyToken(token)
  if (!payload) return null
  const user = db.users.find(u => u.id === payload.user_id)
  if (!user || !user.isActive) return null
  return { user }
}

export function requireAuth(req: NextRequest, allowedRoles?: User['role'][]): ServerAuth {
  const auth = authFromHeader(req)
  if (!auth) throw new Error('Unauthorized')
  if (allowedRoles && !allowedRoles.includes(auth.user.role)) throw new Error('Forbidden')
  return auth
}
