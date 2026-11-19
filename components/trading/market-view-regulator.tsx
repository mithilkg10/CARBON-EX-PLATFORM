"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts"
import { Users, Activity, DollarSign } from "lucide-react"
import { creditsTradedAt, currentHour, getMarketSeries, getMarketSnapshot, formatUsd, priceAt, type Timeframe } from "@/lib/market/engine"
import { StatsCard } from "@/components/dashboard/stats-card"
import { tooltipStyle, CarbonPriceChart } from "@/components/dashboard/market-charts"

const HOUR = 3600000

/** Active traders in hour h: follows trading activity, deterministic per hour. */
function activeTradersAt(h: number) {
  return Math.round(40 + creditsTradedAt(h) / 9)
}

export function RegulatorMarketView() {
  const [timeframe, setTimeframe] = useState<Timeframe>("1W")
  const snapshot = useMemo(() => getMarketSnapshot(timeframe), [timeframe])
  const priceSeries = useMemo(() => getMarketSeries(timeframe), [timeframe])

  const data = useMemo(() => {
    const now = currentHour()
    const hourly = timeframe === "1D"
    const buckets = ({ "1D": 24, "1W": 7, "15D": 15, "30D": 30 } as Record<Timeframe, number>)[timeframe]
    const width = hourly ? 1 : 24
    const points = []
    for (let b = buckets - 1; b >= 0; b--) {
      const end = now - b * width
      let credits = 0
      let traders = 0
      for (let h = end - width + 1; h <= end; h++) {
        credits += creditsTradedAt(h)
        traders = Math.max(traders, activeTradersAt(h))
      }
      const d = new Date(end * HOUR)
      points.push({
        time: hourly
          ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        creditsTraded: credits,
        activeTraders: traders,
        price: priceAt(end),
      })
    }
    return points
  }, [timeframe])

  const peakTraders = Math.max(...data.map(d => d.activeTraders))

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Exchange wide activity from the same market series companies trade on.</p>
        <Select value={timeframe} onValueChange={(val) => setTimeframe(val as Timeframe)}>
          <SelectTrigger className="w-40" aria-label="Timeframe">
            <SelectValue placeholder="Timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1D">Last 24 hours</SelectItem>
            <SelectItem value="1W">Last 7 days</SelectItem>
            <SelectItem value="15D">Last 15 days</SelectItem>
            <SelectItem value="30D">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard title="Credits traded" value={snapshot.periodCredits.toLocaleString()} changeLabel="in the selected period" icon={Activity} />
        <StatsCard title="Traded value" value={formatUsd(snapshot.periodVolume, 0)} changeLabel={`average ${formatUsd(snapshot.periodVolume / snapshot.periodCredits)} per credit`} icon={DollarSign} />
        <StatsCard title="Peak active traders" value={peakTraders.toLocaleString()} changeLabel="in a single hour" icon={Users} />
      </div>

      <CarbonPriceChart data={priceSeries} timeframe={timeframe} onTimeframeChange={setTimeframe} currentPrice={snapshot.price} priceChange={snapshot.change} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" />Credits traded</CardTitle>
            <CardDescription>{timeframe === "1D" ? "Per hour" : "Per day"}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ left: -8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="time" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} minTickGap={16} />
                  <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Area type="monotone" dataKey="creditsTraded" name="Credits traded" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />Active traders</CardTitle>
            <CardDescription>Peak concurrent traders {timeframe === "1D" ? "per hour" : "per day"}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ left: -8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="time" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} minTickGap={16} />
                  <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Line type="monotone" dataKey="activeTraders" name="Active traders" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
