import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { db, generateId } from '@/lib/db'
import type { EmissionLog } from '@/lib/db/types'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let emissions: EmissionLog[]
    
    if (session.role === 'regulator' || session.role === 'admin') {
      emissions = await db.getAllEmissions()
    } else {
      emissions = await db.getEmissionsByUserId(session.userId)
    }

    // Sort by created_at descending
    emissions.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    // Group by reporting period
    const groupedByPeriod = emissions.reduce((acc, e) => {
      if (!acc[e.reporting_period]) {
        acc[e.reporting_period] = {
          period: e.reporting_period,
          scope1: 0,
          scope2: 0,
          scope3: 0,
          total: 0,
        }
      }
      acc[e.reporting_period][e.emission_type] += e.amount_tonnes
      acc[e.reporting_period].total += e.amount_tonnes
      return acc
    }, {} as Record<string, { period: string; scope1: number; scope2: number; scope3: number; total: number }>)

    const summary = Object.values(groupedByPeriod).sort((a, b) => 
      a.period.localeCompare(b.period)
    )

    // Calculate totals
    const totalScope1 = emissions.filter(e => e.emission_type === 'scope1').reduce((sum, e) => sum + e.amount_tonnes, 0)
    const totalScope2 = emissions.filter(e => e.emission_type === 'scope2').reduce((sum, e) => sum + e.amount_tonnes, 0)
    const totalScope3 = emissions.filter(e => e.emission_type === 'scope3').reduce((sum, e) => sum + e.amount_tonnes, 0)

    return NextResponse.json({
      emissions: emissions.slice(0, 50).map(e => ({
        id: e.id,
        type: e.emission_type,
        amount: e.amount_tonnes,
        period: e.reporting_period,
        status: e.verification_status,
        source: e.data_source,
        createdAt: e.created_at,
      })),
      summary,
      totals: {
        scope1: totalScope1,
        scope2: totalScope2,
        scope3: totalScope3,
        total: totalScope1 + totalScope2 + totalScope3,
      },
    })
  } catch (error) {
    console.error('Emissions GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch emissions' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.role !== 'company') {
      return NextResponse.json(
        { error: 'Only companies can submit emissions' },
        { status: 403 }
      )
    }

    const { emissionType, amount, reportingPeriod, dataSource } = await request.json()

    if (!emissionType || !amount || !reportingPeriod) {
      return NextResponse.json(
        { error: 'emissionType, amount, and reportingPeriod are required' },
        { status: 400 }
      )
    }

    if (!['scope1', 'scope2', 'scope3'].includes(emissionType)) {
      return NextResponse.json(
        { error: 'emissionType must be scope1, scope2, or scope3' },
        { status: 400 }
      )
    }

    const emission: EmissionLog = {
      id: `em_${generateId()}`,
      user_id: session.userId,
      emission_type: emissionType,
      amount_tonnes: parseFloat(amount),
      reporting_period: reportingPeriod,
      verification_status: 'pending',
      data_source: dataSource || 'Manual Entry',
      created_at: new Date().toISOString(),
    }

    await db.addEmission(emission)

    await db.addAuditLog({
      id: `aud_${generateId()}`,
      user_id: session.userId,
      action: 'emission_submit',
      resource_type: 'emission',
      resource_id: emission.id,
      details: JSON.stringify({
        type: emissionType,
        amount,
        period: reportingPeriod,
      }),
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      emission,
      message: `Submitted ${amount} tonnes of ${emissionType} emissions for ${reportingPeriod}`,
    })
  } catch (error) {
    console.error('Emissions POST error:', error)
    return NextResponse.json(
      { error: 'Failed to submit emissions' },
      { status: 500 }
    )
  }
}
