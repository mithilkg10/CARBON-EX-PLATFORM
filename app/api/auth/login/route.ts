import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { signToken } from '@/lib/auth/jwt'
import { setSessionCookie } from '@/lib/auth/session'

// Rate limiting store (in-memory for demo)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()
const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    const ip = request.headers.get('x-forwarded-for') || 'unknown'

    // Check rate limiting
    const attempts = loginAttempts.get(ip)
    if (attempts && attempts.count >= MAX_ATTEMPTS) {
      const timeSinceLastAttempt = Date.now() - attempts.lastAttempt
      if (timeSinceLastAttempt < LOCKOUT_DURATION) {
        const remainingTime = Math.ceil((LOCKOUT_DURATION - timeSinceLastAttempt) / 1000 / 60)
        return NextResponse.json(
          { error: `Too many login attempts. Try again in ${remainingTime} minutes.` },
          { status: 429 }
        )
      }
      // Reset after lockout duration
      loginAttempts.delete(ip)
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    console.log("[v0] Login attempt for email:", email)
    const user = await db.getUserByEmail(email)
    console.log("[v0] User found:", user ? { id: user.id, email: user.email, role: user.role } : null)

    if (!user) {
      // Track failed attempt
      const current = loginAttempts.get(ip) || { count: 0, lastAttempt: 0 }
      loginAttempts.set(ip, { count: current.count + 1, lastAttempt: Date.now() })
      
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (user.requires_password_setup) {
      return NextResponse.json(
        { error: 'requires_password_setup' },
        { status: 403 }
      )
    }

    console.log("[v0] Comparing password with hash:", { passwordLength: password.length, hashLength: user.password_hash?.length })
    const passwordValid = await bcrypt.compare(password, user.password_hash)
    console.log("[v0] Password valid:", passwordValid)

    if (!passwordValid) {
      // Track failed attempt
      const current = loginAttempts.get(ip) || { count: 0, lastAttempt: 0 }
      loginAttempts.set(ip, { count: current.count + 1, lastAttempt: Date.now() })
      
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Clear rate limiting on successful login
    loginAttempts.delete(ip)

    // Generate JWT
    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      companyName: user.company_name,
    })

    // Set session cookie
    await setSessionCookie(token)

    // Add audit log
    await db.addAuditLog({
      id: `aud_${Date.now()}`,
      user_id: user.id,
      action: 'login',
      resource_type: 'session',
      resource_id: user.id,
      details: JSON.stringify({ method: 'password' }),
      ip_address: ip,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyName: user.company_name,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
