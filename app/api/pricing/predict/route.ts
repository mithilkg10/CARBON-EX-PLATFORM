import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { predictPrice, MODEL_STATS } from '@/lib/ai/pricing-model'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get real market data
    const stats = await db.getMarketStats()
    const passports = await db.getAllPassports()
    const avgTrustScore = passports.length > 0
      ? passports.reduce((sum, p) => sum + p.trust_score, 0) / passports.length
      : 75

    // Simulate market conditions
    const demand = 100 + (stats.price_change_24h * 5) + Math.random() * 20
    const supply = stats.total_supply / 10
    const volatility = Math.abs(stats.price_change_24h) / 20

    // Get AI prediction
    const prediction = predictPrice({
      demand: Math.max(0, Math.min(200, demand)),
      supply: Math.max(50, Math.min(500, supply)),
      trustScore: avgTrustScore,
      volatility: Math.max(0, Math.min(1, volatility)),
    })

    return NextResponse.json({
      prediction,
      marketData: {
        currentPrice: stats.current_price,
        priceChange24h: stats.price_change_24h,
        volume24h: stats.volume_24h,
        totalSupply: stats.total_supply,
        avgTrustScore: parseFloat(avgTrustScore.toFixed(1)),
      },
      modelInfo: {
        accuracy: MODEL_STATS.rSquared * 100,
        trainingDataPoints: MODEL_STATS.trainingDataPoints,
        lastUpdated: '2026-03-15',
      },
    })
  } catch (error) {
    console.error('Pricing error:', error)
    return NextResponse.json(
      { error: 'Failed to generate price prediction' },
      { status: 500 }
    )
  }
}
