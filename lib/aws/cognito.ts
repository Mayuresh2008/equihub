// AWS Cognito helpers
// In production, replaces mock JWT auth in lib/auth.ts
// Functions return shapes that match lib/types.ts User/Role types

import {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
  AdminListGroupsForUserCommand,
  InitiateAuthCommand,
  GetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import { awsConfig } from './config'
import type { Role, User } from '@/lib/types'

const client = new CognitoIdentityProviderClient(awsConfig)

/** Map Cognito group names to our internal roles */
export function groupToRole(groups: string[] = []): Role {
  if (groups.includes('main_admin')) return 'main_admin'
  if (groups.includes('startup_admin')) return 'startup_admin'
  return 'investor'
}

export interface CognitoAuthResult {
  accessToken: string
  idToken: string
  refreshToken: string
  expiresIn: number
}

/** Sign in via Cognito. Used by /api/auth/login. */
export async function cognitoSignIn(email: string, password: string): Promise<CognitoAuthResult> {
  const cmd = new InitiateAuthCommand({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: process.env.COGNITO_CLIENT_ID,
    AuthParameters: { USERNAME: email, PASSWORD: password },
  })
  const res = await client.send(cmd)
  const r = res.AuthenticationResult
  if (!r) throw new Error('Cognito auth failed')
  return {
    accessToken: r.AccessToken!,
    idToken: r.IdToken!,
    refreshToken: r.RefreshToken!,
    expiresIn: r.ExpiresIn ?? 3600,
  }
}

/** Get user details + groups from Cognito using access token */
export async function cognitoGetUser(accessToken: string): Promise<{ user: User; role: Role }> {
  const meRes = await client.send(new GetUserCommand({ AccessToken: accessToken }))
  const email = meRes.UserAttributes?.find(a => a.Name === 'email')?.Value || ''
  const sub = meRes.Username || ''
  const name = meRes.UserAttributes?.find(a => a.Name === 'name')?.Value || email

  const groupsRes = await client.send(new AdminListGroupsForUserCommand({
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    Username: sub,
  }))
  const groups = groupsRes.Groups?.map(g => g.GroupName || '') || []
  const role = groupToRole(groups)

  return {
    user: {
      id: sub,
      fullName: name,
      email,
      passwordHash: '',
      role,
      companyId: undefined,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    role,
  }
}

/** Verify token (lightweight check via GetUser) */
export async function verifyCognitoToken(accessToken: string): Promise<boolean> {
  try {
    await client.send(new GetUserCommand({ AccessToken: accessToken }))
    return true
  } catch {
    return false
  }
}
