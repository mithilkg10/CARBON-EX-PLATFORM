"use client"

import { useState, useMemo } from "react"
import { 
  Leaf, 
  TrendingUp, 
  TrendingDown,
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
import { getMarketSeries, getMarketSnapshot, formatUsd, type Timeframe } from "@/lib/market/engine"
import { usePortfolio } from "@/hooks/use-portfolio"

interface DashboardContentProps {
  userId: string
  userRole: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function DashboardContent({ userId, userRole }: DashboardContentProps) {
  void userId
  void userRole
  const [timeframe, setTimeframe] = useState<Timeframe>("30D")

  // Price and volume come from the shared market engine, the same series the trading console uses.
  const chartData = useMemo(() => getMarketSeries(timeframe), [timeframe])
  const snapshot = useMemo(() => getMarketSnapshot(timeframe), [timeframe])

  const { portfolio, isLoading: portfolioLoading } = usePortfolio()
  const { data: marketData, isLoading: marketLoading } = useSWR("/api/market/stats", fetcher, { refreshInterval: 30000 })
  const { data: passportData, isLoading: passportLoading } = useSWR("/api/passport", fetcher, { refreshInterval: 30000 })

  if (marketLoading || passportLoading || portfolioLoading) {
    return <DashboardSkeleton />
  }

  const periodLabel = timeframe === "1D" ? "24h" : timeframe === "1W" ? "7 day" : timeframe === "15D" ? "15 day" : "30 day"

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Carbon price"
          value={formatUsd(snapshot.price)}
          change={snapshot.change}
          changeLabel={`over ${periodLabel}`}
          icon={snapshot.change >= 0 ? TrendingUp : TrendingDown}
          iconColor={snapshot.change >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}
        />
        <StatsCard
          title="Your credits"
          value={(portfolio?.holdings ?? 0).toLocaleString()}
          changeLabel={portfolio ? `Wallet ${formatUsd(portfolio.wallet)}` : undefined}
          icon={Leaf}
          iconColor="text-primary"
        />
        <StatsCard
          title={`${periodLabel} market volume`}
          value={formatUsd(snapshot.periodVolume, 0)}
          changeLabel={`${snapshot.periodCredits.toLocaleString()} credits traded`}
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
          currentPrice={snapshot.price}
          priceChange={snapshot.change}
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
            <CardTitle className="text-lg">Quick actions</CardTitle>
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
                    className={passportData.passport.complianceStatus === 'compliant' ? 'bg-emerald-600 text-white capitalize' : 'capitalize'}
                  >
                    {passportData.passport.complianceStatus}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Trust score</span>
                  <span className="font-medium">{passportData.passport.trustScore}/100</span>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/passport">Open passport</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">No passport yet</p>
                <Button asChild>
                  <Link href="/passport">Generate passport</Link>
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
              {marketData?.leaderboard?.slice(0, 5).map((company: { name: string; volume: number }, index: number) => (
                <div key={company.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium truncate max-w-32">{company.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatUsd(company.volume)}
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
