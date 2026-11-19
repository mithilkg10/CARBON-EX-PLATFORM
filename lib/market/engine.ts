/**
 * CarbonEx market simulation engine.
 *
 * Every price, volume and percentage shown in the app comes from this file, on the
 * server and in the browser. The series is a deterministic function of the hour, so
 * the dashboard, the trading console, the regulator view and the API always agree,
 * and every visitor (and every serverless instance) sees the same market.
 */

export type Timeframe = "1D" | "1W" | "15D" | "30D"

export interface DataPoint {
  date: string
  price: number
  volume: number
}

const HOUR = 60 * 60 * 1000

/** Integer hash of an hour index, mapped to [0, 1). */
function noise(n: number, salt = 0): number {
  let x = (n * 374761393 + salt * 668265263) | 0
  x = Math.imul(x ^ (x >>> 13), 1274126177)
  x ^= x >>> 16
  return (x >>> 0) / 4294967296
}

/** Smoothed noise so the price walks instead of jumping. */
function smoothNoise(h: number, salt: number): number {
  return (noise(h, salt) + noise(h - 1, salt) + noise(h - 2, salt)) / 3 - 0.5
}

/** Price in USD for the hour index h (hours since Unix epoch). */
export function priceAt(h: number): number {
  const trend = 18 + 2.4 * Math.sin((2 * Math.PI * h) / (24 * 41))
  const weekly = 0.9 * Math.sin((2 * Math.PI * h) / (24 * 7) + 1.1)
  const daily = 0.3 * Math.sin((2 * Math.PI * h) / 24 + 0.4)
  const value = trend + weekly + daily + smoothNoise(h, 7) * 0.7
  return Math.round(value * 100) / 100
}

/** Credits traded during hour h. */
export function creditsTradedAt(h: number): number {
  const dayCycle = 1 + 0.35 * Math.sin((2 * Math.PI * (h % 24)) / 24 - Math.PI / 2)
  return Math.round(380 * dayCycle * (0.75 + noise(h, 13) * 0.5))
}

/** USD volume during hour h. */
export function volumeAt(h: number): number {
  return Math.round(creditsTradedAt(h) * priceAt(h) * 100) / 100
}

export function currentHour(nowMs: number = Date.now()): number {
  return Math.floor(nowMs / HOUR)
}

function sumVolume(fromHour: number, toHour: number): number {
  let total = 0
  for (let h = fromHour; h <= toHour; h++) total += volumeAt(h)
  return Math.round(total * 100) / 100
}

const SPAN_HOURS: Record<Timeframe, number> = { "1D": 24, "1W": 24 * 7, "15D": 24 * 15, "30D": 24 * 30 }

export function getMarketSeries(timeframe: Timeframe, nowMs: number = Date.now()): DataPoint[] {
  const now = currentHour(nowMs)
  const points: DataPoint[] = []
  if (timeframe === "1D") {
    for (let h = now - 24; h <= now; h++) {
      points.push({ date: new Date(h * HOUR).toISOString(), price: priceAt(h), volume: volumeAt(h) })
    }
    return points
  }
  const days = SPAN_HOURS[timeframe] / 24
  for (let d = days; d >= 0; d--) {
    const h = now - d * 24
    points.push({ date: new Date(h * HOUR).toISOString(), price: priceAt(h), volume: sumVolume(h - 23, h) })
  }
  return points
}

export interface MarketSnapshot {
  price: number
  change: number
  periodVolume: number
  periodCredits: number
}

/** Price, % change and traded volume over a timeframe, all from the same series. */
export function getMarketSnapshot(timeframe: Timeframe, nowMs: number = Date.now()): MarketSnapshot {
  const now = currentHour(nowMs)
  const span = SPAN_HOURS[timeframe]
  const first = priceAt(now - span)
  const price = priceAt(now)
  let credits = 0
  for (let h = now - span + 1; h <= now; h++) credits += creditsTradedAt(h)
  return {
    price,
    change: Math.round(((price - first) / first) * 10000) / 100,
    periodVolume: sumVolume(now - span + 1, now),
    periodCredits: credits,
  }
}

export function formatPercent(value: number): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`
}

export function formatUsd(value: number, fractionDigits = 2): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })}`
}

/** Deterministic PRNG for seeding synthetic records. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
