import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { db, generateId } from '@/lib/db'

// POST: suspend or reinstate a flagged entity
export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.role !== 'regulator' && session.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admin or regulator role required.' }, { status: 403 })
    }

    const { id, action } = await req.json()
    if (!id || (action !== 'block' && action !== 'unblock')) {
      return NextResponse.json({ error: 'id and an action of block or unblock are required' }, { status: 400 })
    }

    const entity = (await db.getFlagged()).find(f => f.id === id)
    if (!entity) return NextResponse.json({ error: 'Entity not found' }, { status: 404 })

    const suspended = action === 'block'
    const simulate = session.isDemo === true
    if (!simulate) {
      await db.setFlaggedSuspended(id, suspended)
      await db.addAuditLog({
        id: `aud_${generateId()}`,
        user_id: session.userId,
        action: suspended ? 'entity_suspended' : 'entity_reinstated',
        resource_type: 'entity',
        resource_id: id,
        details: JSON.stringify({ company: entity.company, reason: entity.reason }),
        created_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      success: true,
      simulated: simulate,
      entity: { ...entity, suspended },
      message: suspended ? `${entity.company} is suspended from trading` : `${entity.company} is reinstated`,
    })
  } catch (error) {
    console.error('Block entity error:', error)
    return NextResponse.json({ error: 'Failed to update entity status' }, { status: 500 })
  }
}
