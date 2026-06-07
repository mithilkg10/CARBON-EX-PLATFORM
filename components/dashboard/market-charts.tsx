"use client"

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
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

// Format the X-axis differently based on the timeframe
export const formatXAxis = (dateStr: string, timeframe: Timeframe) => {
  const date = new Date(dateStr)
  if (timeframe === '1D') {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function CarbonPriceChart({ data, timeframe, currentPrice, priceChange, onTimeframeChange }: MarketChartsProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Carbon Credit Price</CardTitle>
            <CardDescription>{timeframe === '1D' ? '24-hour' : timeframe === '1W' ? '7-day' : timeframe.toLowerCase()} price history</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={priceChange >= 0 ? "default" : "destructive"}
              className={priceChange >= 0 ? "bg-emerald-500/10 text-emerald-500" : ""}
            >
              {priceChange >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
              {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(2)}%
            </Badge>
            <Select value={timeframe} onValueChange={(val) => onTimeframeChange(val as Timeframe)}>
              <SelectTrigger className="w-[80px] h-6 text-xs">
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
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => formatXAxis(value, timeframe)}
                className="text-xs"
                tick={{ fill: 'var(--color-muted-foreground)' }}
                minTickGap={20}
              />
              <YAxis 
                domain={['auto', 'auto']}
                className="text-xs"
                tick={{ fill: 'var(--color-muted-foreground)' }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  color: 'var(--color-foreground)'
                }}
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="var(--color-primary)"
                fill="url(#priceGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function TradingVolumeChart({ data, timeframe, onTimeframeChange }: Omit<MarketChartsProps, 'currentPrice' | 'priceChange'>) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Trading Volume</CardTitle>
            <CardDescription>{timeframe === '1D' ? '24-hour' : timeframe === '1W' ? '7-day' : timeframe.toLowerCase()} trading activity</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <Select value={timeframe} onValueChange={(val) => onTimeframeChange(val as Timeframe)}>
              <SelectTrigger className="w-[80px] h-6 text-xs">
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
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="volGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => formatXAxis(value, timeframe)}
                className="text-xs"
                tick={{ fill: 'var(--color-muted-foreground)' }}
                minTickGap={20}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'var(--color-muted-foreground)' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  color: 'var(--color-foreground)'
                }}
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Volume']}
              />
              <Area
                type="monotone"
                dataKey="volume"
                stroke="var(--color-accent)"
                fill="url(#volGradient)"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="volume"
                stroke="var(--color-accent)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
