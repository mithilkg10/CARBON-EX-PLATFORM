"use client"

import { useState, useMemo } from "react"
import { 
  Leaf, 
  TrendingUp, 
  Zap, 
  Shield,
  Activity,
} from "lucide-react"
import useSWR from "swr"
import { StatsCard } from "./stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { CarbonPriceChart, TradingVolumeChart } from "./market-charts"
import { generateMarketData, type Timeframe } from "@/lib/utils/market-data"

interface DashboardContentProps {
  userId: string
  userRole: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function DashboardContent({ userId, userRole }: DashboardContentProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("30D")

  // Generate the realistic fake dataset depending on the selected timeframe
  const chartData = useMemo(() => generateMarketData(timeframe), [timeframe])

  // Get dynamic KPIs from the very latest data point simulated
  const currentSimulatedPrice = chartData[chartData.length - 1]?.price || 0
  const firstPrice = chartData[0]?.price || 0
  const syncPriceChange = firstPrice > 0 ? ((currentSimulatedPrice - firstPrice) / firstPrice) * 100 : 0
  
  const currentSimulatedVolume = chartData.reduce((acc, point) => acc + point.volume, 0) // rough estimation for timeframe volume

  // Poll real-time data using SWR to automatically update when user buys/sells
  const { data: marketData, isLoading: marketLoading } = useSWR("/api/market/stats", fetcher, { 
    refreshInterval: 3000,
    revalidateOnFocus: true
  })
  
  const { data: passportData, isLoading: passportLoading } = useSWR("/api/passport", fetcher, {
    refreshInterval: 3000,
    revalidateOnFocus: true
  })

  // We combine standard SWR loading states
  if (marketLoading || passportLoading) {
    return <DashboardSkeleton />
  }

  // Use dynamic price from the graph or fallback to marketData
  const displayPrice = currentSimulatedPrice || marketData?.market?.current_price || 0
  const displayVolume = currentSimulatedVolume || marketData?.market?.volume_24h || 0

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Carbon Price"
          value={`$${displayPrice.toFixed(2)}`}
          change={syncPriceChange}
          changeLabel={`over ${timeframe}`}
          icon={TrendingUp}
          iconColor="text-emerald-500"
        />
        <StatsCard
          title="Your Credits"
          value={marketData?.credits?.total?.toLocaleString() || "0"}
          icon={Leaf}
          iconColor="text-primary"
        />
        <StatsCard
          title={`${timeframe === '1D' ? '24h' : timeframe} Volume`}
          value={`$${displayVolume.toLocaleString()}`}
          icon={Activity}
          iconColor="text-amber-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CarbonPriceChart 
          data={chartData} 
          timeframe={timeframe} 
          onTimeframeChange={setTimeframe} 
          currentPrice={displayPrice}
          priceChange={syncPriceChange}
        />
        <TradingVolumeChart 
          data={chartData} 
          timeframe={timeframe} 
          onTimeframeChange={setTimeframe} 
        />
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/trading">
                <Zap className="mr-2 h-4 w-4" />
                Buy Carbon Credits
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/emissions">
                <Leaf className="mr-2 h-4 w-4" />
                Report Emissions
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/passport">
                <Shield className="mr-2 h-4 w-4" />
                View Carbon Passport
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Carbon Passport Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Carbon Passport</CardTitle>
            <CardDescription>Your sustainability profile</CardDescription>
          </CardHeader>
          <CardContent>
            {passportData?.passport ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Company</span>
                  <span className="font-medium">{passportData.passport.companyName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Rating</span>
                  <Badge variant="outline" className="text-primary border-primary">
                    {passportData.passport.sustainabilityRating}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge 
                    variant={passportData.passport.complianceStatus === 'compliant' ? 'default' : 'secondary'}
                    className={passportData.passport.complianceStatus === 'compliant' ? 'bg-emerald-500' : ''}
                  >
                    {passportData.passport.complianceStatus}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">No passport found</p>
                <Button asChild>
                  <Link href="/passport">Generate Passport</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Market Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Traders</CardTitle>
            <CardDescription>By trading volume</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {marketData?.leaderboard?.slice(0, 5).map((company: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium truncate max-w-32">{company.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ${company.volume.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
