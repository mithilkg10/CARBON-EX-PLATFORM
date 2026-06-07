import { NextResponse } from 'next/server'
import { clearSession, getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    const ip = request.headers.get('x-forwarded-for') || 'unknown'

    if (session) {
      // Add audit log
      await db.addAuditLog({
        id: `aud_${Date.now()}`,
        user_id: session.userId,
        action: 'logout',
        resource_type: 'session',
        resource_id: session.userId,
        details: JSON.stringify({ method: 'manual' }),
        ip_address: ip,
        created_at: new Date().toISOString(),
      })
    }

    await clearSession()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
