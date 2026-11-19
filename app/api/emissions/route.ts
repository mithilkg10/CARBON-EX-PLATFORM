import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { db, generateId } from '@/lib/db'
import type { EmissionLog } from '@/lib/db/types'
import { summarizeEmissions } from '@/lib/emissions'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const emissions = session.role === 'company'
      ? await db.getEmissionsByUserId(session.userId)
      : await db.getAllEmissions()

    const sorted = [...emissions].sort((a, b) =>
      b.reporting_period.localeCompare(a.reporting_period) || a.emission_type.localeCompare(b.emission_type))
    const { summary, totals } = summarizeEmissions(emissions)

    return NextResponse.json({
      emissions: sorted.slice(0, 60).map(e => ({
        id: e.id,
        type: e.emission_type,
        amount: e.amount_tonnes,
        period: e.reporting_period,
        status: e.verification_status,
        source: e.data_source,
        createdAt: e.created_at,
      })),
      summary,
      totals,
    })
  } catch (error) {
    console.error('Emissions GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch emissions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.role !== 'company') {
      return NextResponse.json({ error: 'Only company accounts submit emission reports' }, { status: 403 })
    }

    const { emissionType, amount, reportingPeriod, dataSource } = await request.json()
    const tonnes = Number(amount)

    if (!emissionType || !reportingPeriod || !Number.isFinite(tonnes)) {
      return NextResponse.json({ error: 'Emission type, amount and reporting period are required' }, { status: 400 })
    }
    if (!['scope1', 'scope2', 'scope3'].includes(emissionType)) {
      return NextResponse.json({ error: 'Emission type must be Scope 1, 2 or 3' }, { status: 400 })
    }
    if (tonnes <= 0 || tonnes > 1_000_000) {
      return NextResponse.json({ error: 'Amount must be between 0 and 1,000,000 tonnes' }, { status: 400 })
    }
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(reportingPeriod)) {
      return NextResponse.json({ error: 'Reporting period must be a month' }, { status: 400 })
    }
    const now = new Date()
    const currentPeriod = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
    if (reportingPeriod > currentPeriod) {
      return NextResponse.json({ error: 'Reporting period cannot be in the future' }, { status: 400 })
    }

    const emission: EmissionLog = {
      id: `em_${generateId()}`,
      user_id: session.userId,
      emission_type: emissionType,
      amount_tonnes: Math.round(tonnes * 100) / 100,
      reporting_period: reportingPeriod,
      verification_status: 'pending',
      data_source: dataSource || 'Manual Entry',
      created_at: now.toISOString(),
    }

    const simulate = session.isDemo === true
    if (!simulate) {
      await db.addEmission(emission)
      await db.addAuditLog({
        id: `aud_${generateId()}`,
        user_id: session.userId,
        action: 'emission_submit',
        resource_type: 'emission',
        resource_id: emission.id,
        details: JSON.stringify({ type: emissionType, amount: emission.amount_tonnes, period: reportingPeriod }),
        status: 'pending',
        created_at: emission.created_at,
      })
    }

    const label = emissionType.replace('scope', 'Scope ')
    return NextResponse.json({
      success: true,
      simulated: simulate,
      emission: {
        id: emission.id,
        type: emission.emission_type,
        amount: emission.amount_tonnes,
        period: emission.reporting_period,
        status: emission.verification_status,
        source: emission.data_source,
        createdAt: emission.created_at,
      },
      message: `Submitted ${emission.amount_tonnes.toLocaleString()} tonnes of ${label} emissions for ${reportingPeriod}. Status: pending verification.`,
    })
  } catch (error) {
    console.error('Emissions POST error:', error)
    return NextResponse.json({ error: 'Failed to submit emissions' }, { status: 500 })
  }
}
