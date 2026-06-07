import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await db.getMarketStats()
    const passports = await db.getAllPassports()
    const allCredits = await db.getAvailableCredits()
    const allTrades = await db.getAllTrades()

    // Group credits by type
    const creditsByType = allCredits.reduce((acc, c) => {
      acc[c.credit_type] = (acc[c.credit_type] || 0) + c.quantity
      return acc
    }, {} as Record<string, number>)

    // Recent trade activity (last 7 days simulated)
    const now = Date.now()
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
    const recentTrades = allTrades.filter(t => 
      new Date(t.created_at).getTime() > sevenDaysAgo
    )

    // Group by company for leaderboard
    const companyVolume = allTrades.reduce((acc, t) => {
      if (t.status === 'completed') {
        acc[t.buyer_id] = (acc[t.buyer_id] || 0) + t.total_price
        acc[t.seller_id] = (acc[t.seller_id] || 0) + t.total_price
      }
      return acc
    }, {} as Record<string, number>)

    const users = await db.getAllUsers()
    const leaderboard = Object.entries(companyVolume)
      .map(([userId, volume]) => {
        const user = users.find(u => u.id === userId)
        const passport = passports.find(p => p.user_id === userId)
        return {
          name: user?.company_name || user?.name || 'Unknown',
          volume,
          trustScore: passport?.trust_score || 0,
        }
      })
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5)

    // Sustainability ratings distribution
    const ratingDistribution = passports.reduce((acc, p) => {
      acc[p.sustainability_rating] = (acc[p.sustainability_rating] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      market: {
        ...stats,
        priceHistory: generatePriceHistory(stats.current_price),
        volumeHistory: generateVolumeHistory(stats.volume_24h),
      },
      credits: {
        total: allCredits.reduce((sum, c) => sum + c.quantity, 0),
        byType: creditsByType,
      },
      activity: {
        recentTradeCount: recentTrades.length,
        recentVolume: recentTrades.reduce((sum, t) => sum + t.total_price, 0),
      },
      leaderboard,
      sustainability: {
        avgTrustScore: stats.avg_trust_score,
        ratingDistribution,
        totalCompanies: passports.length,
      },
    })
  } catch (error) {
    console.error('Market stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch market stats' },
      { status: 500 }
    )
  }
}

// Generate simulated price history
function generatePriceHistory(currentPrice: number): Array<{ date: string; price: number }> {
  const history = []
  const now = new Date()
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const variation = (Math.random() - 0.5) * 4
    const price = Math.max(5, currentPrice + variation - (i * 0.1))
    
    history.push({
      date: date.toISOString().split('T')[0],
      price: parseFloat(price.toFixed(2)),
    })
  }
  
  // Ensure last price matches current
  history[history.length - 1].price = currentPrice
  
  return history
}

// Generate simulated volume history
function generateVolumeHistory(currentVolume: number): Array<{ date: string; volume: number }> {
  const history = []
  const now = new Date()
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const variation = (Math.random() - 0.3) * currentVolume * 0.5
    const volume = Math.max(100, currentVolume + variation)
    
    history.push({
      date: date.toISOString().split('T')[0],
      volume: parseFloat(volume.toFixed(2)),
    })
  }
  
  return history
}
