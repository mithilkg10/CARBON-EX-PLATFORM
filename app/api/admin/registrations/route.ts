import { NextResponse } from 'next/server'
import { db, generateId } from '@/lib/db'
import { getSession } from '@/lib/auth/session'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'admin' && session.role !== 'regulator')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ requests: await db.getRegistrationRequests() })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'admin' && session.role !== 'regulator')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { id, action } = await req.json()
    if (!id || (action !== 'accepted' && action !== 'rejected')) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    const request = (await db.getRegistrationRequests()).find(r => r.id === id)
    if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    if (request.status !== 'pending') {
      return NextResponse.json({ error: `This request was already ${request.status}` }, { status: 409 })
    }

    const simulate = session.isDemo === true
    if (!simulate) {
      await db.updateRegistrationRequest(id, action)
      await db.addAuditLog({
        id: `aud_${generateId()}`,
        user_id: session.userId,
        action: action === 'accepted' ? 'registration_accepted' : 'registration_rejected',
        resource_type: 'registration',
        resource_id: id,
        details: JSON.stringify({ company: request.company_name }),
        created_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      success: true,
      simulated: simulate,
      request: { ...request, status: action },
      message: `${request.company_name} ${action === 'accepted' ? 'accepted' : 'rejected'}`,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
