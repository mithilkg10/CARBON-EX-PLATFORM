import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { db, generateId } from '@/lib/db'

async function requireRegulator() {
  const session = await getSession()
  if (!session) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (session.role !== 'regulator' && session.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Access denied. Admin or regulator role required.' }, { status: 403 }) }
  }
  return { session }
}

export async function GET() {
  const { session, error } = await requireRegulator()
  if (error) return error
  void session
  return NextResponse.json({ reviews: await db.getReviews(), flagged: await db.getFlagged() })
}

// POST: approve or reject a review item
export async function POST(request: Request) {
  const { session, error } = await requireRegulator()
  if (error) return error

  const { id, decision } = await request.json()
  if (!id || (decision !== 'approved' && decision !== 'rejected')) {
    return NextResponse.json({ error: 'id and a decision of approved or rejected are required' }, { status: 400 })
  }
  const review = (await db.getReviews()).find(r => r.id === id)
  if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 })
  if (review.status === 'approved' || review.status === 'rejected') {
    return NextResponse.json({ error: `This item was already ${review.status}` }, { status: 409 })
  }

  const simulate = session!.isDemo === true
  if (!simulate) {
    await db.updateReview(id, decision)
    await db.addAuditLog({
      id: `aud_${generateId()}`,
      user_id: session!.userId,
      action: decision === 'approved' ? 'review_approved' : 'review_rejected',
      resource_type: 'review',
      resource_id: id,
      details: JSON.stringify({ company: review.company, type: review.type }),
      created_at: new Date().toISOString(),
    })
  }

  return NextResponse.json({
    success: true,
    simulated: simulate,
    review: { ...review, status: decision },
    message: `${review.type} from ${review.company} ${decision}`,
  })
}
