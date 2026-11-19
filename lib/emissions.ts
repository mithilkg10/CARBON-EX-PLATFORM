import type { EmissionLog } from '@/lib/db/types'

export function summarizeEmissions(emissions: EmissionLog[]) {
  const byPeriod = new Map<string, { period: string; scope1: number; scope2: number; scope3: number; total: number }>()
  const totals = { scope1: 0, scope2: 0, scope3: 0, total: 0, verified: 0, pending: 0 }
  for (const e of emissions) {
    const row = byPeriod.get(e.reporting_period) ?? { period: e.reporting_period, scope1: 0, scope2: 0, scope3: 0, total: 0 }
    row[e.emission_type] += e.amount_tonnes
    row.total += e.amount_tonnes
    byPeriod.set(e.reporting_period, row)
    totals[e.emission_type] += e.amount_tonnes
    totals.total += e.amount_tonnes
    if (e.verification_status === 'verified') totals.verified += e.amount_tonnes
    if (e.verification_status === 'pending') totals.pending += e.amount_tonnes
  }
  return {
    summary: Array.from(byPeriod.values()).sort((a, b) => a.period.localeCompare(b.period)),
    totals,
  }
}
