import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { getMarketSnapshot } from '@/lib/market/engine'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await db.getMarketStats()
    const passports = await db.getAllPassports()
    const listed = (await db.getAvailableCredits()).filter(c => c.listed)
    const owned = (await db.getCreditsByOwnerId(session.userId)).filter(c => c.status === 'available')
    const allTrades = await db.getAllTrades()
    const users = await db.getAllUsers()

    const creditsByType = listed.reduce((acc, c) => {
      acc[c.credit_type] = (acc[c.credit_type] || 0) + c.quantity
      return acc
    }, {} as Record<string, number>)

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const recentTrades = allTrades.filter(t => new Date(t.created_at).getTime() > sevenDaysAgo)

    const companyVolume = allTrades.reduce((acc, t) => {
      if (t.status === 'completed') {
        acc[t.buyer_id] = (acc[t.buyer_id] || 0) + t.total_price
        acc[t.seller_id] = (acc[t.seller_id] || 0) + t.total_price
      }
      return acc
    }, {} as Record<string, number>)

    const leaderboard = Object.entries(companyVolume)
      .map(([userId, volume]) => {
        const user = users.find(u => u.id === userId)
        const passport = passports.find(p => p.user_id === userId)
        return {
          userId,
          name: user?.company_name || user?.name || 'Unknown',
          volume: Math.round(volume * 100) / 100,
          trustScore: passport?.trust_score || 0,
        }
      })
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5)

    const ratingDistribution = passports.reduce((acc, p) => {
      acc[p.sustainability_rating] = (acc[p.sustainability_rating] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      market: { ...stats, volume_30d: getMarketSnapshot('30D').periodVolume },
      credits: {
        listedSupply: listed.reduce((sum, c) => sum + c.quantity, 0),
        holdings: owned.reduce((sum, c) => sum + c.quantity, 0),
        byType: creditsByType,
      },
      activity: {
        recentTradeCount: recentTrades.length,
        recentVolume: Math.round(recentTrades.reduce((sum, t) => sum + t.total_price, 0) * 100) / 100,
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
    return NextResponse.json({ error: 'Failed to fetch market stats' }, { status: 500 })
  }
}
