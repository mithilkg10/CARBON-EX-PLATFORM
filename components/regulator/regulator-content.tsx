"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { toast } from "sonner"
import useSWR from "swr"
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Building2,
  FileSearch,
  Ban,
  Eye,
  MoreHorizontal,
  Filter,
  Brain,
  RotateCcw,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts"
import { StatsCard } from "@/components/dashboard/stats-card"
import { AIAnalytics } from "@/components/regulator/ai-analytics"
import { tooltipStyle } from "@/components/dashboard/market-charts"
import { useSandbox, updateSandbox, recordAction } from "@/lib/demo/sandbox"
import { formatUsd } from "@/lib/market/engine"
import type { FlaggedEntity, ReviewItem, RegistrationRequest } from "@/lib/db/types"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }

interface StatsApi {
  complianceByIndustry: Array<{ industry: string; compliant: number; nonCompliant: number; entities: number }>
  alertDistribution: Array<{ name: string; value: number; color: string }>
  marketHealth: { liquidity: number; stability: number; fraudDetection: number; labels: { liquidity: string; stability: string; fraudDetection: string } }
  stats: { totalEntities: string; pendingReviews: string; complianceRate: string; activeAlerts: string }
}

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || "Action failed")
  return data
}

export function RegulatorContent() {
  const { data: statsData, mutate: mutateStats } = useSWR<StatsApi>("/api/regulator/stats", fetcher, { refreshInterval: 30000 })
  const { data: queueData, mutate: mutateQueues } = useSWR<{ reviews: ReviewItem[]; flagged: FlaggedEntity[] }>("/api/regulator/reviews", fetcher)
  const { data: registrationData, mutate: mutateRegistrations } = useSWR<{ requests: RegistrationRequest[] }>("/api/admin/registrations", fetcher)
  const sandbox = useSandbox()

  const [typeFilter, setTypeFilter] = useState("all")
  const [busy, setBusy] = useState<string | null>(null)
  const [investigating, setInvestigating] = useState<FlaggedEntity | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  const reviews = useMemo(() => (queueData?.reviews ?? []).map(r => (sandbox.reviews[r.id] ? { ...r, status: sandbox.reviews[r.id] } : r)), [queueData, sandbox.reviews])
  const flagged = useMemo(() => (queueData?.flagged ?? []).map(f => (f.id in sandbox.suspended ? { ...f, suspended: sandbox.suspended[f.id] } : f)), [queueData, sandbox.suspended])
  const registrations = useMemo(() => (registrationData?.requests ?? []).map(r => (sandbox.registrations[r.id] ? { ...r, status: sandbox.registrations[r.id] } : r)), [registrationData, sandbox.registrations])

  const openReviews = reviews.filter(r => r.status === "pending" || r.status === "in-review")
  const visibleReviews = reviews.filter(r => typeFilter === "all" || r.type === typeFilter)

  // Sandbox decisions shift the headline numbers the same way a real decision would.
  const stats = useMemo(() => {
    if (!statsData) return null
    const sandboxClosed = Object.keys(sandbox.reviews).length
    const sandboxSuspended = Object.values(sandbox.suspended).filter(Boolean).length
    const critical = flagged.filter(f => !f.suspended && f.severity === "critical").length + openReviews.filter(r => r.risk === "high").length
    const warning = flagged.filter(f => !f.suspended && f.severity === "warning").length + openReviews.filter(r => r.risk === "medium").length
    const info = openReviews.filter(r => r.risk === "low").length
    return {
      ...statsData,
      alertDistribution: [
        { name: "Critical", value: critical, color: "#ef4444" },
        { name: "Warning", value: warning, color: "#f59e0b" },
        { name: "Info", value: info, color: "#3b82f6" },
      ],
      stats: {
        ...statsData.stats,
        pendingReviews: String(openReviews.length),
        activeAlerts: String(critical + warning + info),
      },
      changed: sandboxClosed + sandboxSuspended > 0,
    }
  }, [statsData, sandbox.reviews, sandbox.suspended, flagged, openReviews])

  async function decideReview(review: ReviewItem, decision: "approved" | "rejected") {
    setBusy(review.id)
    try {
      const data = await postJson("/api/regulator/reviews", { id: review.id, decision })
      if (data.simulated) {
        updateSandbox(s => ({ ...s, reviews: { ...s.reviews, [review.id]: decision } }))
        recordAction({ action: decision === "approved" ? "REVIEW_APPROVED" : "REVIEW_REJECTED", entityType: "review", entityId: review.id, details: { company: review.company, type: review.type } })
      } else {
        await Promise.all([mutateQueues(), mutateStats()])
      }
      toast.success(data.message)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed")
    } finally {
      setBusy(null)
    }
  }

  async function toggleSuspend(entity: FlaggedEntity) {
    const suspend = !entity.suspended
    setBusy(entity.id)
    try {
      const data = await postJson("/api/regulator/block", { id: entity.id, action: suspend ? "block" : "unblock" })
      if (data.simulated) {
        updateSandbox(s => ({ ...s, suspended: { ...s.suspended, [entity.id]: suspend } }))
        recordAction({ action: suspend ? "ENTITY_SUSPENDED" : "ENTITY_REINSTATED", entityType: "entity", entityId: entity.id, details: { company: entity.company, reason: entity.reason } })
      } else {
        await Promise.all([mutateQueues(), mutateStats()])
      }
      if (suspend) toast.warning(data.message)
      else toast.success(data.message)
      setInvestigating(cur => (cur && cur.id === entity.id ? { ...cur, suspended: suspend } : cur))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed")
    } finally {
      setBusy(null)
    }
  }

  async function decideRegistration(req: RegistrationRequest, action: "accepted" | "rejected") {
    setBusy(req.id)
    try {
      const data = await postJson("/api/admin/registrations", { id: req.id, action })
      if (data.simulated) {
        updateSandbox(s => ({ ...s, registrations: { ...s.registrations, [req.id]: action } }))
        recordAction({ action: action === "accepted" ? "REGISTRATION_ACCEPTED" : "REGISTRATION_REJECTED", entityType: "registration", entityId: req.id, details: { company: req.company_name } })
      } else {
        await mutateRegistrations()
      }
      toast.success(data.message)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed")
    } finally {
      setBusy(null)
    }
  }

  const riskBadge = (risk: string) =>
    risk === "high" ? <Badge className="border-red-500/30 bg-red-500/15 text-red-700 dark:text-red-400">High risk</Badge>
      : risk === "medium" ? <Badge className="border-yellow-500/30 bg-yellow-500/15 text-yellow-700 dark:text-yellow-400">Medium</Badge>
        : <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Low risk</Badge>

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="border-yellow-500/40 text-yellow-700 dark:text-yellow-400"><Clock className="mr-1 h-3 w-3" />Pending</Badge>
      case "in-review":
        return <Badge variant="outline" className="border-blue-500/40 text-blue-700 dark:text-blue-400"><Eye className="mr-1 h-3 w-3" />In review</Badge>
      case "approved":
      case "accepted":
        return <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 capitalize dark:text-emerald-400"><CheckCircle className="mr-1 h-3 w-3" />{status}</Badge>
      case "rejected":
        return <Badge variant="outline" className="border-red-500/40 text-red-700 dark:text-red-400"><Ban className="mr-1 h-3 w-3" />Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const health = stats?.marketHealth

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Registered entities" value={stats?.stats.totalEntities ?? "..."} changeLabel="across 6 sectors" icon={Building2} />
        <StatsCard title="Open reviews" value={stats?.stats.pendingReviews ?? "..."} changeLabel="pending or in review" icon={Clock} />
        <StatsCard title="Compliance rate" value={stats?.stats.complianceRate ?? "..."} changeLabel="registered entities" icon={CheckCircle} />
        <StatsCard title="Active alerts" value={stats?.stats.activeAlerts ?? "..."} changeLabel="flags and open review risk" icon={AlertTriangle} className="border-red-500/20" />
      </motion.div>

      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({openReviews.length})</TabsTrigger>
            <TabsTrigger value="alerts">Alerts and flags</TabsTrigger>
            <TabsTrigger value="registrations">Registrations ({registrations.filter(r => r.status === "pending").length})</TabsTrigger>
            <TabsTrigger value="ai-analytics" className="gap-1.5"><Brain className="h-4 w-4" />AI analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />Compliance by industry</CardTitle>
                  <CardDescription>Share of registered entities that are compliant</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats?.complianceByIndustry ?? []} layout="vertical" margin={{ left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis type="number" domain={[0, 100]} tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} unit="%" />
                      <YAxis type="category" dataKey="industry" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} width={100} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--color-muted)", opacity: 0.4 }} formatter={(v: number, n: string) => [`${v}%`, n]} />
                      <Bar dataKey="compliant" stackId="a" fill="#10b981" name="Compliant" />
                      <Bar dataKey="nonCompliant" stackId="a" fill="#ef4444" name="Non compliant" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />Alert distribution</CardTitle>
                  <CardDescription>Open alerts by severity, from flags and review risk</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={stats?.alertDistribution ?? []} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" nameKey="name">
                        {(stats?.alertDistribution ?? []).map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 flex flex-wrap justify-center gap-6">
                    {(stats?.alertDistribution ?? []).map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm">{item.name}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />Market health</CardTitle>
                <CardDescription>Liquidity and stability from the live market series; fraud detection from open flags</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  {health && ([
                    ["Market liquidity", health.liquidity, health.labels.liquidity],
                    ["Price stability", health.stability, health.labels.stability],
                    ["Fraud detection", health.fraudDetection, health.labels.fraudDetection],
                  ] as const).map(([label, value, text]) => (
                    <div key={label} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{label}</span>
                        <span className={text === "Low" ? "text-red-600 dark:text-red-400" : text === "Moderate" ? "text-yellow-700 dark:text-yellow-400" : "text-emerald-700 dark:text-emerald-400"}>{text} · {value}</span>
                      </div>
                      <Progress value={value} className="h-2" aria-label={label} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Review queue</CardTitle>
                    <CardDescription>Submissions waiting for a regulatory decision</CardDescription>
                  </div>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[190px]" aria-label="Filter by type">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="Emission Report">Emission report</SelectItem>
                      <SelectItem value="Credit Transfer">Credit transfer</SelectItem>
                      <SelectItem value="Offset Verification">Offset verification</SelectItem>
                      <SelectItem value="Compliance Audit">Compliance audit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleReviews.map((review) => {
                      const open = review.status === "pending" || review.status === "in-review"
                      return (
                        <TableRow key={review.id}>
                          <TableCell className="font-mono text-sm">{review.id}</TableCell>
                          <TableCell className="font-medium">{review.company}</TableCell>
                          <TableCell>{review.type}</TableCell>
                          <TableCell>{review.submitted}</TableCell>
                          <TableCell>{riskBadge(review.risk)}</TableCell>
                          <TableCell>{statusBadge(review.status)}</TableCell>
                          <TableCell className="text-right">
                            {open ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" disabled={busy === review.id} aria-label={`Actions for ${review.id}`}>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => decideReview(review, "approved")}>
                                    <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" /> Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive" onClick={() => decideReview(review, "rejected")}>
                                    <Ban className="mr-2 h-4 w-4" /> Reject
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              <span className="text-xs text-muted-foreground">Closed</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {visibleReviews.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="py-6 text-center text-muted-foreground">No items of this type.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />Flagged entities</CardTitle>
                <CardDescription>Entities the monitoring rules have flagged for attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {flagged.map((entity) => (
                    <div key={entity.id} className="flex flex-col gap-4 rounded-lg border border-border/60 bg-card/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${entity.severity === "critical" ? "bg-red-500/15" : "bg-yellow-500/15"}`}>
                          <AlertTriangle className={`h-5 w-5 ${entity.severity === "critical" ? "text-red-600 dark:text-red-400" : "text-yellow-600 dark:text-yellow-400"}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{entity.company}</span>
                            {entity.severity === "critical" ? <Badge variant="destructive">Critical</Badge> : <Badge className="border-yellow-500/30 bg-yellow-500/15 text-yellow-700 dark:text-yellow-400">Warning</Badge>}
                            {entity.suspended && <Badge variant="outline" className="border-red-500/40 text-red-700 dark:text-red-400">Suspended</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{entity.reason}</p>
                          <p className="text-xs text-muted-foreground">Flagged {entity.flaggedAt}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button variant="outline" size="sm" onClick={() => setInvestigating(entity)}>
                          <FileSearch className="mr-2 h-4 w-4" /> Investigate
                        </Button>
                        <Button variant={entity.suspended ? "outline" : "destructive"} size="sm" disabled={busy === entity.id} onClick={() => toggleSuspend(entity)}>
                          {entity.suspended ? <RotateCcw className="mr-2 h-4 w-4" /> : <Ban className="mr-2 h-4 w-4" />}
                          {entity.suspended ? "Reinstate" : "Suspend"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="registrations" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />Registration requests</CardTitle>
                <CardDescription>Approve or reject new organizations asking to join the exchange</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrations.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell className="font-medium">{req.company_name}</TableCell>
                        <TableCell>{req.name}</TableCell>
                        <TableCell>{req.email}</TableCell>
                        <TableCell>{new Date(req.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{statusBadge(req.status)}</TableCell>
                        <TableCell className="text-right">
                          {req.status === "pending" ? (
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" disabled={busy === req.id} onClick={() => decideRegistration(req, "accepted")}>
                                <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" /> Accept
                              </Button>
                              <Button variant="outline" size="sm" disabled={busy === req.id} className="border-destructive text-destructive" onClick={() => decideRegistration(req, "rejected")}>
                                <Ban className="mr-2 h-4 w-4" /> Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Decided</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {registrations.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="py-4 text-center text-muted-foreground">No registration requests.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-analytics" className="mt-6">
            <AIAnalytics flaggedCount={flagged.filter(f => !f.suspended).length} openReviews={openReviews.length} />
          </TabsContent>
        </Tabs>
      </motion.div>

      <Dialog open={!!investigating} onOpenChange={(open) => !open && setInvestigating(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Investigation: {investigating?.company}</DialogTitle>
            <DialogDescription>{investigating?.reason}</DialogDescription>
          </DialogHeader>
          {investigating && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Severity</p><p className="font-semibold capitalize">{investigating.severity}</p></div>
                <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Trust score</p><p className="font-semibold">{investigating.trustScore}/100</p></div>
                <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Trades, 30 days</p><p className="font-semibold">{investigating.tradesLast30d}</p></div>
                <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Volume, 30 days</p><p className="font-semibold">{formatUsd(investigating.volumeLast30d)}</p></div>
              </div>
              <p className="text-muted-foreground">
                Flagged on {investigating.flaggedAt}. Status: {investigating.suspended ? "suspended from trading" : "active, trading allowed"}.
                The trust score threshold for automatic review is 40.
              </p>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            {investigating && (
              <Button asChild variant="outline">
                <Link href={`/audit?q=${encodeURIComponent(investigating.company)}`}>Open audit trail</Link>
              </Button>
            )}
            {investigating && (
              <Button variant={investigating.suspended ? "outline" : "destructive"} disabled={busy === investigating.id} onClick={() => toggleSuspend(investigating)}>
                {investigating.suspended ? "Reinstate" : "Suspend from trading"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
