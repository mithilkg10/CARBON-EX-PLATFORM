import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { db, generateId } from '@/lib/db'
import type { CarbonPassport } from '@/lib/db/types'
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const passport = await db.getPassportByUserId(session.userId)
    
    if (!passport) {
      return NextResponse.json({ passport: null })
    }

    // Get emission data for this user
    const emissions = await db.getEmissionsByUserId(session.userId)
    const trades = await db.getTradesByUserId(session.userId)



    // Calculate emission trends
    const recentEmissions = emissions.slice(-6)
    const emissionTrend = recentEmissions.map(e => ({
      period: e.reporting_period,
      amount: e.amount_tonnes,
      type: e.emission_type,
    }))

    return NextResponse.json({
      passport: {
        id: passport.id,
        companyName: passport.company_name,
        industrySector: passport.industry_sector,
        annualEmissions: passport.annual_emissions,
        emissionReductionTarget: passport.emission_reduction_target,
        complianceStatus: passport.compliance_status,
        sustainabilityRating: passport.sustainability_rating,
        lastAuditDate: passport.last_audit_date,
        createdAt: passport.created_at,
      },
      emissionTrend,
    })
  } catch (error) {
    console.error('Passport GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch passport' },
      { status: 500 }
    )
  }
}

// Generate a new passport
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.role !== 'company') {
      return NextResponse.json(
        { error: 'Only companies can create carbon passports' },
        { status: 403 }
      )
    }

    // Check if passport already exists
    const existing = await db.getPassportByUserId(session.userId)
    if (existing) {
      return NextResponse.json(
        { error: 'Passport already exists' },
        { status: 400 }
      )
    }

    const { industrySector, annualEmissions, emissionReductionTarget } = await request.json()

    const passport: CarbonPassport = {
      id: `psp_${generateId()}`,
      user_id: session.userId,
      company_name: session.companyName || session.name,
      industry_sector: industrySector || 'Other',
      annual_emissions: annualEmissions || 0,
      emission_reduction_target: emissionReductionTarget || 20,
      compliance_status: 'pending',
      trust_score: 50, // Starting trust score
      sustainability_rating: 'C', // Starting rating
      last_audit_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Note: In production, would add to database
    // For demo, just return the created passport

    await db.addAuditLog({
      id: `aud_${generateId()}`,
      user_id: session.userId,
      action: 'passport_create',
      resource_type: 'passport',
      resource_id: passport.id,
      details: JSON.stringify({ industrySector, annualEmissions }),
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      passport,
      message: 'Carbon Passport generated successfully',
    })
  } catch (error) {
    console.error('Passport POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create passport' },
      { status: 500 }
    )
  }
}
