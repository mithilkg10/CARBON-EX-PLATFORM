import { cookies } from 'next/headers'
import { verifyToken, type JWTPayload } from './jwt'

const SESSION_COOKIE = 'carbonex_session'

import { db } from '@/lib/db'

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  
  if (!token) return null
  
  const payload = await verifyToken(token)
  if (!payload) return null
  
  // Check if user is blocked (immediate logout)
  const user = await db.getUserById(payload.userId)
  if (!user || user.is_blocked) {
    return null
  }
  
  return { ...payload, role: user.role, isDemo: user.is_demo === true }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

/**
 * Server side guard for pages. Sends signed out visitors to the login page and sends
 * a signed in user who opens a page for another role to their own home page.
 */
export async function requirePageSession(allowed: Array<JWTPayload['role']>): Promise<JWTPayload> {
  const { redirect } = await import('next/navigation')
  const session = await getSession()
  if (!session) redirect('/login')
  if (!allowed.includes(session!.role)) {
    redirect(session!.role === 'company' ? '/dashboard' : '/regulator')
  }
  return session!
}

export function homePathFor(role: JWTPayload['role']): string {
  return role === 'company' ? '/dashboard' : '/regulator'
}
