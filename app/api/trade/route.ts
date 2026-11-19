import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { db, generateId } from '@/lib/db'
import { executeSTAVP } from '@/lib/ledger/stavp'
import type { CarbonCredit } from '@/lib/db/types'

function serializeCredit(c: CarbonCredit) {
  return {
    id: c.id,
    type: c.credit_type,
    vintageYear: c.vintage_year,
    quantity: c.quantity,
    pricePerUnit: c.price_per_unit,
    expiryDate: c.expiry_date,
    certificationBody: c.certification_body,
    listed: c.listed,
  }
}

// GET: listings to buy, the caller's own holdings and the wallet balance
export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const available = await db.getAvailableCredits()
    const forPurchase = available.filter(c => c.listed && c.owner_id !== session.userId)
    const owned = (await db.getCreditsByOwnerId(session.userId)).filter(c => c.status === 'available')
    const user = await db.getUserById(session.userId)

    return NextResponse.json({
      forPurchase: forPurchase.map(serializeCredit),
      forSale: owned.map(serializeCredit),
      holdings: owned.reduce((sum, c) => sum + c.quantity, 0),
      wallet: { balance: user?.wallet_balance ?? 0 },
      isDemo: session.isDemo === true,
    })
  } catch (error) {
    console.error('Trade GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 })
  }
}

// POST: buy (runs STAVP) or list / withdraw a holding
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.role !== 'company') {
      return NextResponse.json({ error: 'Only company accounts can trade credits' }, { status: 403 })
    }

    const simulate = session.isDemo === true
    const body = await request.json()
    const { creditId, action, integrityHash } = body
    const quantity = Number(body.quantity)
    const walletBalance = Number.isFinite(Number(body.walletBalance)) ? Number(body.walletBalance) : undefined

    if (!creditId || !action) {
      return NextResponse.json({ error: 'creditId and action are required' }, { status: 400 })
    }

    const credit = await db.getCreditById(creditId)
    if (!credit) return NextResponse.json({ error: 'Credit not found' }, { status: 404 })

    if (action === 'buy') {
      if (credit.owner_id === session.userId) {
        return NextResponse.json({ error: 'You cannot buy your own credits' }, { status: 400 })
      }
      const user = await db.getUserById(session.userId)
      // The demo wallet lives in the visitor's browser session, so the client sends its balance.
      const balance = simulate && walletBalance !== undefined ? walletBalance : user?.wallet_balance ?? 0
      const cost = Math.round(quantity * credit.price_per_unit * 100) / 100
      if (cost > balance) {
        return NextResponse.json({ error: `Insufficient wallet balance: this purchase costs $${cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}` }, { status: 400 })
      }

      const result = await executeSTAVP({
        buyerId: session.userId,
        sellerId: credit.owner_id,
        creditId,
        quantity,
        pricePerUnit: credit.price_per_unit,
        integrityHash,
      }, { simulate })

      if (!result.success || !result.trade || !result.ledgerEntry) {
        return NextResponse.json({ error: result.error || 'Trade failed' }, { status: 400 })
      }

      if (!simulate) {
        await db.updateUser(session.userId, { wallet_balance: Math.round((balance - cost) * 100) / 100 })
        const seller = await db.getUserById(credit.owner_id)
        if (seller) await db.updateUser(seller.id, { wallet_balance: Math.round(((seller.wallet_balance ?? 0) + cost) * 100) / 100 })
        await db.addAuditLog({
          id: `aud_${generateId()}`,
          user_id: session.userId,
          action: 'trade_buy',
          resource_type: 'trade',
          resource_id: result.trade.id,
          details: JSON.stringify({ creditId, quantity, totalPrice: cost, ledgerHash: result.ledgerEntry.transaction_hash }),
          created_at: new Date().toISOString(),
        })
      }

      const seller = await db.getUserById(credit.owner_id)
      return NextResponse.json({
        success: true,
        simulated: simulate,
        trade: {
          id: result.trade.id,
          buyerName: session.name,
          sellerName: seller?.name || 'Counterparty',
          quantity,
          pricePerUnit: credit.price_per_unit,
          totalPrice: cost,
          status: 'completed',
          ledgerHash: result.ledgerEntry.transaction_hash,
          createdAt: result.trade.created_at,
          isUserBuyer: true,
          isUserSeller: false,
        },
        credit: result.buyerCredit ? serializeCredit(result.buyerCredit) : null,
        ledger: {
          hash: result.ledgerEntry.transaction_hash,
          previousHash: result.ledgerEntry.previous_hash,
          nonce: result.ledgerEntry.nonce,
        },
        message: `Purchased ${quantity} ${credit.credit_type} credits for $${cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      })
    }

    if (action === 'list' || action === 'withdraw') {
      if (credit.owner_id !== session.userId) {
        return NextResponse.json({ error: 'You do not own this credit' }, { status: 403 })
      }
      const listed = action === 'list'
      if (!simulate) {
        await db.updateCredit(creditId, { listed })
        await db.addAuditLog({
          id: `aud_${generateId()}`,
          user_id: session.userId,
          action: listed ? 'credit_listed' : 'listing_withdrawn',
          resource_type: 'credit',
          resource_id: creditId,
          details: JSON.stringify({ quantity: credit.quantity, pricePerUnit: credit.price_per_unit }),
          created_at: new Date().toISOString(),
        })
      }
      return NextResponse.json({
        success: true,
        simulated: simulate,
        creditId,
        listed,
        message: listed
          ? `Listed ${credit.quantity.toLocaleString()} ${credit.credit_type} credits at $${credit.price_per_unit.toFixed(2)} each`
          : `Withdrew the ${credit.credit_type} listing from the market`,
      })
    }

    return NextResponse.json({ error: 'Action must be buy, list or withdraw' }, { status: 400 })
  } catch (error) {
    console.error('Trade POST error:', error)
    return NextResponse.json({ error: 'Trade execution failed' }, { status: 500 })
  }
}
