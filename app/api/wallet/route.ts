import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { db, generateId } from '@/lib/db'

// POST: add funds to the trading wallet
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.role !== 'company') {
      return NextResponse.json({ error: 'Only company accounts have a trading wallet' }, { status: 403 })
    }

    const { amount } = await request.json()
    const value = Math.round(Number(amount) * 100) / 100
    if (!Number.isFinite(value) || value <= 0 || value > 1_000_000) {
      return NextResponse.json({ error: 'Enter an amount between $1 and $1,000,000' }, { status: 400 })
    }

    const simulate = session.isDemo === true
    let balance: number | undefined
    if (!simulate) {
      const user = await db.getUserById(session.userId)
      balance = Math.round(((user?.wallet_balance ?? 0) + value) * 100) / 100
      await db.updateUser(session.userId, { wallet_balance: balance })
      await db.addAuditLog({
        id: `aud_${generateId()}`,
        user_id: session.userId,
        action: 'wallet_topup',
        resource_type: 'wallet',
        resource_id: session.userId,
        details: JSON.stringify({ amount: value }),
        created_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      success: true,
      simulated: simulate,
      amount: value,
      balance,
      message: `Added $${value.toLocaleString('en-US', { minimumFractionDigits: 2 })} to your wallet`,
    })
  } catch (error) {
    console.error('Wallet POST error:', error)
    return NextResponse.json({ error: 'Failed to add funds' }, { status: 500 })
  }
}
