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
import { tooltipStyle } from "@/components/dashboard/market-charts"
import { useSandbox, updateSandbox, recordAction } from "@/lib/demo/sandbox"

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
  summary: Array<{ period: string; scope1: number; scope2: number; scope3: number; total: number }>
  totals: {
    scope1: number
    scope2: number
    scope3: number
    total: number
    verified: number
    pending: number
  }
}

type Range = "6M" | "12M"

function formatPeriod(period: string) {
  const [y, m] = period.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" })
}

interface EmissionsContentProps {
  userId: string
}

export function EmissionsContent({ userId }: EmissionsContentProps) {
  const { data: serverData, isLoading, mutate } = useSWR<EmissionsData>("/api/emissions", fetcher, {
    refreshInterval: 30000,
  })
  const sandbox = useSandbox()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [range, setRange] = useState<Range>("12M")

  // Reports submitted in the recruiter sandbox are merged into the same tables and totals.
  const data = useMemo<EmissionsData | undefined>(() => {
    if (!serverData) return undefined
    if (sandbox.emissions.length === 0) return serverData
    const totals = { ...serverData.totals }
    const byPeriod = new Map(serverData.summary.map(r => [r.period, { ...r }]))
    for (const e of sandbox.emissions) {
      const key = e.type as "scope1" | "scope2" | "scope3"
      totals[key] += e.amount
      totals.total += e.amount
      totals.pending += e.amount
      const row = byPeriod.get(e.period) ?? { period: e.period, scope1: 0, scope2: 0, scope3: 0, total: 0 }
      row[key] += e.amount
      row.total += e.amount
      byPeriod.set(e.period, row)
    }
    return {
      emissions: [...sandbox.emissions, ...serverData.emissions],
      summary: Array.from(byPeriod.values()).sort((a, b) => a.period.localeCompare(b.period)),
      totals,
    }
  }, [serverData, sandbox.emissions])

  const chartData = useMemo(() => {
    const rows = data?.summary ?? []
    return rows.slice(range === "6M" ? -6 : -12).map(r => ({ ...r, label: formatPeriod(r.period) }))
  }, [data, range])

  const currentPeriod = new Date().toISOString().slice(0, 7)

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

      if (result.simulated) {
        updateSandbox(s => ({ ...s, emissions: [result.emission, ...s.emissions] }))
        recordAction({ action: "EMISSION_SUBMIT", entityType: "emission", entityId: result.emission.id, details: { type: result.emission.type, amount: result.emission.amount, period: result.emission.period } })
      } else {
        await mutate()
      }

      toast.success(result.message || "Emissions submitted")
      setDialogOpen(false)
      resetForm()
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
                    <p className="text-sm font-medium text-muted-foreground">Total, last 12 months</p>
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
                    <p className="text-xs text-muted-foreground">
                      tonnes CO2e · {(data?.totals?.pending ?? 0).toLocaleString()} pending verification
                    </p>
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
              <div className="flex flex-wrap gap-3 items-start justify-between">
                <div>
                  <CardTitle className="text-lg">Emissions by month</CardTitle>
                  <CardDescription>Scope 1, 2 and 3 tonnes from your submitted reports</CardDescription>
                </div>
                <Select value={range} onValueChange={(val) => setRange(val as Range)}>
                  <SelectTrigger className="w-[130px] h-8 text-xs" aria-label="Range">
                    <SelectValue placeholder="Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6M">Last 6 months</SelectItem>
                    <SelectItem value="12M">Last 12 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 0, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} minTickGap={8} />
                    <YAxis tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} />
                    <RechartsTooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--color-muted)', opacity: 0.4 }} formatter={(value: number, name: string) => [`${value.toLocaleString()} t`, name]} />
                    <Legend />
                    <Bar dataKey="scope1" stackId="a" fill={scopeColors.scope1} name="Scope 1" />
                    <Bar dataKey="scope2" stackId="a" fill={scopeColors.scope2} name="Scope 2" />
                    <Bar dataKey="scope3" stackId="a" fill={scopeColors.scope3} name="Scope 3" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">Emissions Distribution</CardTitle>
              <CardDescription>Share of each scope across your reports</CardDescription>
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
                      contentStyle={tooltipStyle}
                      formatter={(value: number, name: string) => [`${value.toLocaleString()} tonnes`, name]}
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Emission reports</CardTitle>
                <CardDescription>Every report feeds the totals above and the verified emissions on your carbon passport.</CardDescription>
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
                        <SelectTrigger aria-label="Emission type">
                          <SelectValue placeholder="Select scope" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scope1">Scope 1: direct emissions</SelectItem>
                          <SelectItem value="scope2">Scope 2: purchased energy</SelectItem>
                          <SelectItem value="scope3">Scope 3: value chain</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="emission-amount" className="text-sm font-medium">Amount (tonnes CO2e)</label>
                      <Input
                        id="emission-amount"
                        min={0}
                        type="number"
                        placeholder="Enter amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="emission-period" className="text-sm font-medium">Reporting period</label>
                      <Input
                        id="emission-period"
                        max={currentPeriod}
                        type="month"
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Data Source (Optional)</label>
                      <Select value={dataSource} onValueChange={setDataSource}>
                        <SelectTrigger aria-label="Data source">
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
                  {data.emissions.slice(0, 36).map((emission) => {
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
                        <TableCell>{formatPeriod(emission.period)}</TableCell>
                        <TableCell className="text-muted-foreground">{emission.source}</TableCell>
                        <TableCell>
                          {emission.status === "verified" ? (
                            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                              <FileCheck className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : emission.status === "pending" ? (
                            <Badge variant="outline" className="text-amber-600 dark:text-amber-400">
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
