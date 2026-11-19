import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { getMarketSeries, getMarketSnapshot } from '@/lib/market/engine'

// Network wide registry baseline used for the synthetic market (companies outside the demo dataset).
const INDUSTRY_BASELINE: Record<string, { entities: number; compliant: number }> = {
  Energy: { entities: 312, compliant: 263 },
  Manufacturing: { entities: 486, compliant: 351 },
  Transport: { entities: 204, compliant: 139 },
  Agriculture: { entities: 158, compliant: 143 },
  Mining: { entities: 97, compliant: 63 },
  Technology: { entities: 221, compliant: 196 },
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.role !== 'regulator' && session.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admin or regulator role required.' }, { status: 403 })
    }

    const passports = await db.getAllPassports()
    const reviews = await db.getReviews()
    const flagged = await db.getFlagged()
    const listed = (await db.getAvailableCredits()).filter(c => c.listed)

    let totalEntities = 0
    let totalCompliant = 0
    const complianceByIndustry = Object.entries(INDUSTRY_BASELINE).map(([industry, base]) => {
      const local = passports.filter(p => p.industry_sector === industry)
      const entities = base.entities + local.length
      const compliant = base.compliant + local.filter(p => p.compliance_status === 'compliant').length
      totalEntities += entities
      totalCompliant += compliant
      const pct = Math.round((compliant / entities) * 1000) / 10
      return { industry, compliant: pct, nonCompliant: Math.round((100 - pct) * 10) / 10, entities }
    })

    const openReviews = reviews.filter(r => r.status === 'pending' || r.status === 'in-review')
    const activeFlags = flagged.filter(f => !f.suspended)
    const critical = activeFlags.filter(f => f.severity === 'critical').length + openReviews.filter(r => r.risk === 'high').length
    const warning = activeFlags.filter(f => f.severity === 'warning').length + openReviews.filter(r => r.risk === 'medium').length
    const info = openReviews.filter(r => r.risk === 'low').length

    const alertDistribution = [
      { name: 'Critical', value: critical, color: '#ef4444' },
      { name: 'Warning', value: warning, color: '#f59e0b' },
      { name: 'Info', value: info, color: '#3b82f6' },
    ]

    // Market health from the shared market engine.
    const week = getMarketSeries('1W').map(p => p.price)
    const mean = week.reduce((a, b) => a + b, 0) / week.length
    const sd = Math.sqrt(week.reduce((a, b) => a + (b - mean) ** 2, 0) / week.length)
    const stability = Math.max(0, Math.min(100, Math.round(100 - (sd / mean) * 1000)))
    const traded24h = getMarketSnapshot('1D').periodCredits
    const supply = listed.reduce((sum, c) => sum + c.quantity, 0)
    const liquidity = Math.max(0, Math.min(100, Math.round((traded24h / (traded24h + supply)) * 100 + 40)))
    const fraudDetection = Math.round(100 - (activeFlags.length / Math.max(1, flagged.length + 40)) * 100)

    const label = (v: number) => (v >= 75 ? 'High' : v >= 50 ? 'Moderate' : 'Low')

    return NextResponse.json({
      complianceByIndustry,
      alertDistribution,
      marketHealth: {
        liquidity, stability, fraudDetection,
        labels: { liquidity: label(liquidity), stability: label(stability), fraudDetection: fraudDetection >= 85 ? 'Optimal' : label(fraudDetection) },
      },
      stats: {
        totalEntities: totalEntities.toLocaleString('en-US'),
        pendingReviews: String(openReviews.length),
        complianceRate: `${((totalCompliant / totalEntities) * 100).toFixed(1)}%`,
        activeAlerts: String(critical + warning + info),
      },
    })
  } catch (error) {
    console.error('Regulator stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch regulator stats' }, { status: 500 })
  }
}
