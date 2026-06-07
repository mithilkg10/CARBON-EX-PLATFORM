import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let trades
    if (session.role === 'regulator' || session.role === 'admin') {
      // Regulators and admins can see all trades
      trades = await db.getAllTrades()
    } else {
      // Companies can only see their own trades
      trades = await db.getTradesByUserId(session.userId)
    }

    // Get all users for mapping
    const users = await db.getAllUsers()
    const userMap = new Map(users.map(u => [u.id, u]))

    // Format trades with user names
    const formattedTrades = trades.map(t => {
      const buyer = userMap.get(t.buyer_id)
      const seller = userMap.get(t.seller_id)
      
      return {
        id: t.id,
        buyerName: buyer?.name || 'Unknown',
        sellerName: seller?.name || 'Unknown',
        quantity: t.quantity,
        pricePerUnit: t.price_per_unit,
        totalPrice: t.total_price,
        status: t.status,
        ledgerHash: t.ledger_hash,
        createdAt: t.created_at,
        completedAt: t.completed_at,
        isUserBuyer: t.buyer_id === session.userId,
        isUserSeller: t.seller_id === session.userId,
      }
    })

    // Sort by created_at descending
    formattedTrades.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return NextResponse.json({
      trades: formattedTrades,
      summary: {
        totalTrades: formattedTrades.length,
        totalBought: formattedTrades.filter(t => t.isUserBuyer).reduce((sum, t) => sum + t.totalPrice, 0),
        totalSold: formattedTrades.filter(t => t.isUserSeller).reduce((sum, t) => sum + t.totalPrice, 0),
      },
    })
  } catch (error) {
    console.error('Trade history error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trade history' },
      { status: 500 }
    )
  }
}
