// Authentication for EquiHub
// - In production: AWS Cognito User Pool with 3 groups (main_admin, startup_admin, investor)
// - In dev/mock: base64 token with the same shape, stored in localStorage
//
// To switch to real Cognito, set COGNITO_USER_POOL_ID + COGNITO_CLIENT_ID
// and update the login API route to call cognitoSignIn() instead of the mock branch.

import type { User, Role } from './types'
import { db } from './mock/db'
import { cognito } from './aws'

export interface AuthToken {
  user_id: string
  role: Role
  company_id?: string
  email: string
  exp: number
  iat: number
}

const TOKEN_KEY = 'equihub_token'
const USER_KEY = 'equihub_user'

function b64Encode(obj: any): string {
  return typeof window === 'undefined'
    ? Buffer.from(JSON.stringify(obj)).toString('base64')
    : btoa(JSON.stringify(obj))
}

function b64Decode(str: string): any {
  if (typeof window === 'undefined') return JSON.parse(Buffer.from(str, 'base64').toString())
  return JSON.parse(atob(str))
}

export function signToken(user: User): string {
  const now = Math.floor(Date.now() / 1000)
  const payload: AuthToken = {
    user_id: user.id,
    role: user.role,
    company_id: user.companyId,
    email: user.email,
    iat: now,
    exp: now + 3600, // 1 hour
  }
  return b64Encode({ header: { alg: 'HS256', typ: 'JWT' }, payload, sig: 'mock-signature' })
}

export function verifyToken(token: string): AuthToken | null {
  try {
    const decoded = b64Decode(token)
    if (!decoded?.payload) return null
    if (decoded.payload.exp < Math.floor(Date.now() / 1000)) return null
    return decoded.payload
  } catch {
    return null
  }
}

export function login(email: string, role: Role): { user: User; token: string } | { error: string } {
  const user = db.users.find(u => u.email === email && u.role === role && u.isActive)
  if (!user) return { error: 'Invalid credentials. Please check your email and role.' }
  const token = signToken(user)
  return { user, token }
}

/** Production login. Tries Cognito first if configured, falls back to mock. */
export async function productionLogin(email: string, password: string): Promise<{ user: User; token: string; idToken: string; refreshToken: string } | { error: string }> {
  if (process.env.COGNITO_USER_POOL_ID && process.env.COGNITO_CLIENT_ID) {
    try {
      const auth = await cognito.cognitoSignIn(email, password)
      const { user, role } = await cognito.cognitoGetUser(auth.accessToken)
      if (role !== 'main_admin' && role !== 'startup_admin' && role !== 'investor') {
        return { error: 'Role not assigned in Cognito groups' }
      }
      return { user, token: auth.accessToken, idToken: auth.idToken, refreshToken: auth.refreshToken }
    } catch (e: any) {
      return { error: e.message || 'Cognito login failed' }
    }
  }
  // Fallback: mock auth (no password check)
  const user = db.users.find(u => u.email === email && u.isActive)
  if (!user) return { error: 'Invalid credentials' }
  return { user, token: signToken(user), idToken: signToken(user), refreshToken: '' }
}

export function setSession(user: User, token: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null
  const u = localStorage.getItem(USER_KEY)
  return u ? JSON.parse(u) : null
}

export function getCurrentAuth(): { user: User; token: AuthToken } | null {
  const tokenStr = getStoredToken()
  const user = getStoredUser()
  if (!tokenStr || !user) return null
  const token = verifyToken(tokenStr)
  if (!token) {
    clearSession()
    return null
  }
  return { user, token }
}

// Role-based access control helper
export function canAccess(user: User | null, requiredRoles: Role[]): boolean {
  if (!user) return false
  return requiredRoles.includes(user.role)
}

export function canAccessCompany(user: User | null, companyId: string): boolean {
  if (!user) return false
  if (user.role === 'main_admin') return true
  if (user.role === 'startup_admin') return user.companyId === companyId
  if (user.role === 'investor') {
    return db.investments.some(i => i.investorUserId === user.id && i.companyId === companyId)
  }
  return false
}
