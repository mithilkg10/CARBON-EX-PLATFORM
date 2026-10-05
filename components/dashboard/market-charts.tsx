"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { ArrowUpRight, ArrowDownRight, BarChart3 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { DataPoint, Timeframe } from "@/lib/utils/market-data"

interface MarketChartsProps {
  data: DataPoint[]
  timeframe: Timeframe
  onTimeframeChange: (t: Timeframe) => void
  currentPrice: number
  priceChange: number
}

export const formatXAxis = (dateStr: string, timeframe: Timeframe) => {
  const date = new Date(dateStr)
  if (timeframe === "1D") {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

const chartCardClass =
  "h-full overflow-hidden border-white/[0.07] bg-gradient-to-br from-white/[0.045] via-white/[0.025] to-emerald-400/[0.025] shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl"

const tooltipStyle = {
  backgroundColor: "rgba(6, 13, 11, 0.96)",
  border: "1px solid rgba(110, 231, 183, 0.16)",
  borderRadius: "12px",
  color: "#f8fafc",
  boxShadow: "0 18px 50px rgba(0,0,0,.35)",
}

export function CarbonPriceChart({ data, timeframe, currentPrice, priceChange, onTimeframeChange }: MarketChartsProps) {
  return (
    <Card className={chartCardClass}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Carbon Credit Price</CardTitle>
            <CardDescription>
              {timeframe === "1D" ? "24-hour" : timeframe === "1W" ? "7-day" : timeframe.toLowerCase()} price history
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={priceChange >= 0 ? "default" : "destructive"}
              className={priceChange >= 0 ? "border border-emerald-300/10 bg-emerald-300/10 text-emerald-300" : ""}
            >
              {priceChange >= 0 ? <ArrowUpRight className="mr-1 h-3 w-3" /> : <ArrowDownRight className="mr-1 h-3 w-3" />}
              {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(2)}%
            </Badge>
            <Select value={timeframe} onValueChange={(val) => onTimeframeChange(val as Timeframe)}>
              <SelectTrigger className="h-8 w-[82px] border-white/10 bg-black/20 text-xs">
                <SelectValue placeholder="Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1D">1D</SelectItem>
                <SelectItem value="1W">1W</SelectItem>
                <SelectItem value="15D">15D</SelectItem>
                <SelectItem value="30D">30D</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 4, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.34} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,.06)" strokeDasharray="4 4" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => formatXAxis(value, timeframe)}
                tick={{ fill: "#64748b", fontSize: 11 }}
                minTickGap={22}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fill: "#64748b", fontSize: 11 }}
                tickFormatter={(value) => `$${value}`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ stroke: "rgba(52,211,153,.22)", strokeWidth: 1 }}
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
              />
              <Area
                key={timeframe}
                type="monotone"
                dataKey="price"
                stroke="#34d399"
                fill="url(#priceGradient)"
                strokeWidth={2.4}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: "#6ee7b7" }}
                isAnimationActive
                animationDuration={720}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function TradingVolumeChart({ data, timeframe, onTimeframeChange }: Omit<MarketChartsProps, "currentPrice" | "priceChange">) {
  return (
    <Card className={chartCardClass}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Trading Volume</CardTitle>
            <CardDescription>
              {timeframe === "1D" ? "24-hour" : timeframe === "1W" ? "7-day" : timeframe.toLowerCase()} trading activity
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-cyan-300/70" />
            <Select value={timeframe} onValueChange={(val) => onTimeframeChange(val as Timeframe)}>
              <SelectTrigger className="h-8 w-[82px] border-white/10 bg-black/20 text-xs">
                <SelectValue placeholder="Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1D">1D</SelectItem>
                <SelectItem value="1W">1W</SelectItem>
                <SelectItem value="15D">15D</SelectItem>
                <SelectItem value="30D">30D</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 4, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="volGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,.06)" strokeDasharray="4 4" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => formatXAxis(value, timeframe)}
                tick={{ fill: "#64748b", fontSize: 11 }}
                minTickGap={22}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 11 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ stroke: "rgba(34,211,238,.20)", strokeWidth: 1 }}
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value: number) => [`$${value.toLocaleString()}`, "Volume"]}
              />
              <Area
                key={timeframe}
                type="monotone"
                dataKey="volume"
                stroke="#22d3ee"
                fill="url(#volGradient)"
                strokeWidth={2.25}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: "#67e8f9" }}
                isAnimationActive
                animationDuration={680}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
