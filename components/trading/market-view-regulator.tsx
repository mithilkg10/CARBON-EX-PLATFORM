"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts"
import { Users, Activity } from "lucide-react"

type RegulatorTimeframe = "real-time" | "1D" | "1W" | "15D" | "3M" | "6M" | "1Y"

export function RegulatorMarketView() {
  const [timeframe, setTimeframe] = useState<RegulatorTimeframe>("1W")

  // Generate dynamic fake data based on timeframe
  const data = useMemo(() => {
    const dataPoints = []
    let numPoints = 7
    let intervalMultiplier = 1
    
    switch(timeframe) {
      case "real-time": numPoints = 12; intervalMultiplier = 0.05; break; // minutes
      case "1D": numPoints = 24; intervalMultiplier = 1; break; // hours
      case "1W": numPoints = 7; intervalMultiplier = 24; break; // days
      case "15D": numPoints = 15; intervalMultiplier = 24; break;
      case "3M": numPoints = 12; intervalMultiplier = 24 * 7; break; // weeks
      case "6M": numPoints = 24; intervalMultiplier = 24 * 7; break;
      case "1Y": numPoints = 12; intervalMultiplier = 24 * 30; break; // months
    }

    const now = new Date()
    let baseCredits = 5000
    let baseUsers = 120

    for (let i = numPoints; i >= 0; i--) {
      const d = new Date(now.getTime() - i * intervalMultiplier * 60 * 60 * 1000)
      
      // Simulate growth and fluctuation
      const noise = Math.random() * 0.2 - 0.1
      baseCredits = Math.floor(baseCredits * (1 + noise + 0.05))
      baseUsers = Math.floor(baseUsers * (1 + (noise * 0.5) + 0.02))

      dataPoints.push({
        time: timeframe === 'real-time' || timeframe === '1D' 
          ? `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`
          : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        creditsTraded: baseCredits,
        newUsers: baseUsers
      })
    }
    return dataPoints
  }, [timeframe])

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Market Supervision</h2>
          <p className="text-muted-foreground">Real-time exchange metrics for regulatory bodies</p>
        </div>
        <div className="w-48">
          <Select value={timeframe} onValueChange={(val: RegulatorTimeframe) => setTimeframe(val)}>
            <SelectTrigger>
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="real-time">Real Time</SelectItem>
              <SelectItem value="1D">1 Day</SelectItem>
              <SelectItem value="1W">1 Week</SelectItem>
              <SelectItem value="15D">15 Days</SelectItem>
              <SelectItem value="3M">3 Months</SelectItem>
              <SelectItem value="6M">6 Months</SelectItem>
              <SelectItem value="1Y">1 Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Volume of Credits Traded
            </CardTitle>
            <CardDescription>Total number of carbon credits bought and sold</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="creditsTraded"
                    name="Credits Traded"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              Platform Adoption
            </CardTitle>
            <CardDescription>Number of active users participating in the market</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="newUsers"
                    name="Active Users"
                    stroke="#3b82f6"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
