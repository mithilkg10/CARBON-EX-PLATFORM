import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'regulator') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, action } = body

    if (!id || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const isBlocked = action === 'block'

    // If the ID matches a real DB user, update them. 
    // For mock FE-001 entities, we just ignore the DB update since they don't exist.
    await db.updateUser(id, { is_blocked: isBlocked })

    return NextResponse.json({ success: true, blocked: isBlocked })
  } catch (error) {
    console.error('Block user error:', error)
    return NextResponse.json(
      { error: 'Failed to update user status' },
      { status: 500 }
    )
  }
}
