import { SignJWT, jwtVerify } from 'jose'
import type { UserRole } from '@/lib/db/types'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'carbonex-super-secret-key-change-in-production'
)

export interface JWTPayload {
  userId: string
  email: string
  role: UserRole
  name: string
  companyName?: string
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}
