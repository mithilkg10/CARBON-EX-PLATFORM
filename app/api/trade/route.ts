import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { db, generateId } from '@/lib/db'
import { EscrowLedger } from '@/lib/security-layer/ledger/escrow'

// GET: Fetch available credits for trading
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const availableCredits = await db.getAvailableCredits()
    
    // Exclude user's own credits from buy list
    const creditsForSale = availableCredits.filter(c => c.owner_id !== session.userId)
    
    // Get user's own credits for selling
    const userCredits = await db.getCreditsByOwnerId(session.userId)
    const sellableCredits = userCredits.filter(c => c.status === 'available')

    return NextResponse.json({
      forPurchase: creditsForSale.map(c => ({
        id: c.id,
        type: c.credit_type,
        vintageYear: c.vintage_year,
        quantity: c.quantity,
        pricePerUnit: c.price_per_unit,
        expiryDate: c.expiry_date,
        certificationBody: c.certification_body,
      })),
      forSale: sellableCredits.map(c => ({
        id: c.id,
        type: c.credit_type,
        vintageYear: c.vintage_year,
        quantity: c.quantity,
        pricePerUnit: c.price_per_unit,
        expiryDate: c.expiry_date,
        certificationBody: c.certification_body,
      })),
    })
  } catch (error) {
    console.error('Trade GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credits' },
      { status: 500 }
    )
  }
}

// POST: Execute a trade
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { creditId, quantity, action } = await request.json()

    if (!creditId || !quantity || !action) {
      return NextResponse.json(
        { error: 'creditId, quantity, and action are required' },
        { status: 400 }
      )
    }

    if (!['buy', 'sell'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "buy" or "sell"' },
        { status: 400 }
      )
    }

    const credit = await db.getCreditById(creditId)
    if (!credit) {
      return NextResponse.json(
        { error: 'Credit not found' },
        { status: 404 }
      )
    }

    if (action === 'buy') {
      // User is buying, so credit owner is the seller
      if (credit.owner_id === session.userId) {
        return NextResponse.json(
          { error: 'Cannot buy your own credits' },
          { status: 400 }
        )
      }

      // Execute STL-C³T Escrow Commit
      const escrow = EscrowLedger.getInstance()
      const ledgerEntry = escrow.commitTransaction({
        buyerId: session.userId,
        sellerId: credit.owner_id,
        creditId,
        quantity,
        pricePerUnit: credit.price_per_unit,
        timestamp: Date.now()
      })

      // Update DB Trade Record using the generated ledger hash
      const tradeId = `trd_${generateId()}`
      const totalPrice = quantity * credit.price_per_unit
      
      await db.addTrade({
        id: tradeId,
        buyer_id: session.userId,
        seller_id: credit.owner_id,
        credit_id: creditId,
        quantity,
        price_per_unit: credit.price_per_unit,
        total_price: totalPrice,
        trade_type: 'buy',
        status: 'completed',
        ledger_hash: ledgerEntry.hash,
        created_at: new Date().toISOString(),
      })

      // Add audit log
      await db.addAuditLog({
        id: `aud_${generateId()}`,
        user_id: session.userId,
        action: 'trade_buy',
        resource_type: 'trade',
        resource_id: tradeId,
        details: JSON.stringify({
          creditId,
          quantity,
          totalPrice: totalPrice,
          stlHash: ledgerEntry.hash
        }),
        created_at: new Date().toISOString(),
      })

      return NextResponse.json({
        success: true,
        trade: { id: tradeId, total_price: totalPrice },
        verificationHash: ledgerEntry.hash,
        message: `Successfully purchased ${quantity} carbon credits for $${totalPrice} (Secured via STL-C³T)`,
      })
    } else {
      // User is selling (listing for sale)
      if (credit.owner_id !== session.userId) {
        return NextResponse.json(
          { error: 'You do not own this credit' },
          { status: 403 }
        )
      }

      // For demo, just mark as available with updated price
      // In production, would create a listing

      await db.addAuditLog({
        id: `aud_${generateId()}`,
        user_id: session.userId,
        action: 'trade_list',
        resource_type: 'credit',
        resource_id: creditId,
        details: JSON.stringify({
          quantity,
          pricePerUnit: credit.price_per_unit,
        }),
        created_at: new Date().toISOString(),
      })

      return NextResponse.json({
        success: true,
        message: `Listed ${quantity} credits for sale at $${credit.price_per_unit} per unit`,
      })
    }
  } catch (error) {
    console.error('Trade POST error:', error)
    return NextResponse.json(
      { error: 'Trade execution failed' },
      { status: 500 }
    )
  }
}
