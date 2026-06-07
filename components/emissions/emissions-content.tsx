"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import useSWR from "swr"
import {
  Factory,
  Zap,
  Truck,
  Plus,
  Calendar,
  FileCheck,
  AlertTriangle,
  Clock,
  Info
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip as ReactTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { type Timeframe } from "@/lib/utils/market-data"
import { formatXAxis } from "@/components/dashboard/market-charts"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Emission {
  id: string
  type: string
  amount: number
  period: string
  status: string
  source: string
  createdAt: string
}

interface EmissionsData {
  emissions: Emission[]
  totals: {
    scope1: number
    scope2: number
    scope3: number
    total: number
  }
}

interface EmissionsContentProps {
  userId: string
}

// Generate dynamic timeframe-based emissions data
function generateEmissionsSummary(timeframe: Timeframe) {
  const points = [];
  const now = new Date();
  
  let numPoints = 24; 
  let stepMs = 60 * 60 * 1000;
  
  if (timeframe === '1W') {
    numPoints = 7;
    stepMs = 24 * 60 * 60 * 1000;
  } else if (timeframe === '15D') {
    numPoints = 15;
    stepMs = 24 * 60 * 60 * 1000;
  } else if (timeframe === '30D') {
    numPoints = 30;
    stepMs = 24 * 60 * 60 * 1000;
  }

  for (let i = numPoints; i >= 0; i--) {
    const pointTime = new Date(now.getTime() - (i * stepMs));
    points.push({
      date: pointTime.toISOString(),
      scope1: Math.floor(Math.random() * 50) + 10,
      scope2: Math.floor(Math.random() * 40) + 5,
      scope3: Math.floor(Math.random() * 60) + 20,
    });
  }
  return points;
}

export function EmissionsContent({ userId }: EmissionsContentProps) {
  // Use SWR for real-time fetching, caching, and mutation syncing
  const { data, error, isLoading, mutate } = useSWR<EmissionsData>("/api/emissions", fetcher, {
    refreshInterval: 30000, // Poll every 30s instead of 3s to reduce CPU load
  })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  const [timeframe, setTimeframe] = useState<Timeframe>("30D")
  const chartData = useMemo(() => generateEmissionsSummary(timeframe), [timeframe])

  // Form state
  const [emissionType, setEmissionType] = useState("")
  const [amount, setAmount] = useState("")
  const [period, setPeriod] = useState("")
  const [dataSource, setDataSource] = useState("")

  async function handleSubmit() {
    if (!emissionType || !amount || !period) {
      toast.error("Please fill in all required fields")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/emissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emissionType,
          amount: parseFloat(amount),
          reportingPeriod: period,
          dataSource: dataSource || "Manual Entry",
        }),
      })

      const result = await res.json()
      
      if (!res.ok) {
        toast.error(result.error || "Failed to submit emissions")
        return
      }

      toast.success(result.message || "Emissions submitted successfully")
      setDialogOpen(false)
      resetForm()
      
      // Mutate the SWR cache to update KPIs and Table in real time!
      await mutate()
    } catch {
      toast.error("Failed to submit emissions")
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setEmissionType("")
    setAmount("")
    setPeriod("")
    setDataSource("")
  }

  if (isLoading) {
    return <EmissionsSkeleton />
  }

  const scopeIcons = {
    scope1: Factory,
    scope2: Zap,
    scope3: Truck,
  }

  const scopeColors = {
    scope1: "var(--color-chart-1)",
    scope2: "var(--color-chart-2)",
    scope3: "var(--color-chart-3)",
  }

  const pieData = data?.totals ? [
    { name: "Scope 1", value: data.totals.scope1, color: scopeColors.scope1 },
    { name: "Scope 2", value: data.totals.scope2, color: scopeColors.scope2 },
    { name: "Scope 3", value: data.totals.scope3, color: scopeColors.scope3 },
  ] : []

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="col-span-1">
            <Card>
              <CardContent className="pt-6 relative">
                <ReactTooltip>
                  <TooltipTrigger asChild>
                    <Info className="absolute top-4 right-4 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-sm">Direct emissions from owned or controlled sources (e.g., fuel combustion, company vehicles).</p>
                  </TooltipContent>
                </ReactTooltip>
                
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-chart-1/10">
                    <Factory className="h-6 w-6 text-chart-1" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Scope 1</p>
                    <p className="text-2xl font-bold">{data?.totals?.scope1?.toLocaleString() || 0}</p>
                    <p className="text-xs text-muted-foreground">tonnes CO2e</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="pt-6 relative">
                <ReactTooltip>
                  <TooltipTrigger asChild>
                    <Info className="absolute top-4 right-4 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-sm">Indirect emissions from the generation of purchased electricity, steam, heating and cooling globally.</p>
                  </TooltipContent>
                </ReactTooltip>

                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-chart-2/10">
                    <Zap className="h-6 w-6 text-chart-2" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Scope 2</p>
                    <p className="text-2xl font-bold">{data?.totals?.scope2?.toLocaleString() || 0}</p>
                    <p className="text-xs text-muted-foreground">tonnes CO2e</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="pt-6 relative">
                <ReactTooltip>
                  <TooltipTrigger asChild>
                    <Info className="absolute top-4 right-4 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-sm">All other indirect emissions that occur in a company's value chain (e.g., purchased goods, business travel).</p>
                  </TooltipContent>
                </ReactTooltip>

                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-chart-3/10">
                    <Truck className="h-6 w-6 text-chart-3" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Scope 3</p>
                    <p className="text-2xl font-bold">{data?.totals?.scope3?.toLocaleString() || 0}</p>
                    <p className="text-xs text-muted-foreground">tonnes CO2e</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <AlertTriangle className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Live Emissions</p>
                    <AnimatePresence mode="popLayout">
                      <motion.p 
                        key={data?.totals?.total}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl font-bold"
                      >
                        {data?.totals?.total?.toLocaleString() || 0}
                      </motion.p>
                    </AnimatePresence>
                    <p className="text-xs text-muted-foreground">tonnes CO2e</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Bar Chart */}
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">Emissions by Period</CardTitle>
                  <CardDescription>Breakdown by scope dynamically generated</CardDescription>
                </div>
                <Select value={timeframe} onValueChange={(val) => setTimeframe(val as Timeframe)}>
                  <SelectTrigger className="w-[100px] h-8 text-xs">
                    <SelectValue placeholder="Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1D">1 Day</SelectItem>
                    <SelectItem value="1W">1 Week</SelectItem>
                    <SelectItem value="15D">15 Days</SelectItem>
                    <SelectItem value="30D">30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(val) => formatXAxis(val, timeframe)}
                      tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }}
                      minTickGap={20}
                    />
                    <YAxis 
                      tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        color: 'var(--color-foreground)'
                      }}
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                    />
                    <Legend />
                    <Bar dataKey="scope1" stackId="a" fill={scopeColors.scope1} name="Scope 1" />
                    <Bar dataKey="scope2" stackId="a" fill={scopeColors.scope2} name="Scope 2" />
                    <Bar dataKey="scope3" stackId="a" fill={scopeColors.scope3} name="Scope 3" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">Emissions Distribution</CardTitle>
              <CardDescription>Live breakdown matching your submitted logs</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="value"
                      animationDuration={800}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        color: 'var(--color-foreground)'
                      }}
                      formatter={(value: number) => [`${value.toLocaleString()} tonnes`, '']}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Emissions Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Emission Reports</CardTitle>
                <CardDescription>All submitted emission reports directly influence your real-time KPIs above.</CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Report Emissions
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Report Emissions</DialogTitle>
                    <DialogDescription>
                      Submit a new emission report for verification
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Emission Type</label>
                      <Select value={emissionType} onValueChange={setEmissionType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select scope" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scope1">Scope 1 - Direct Emissions</SelectItem>
                          <SelectItem value="scope2">Scope 2 - Electricity</SelectItem>
                          <SelectItem value="scope3">Scope 3 - Supply Chain</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Amount (tonnes CO2e)</label>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Reporting Period</label>
                      <Input
                        type="month"
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Data Source (Optional)</label>
                      <Select value={dataSource} onValueChange={setDataSource}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Smart Meter">Smart Meter</SelectItem>
                          <SelectItem value="Manual Entry">Manual Entry</SelectItem>
                          <SelectItem value="IoT Sensors">IoT Sensors</SelectItem>
                          <SelectItem value="Third Party Audit">Third Party Audit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting}>
                      {submitting ? "Submitting..." : "Submit Report"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {data?.emissions && data.emissions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.emissions.slice(0, 20).map((emission) => {
                    const Icon = scopeIcons[emission.type as keyof typeof scopeIcons] || Factory
                    return (
                      <TableRow key={emission.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="capitalize">{emission.type.replace('scope', 'Scope ')}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {emission.amount.toLocaleString()} tonnes
                        </TableCell>
                        <TableCell>{emission.period}</TableCell>
                        <TableCell className="text-muted-foreground">{emission.source}</TableCell>
                        <TableCell>
                          {emission.status === "verified" ? (
                            <Badge className="bg-emerald-500/10 text-emerald-500">
                              <FileCheck className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : emission.status === "pending" ? (
                            <Badge variant="outline" className="text-amber-500">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              {emission.status}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(emission.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No emission reports yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}

function EmissionsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  )
}
