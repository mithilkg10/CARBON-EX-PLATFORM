import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { db, generateId } from '@/lib/db'
import type { CarbonPassport } from '@/lib/db/types'
import { summarizeEmissions } from '@/lib/emissions'

async function buildPassportResponse(userId: string, passport: CarbonPassport) {
  const emissions = await db.getEmissionsByUserId(userId)
  const { totals } = summarizeEmissions(emissions)
  const owned = (await db.getCreditsByOwnerId(userId)).filter(c => c.status === 'available')
  const trades = await db.getTradesByUserId(userId)
  const reportingMonths = new Set(emissions.map(e => e.reporting_period)).size

  return {
    passport: {
      id: passport.id,
      companyName: passport.company_name,
      industrySector: passport.industry_sector,
      verifiedEmissions: totals.verified,
      pendingEmissions: totals.pending,
      creditsOwned: owned.reduce((sum, c) => sum + c.quantity, 0),
      emissionReductionTarget: passport.emission_reduction_target,
      complianceStatus: passport.compliance_status,
      trustScore: passport.trust_score,
      sustainabilityRating: passport.sustainability_rating,
      lastAuditDate: passport.last_audit_date,
      createdAt: passport.created_at,
      tradeCount: trades.length,
      reportingMonths,
    },
  }
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const passport = await db.getPassportByUserId(session.userId)
    if (!passport) return NextResponse.json({ passport: null })

    return NextResponse.json(await buildPassportResponse(session.userId, passport))
  } catch (error) {
    console.error('Passport GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch passport' }, { status: 500 })
  }
}

// Generate a passport for a company that does not have one yet
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.role !== 'company') {
      return NextResponse.json({ error: 'Only company accounts hold a carbon passport' }, { status: 403 })
    }

    const existing = await db.getPassportByUserId(session.userId)
    if (existing) {
      return NextResponse.json({ success: true, ...(await buildPassportResponse(session.userId, existing)), message: 'Your carbon passport is already active' })
    }

    const { industrySector, emissionReductionTarget } = await request.json().catch(() => ({}))
    const now = new Date().toISOString()
    const passport: CarbonPassport = {
      id: `psp_${generateId()}`,
      user_id: session.userId,
      company_name: session.companyName || session.name,
      industry_sector: industrySector || 'Other',
      annual_emissions: 0,
      emission_reduction_target: Number(emissionReductionTarget) || 20,
      compliance_status: 'pending',
      trust_score: 50,
      sustainability_rating: 'C',
      last_audit_date: now.slice(0, 10),
      created_at: now,
      updated_at: now,
    }

    if (!session.isDemo) {
      await db.addPassport(passport)
      await db.addAuditLog({
        id: `aud_${generateId()}`,
        user_id: session.userId,
        action: 'passport_create',
        resource_type: 'passport',
        resource_id: passport.id,
        details: JSON.stringify({ industrySector: passport.industry_sector }),
        created_at: now,
      })
    }

    return NextResponse.json({
      success: true,
      simulated: session.isDemo === true,
      ...(await buildPassportResponse(session.userId, passport)),
      message: 'Carbon passport generated',
    })
  } catch (error) {
    console.error('Passport POST error:', error)
    return NextResponse.json({ error: 'Failed to create passport' }, { status: 500 })
  }
}
