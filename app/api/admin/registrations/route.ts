import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const requests = await db.getRegistrationRequests()
    return NextResponse.json({ requests })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { id, action } = await req.json()
    
    if (!id || (action !== 'accepted' && action !== 'rejected')) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    const updated = await db.updateRegistrationRequest(id, action)
    if (!updated) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    return NextResponse.json({ message: `Request ${action} successfully`, request: updated })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
