"use client"

import { useState, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import useSWR from "swr"
import {
  FileText,
  Search,
  Filter,
  Shield,
  ArrowRightLeft,
  Clock,
  Hash,
  Gavel,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Copy,
  FlaskConical,
} from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { tooltipStyle } from "@/components/dashboard/market-charts"
import { useSandbox } from "@/lib/demo/sandbox"

export interface FormattedAuditLog {
  id: string
  timestamp: string
  action: string
  status: string
  entityType: string
  entityId: string
  userId: string
  hash: string
  previousHash: string
  metadata: Record<string, unknown>
  sandbox?: boolean
}

interface AuditApi {
  logs: FormattedAuditLog[]
  ledgerStats: { totalTransactions: number; totalVolume: number; chainIntegrity: boolean; lastVerifiedAt: string }
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }

const GROUPS: Record<string, string[]> = {
  trades: ["TRADE_BUY", "CREDIT_LISTED", "LISTING_WITHDRAWN", "WALLET_TOPUP"],
  reports: ["EMISSION_SUBMIT"],
  regulatory: ["REVIEW_OPENED", "REVIEW_APPROVED", "REVIEW_REJECTED", "ENTITY_FLAGGED", "ENTITY_SUSPENDED", "ENTITY_REINSTATED", "REGISTRATION_REQUEST", "REGISTRATION_ACCEPTED", "REGISTRATION_REJECTED"],
  sessions: ["LOGIN", "LOGOUT"],
}

function groupOf(action: string) {
  return Object.entries(GROUPS).find(([, actions]) => actions.includes(action))?.[0] ?? "other"
}

const GROUP_STYLE: Record<string, string> = {
  trades: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
  reports: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30 dark:text-yellow-400",
  regulatory: "bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-400",
  sessions: "bg-purple-500/15 text-purple-700 border-purple-500/30 dark:text-purple-400",
  other: "bg-muted text-muted-foreground",
}

function describe(log: FormattedAuditLog): string {
  const m = log.metadata as Record<string, string | number | undefined>
  if (m.company) return String(m.company)
  if (m.totalPrice !== undefined) return `${m.quantity} credits · $${Number(m.totalPrice).toLocaleString()}`
  if (m.amount !== undefined && m.period) return `${m.amount} t · ${m.period}`
  if (m.amount !== undefined) return `$${Number(m.amount).toLocaleString()}`
  return log.entityType
}

export function AuditContent() {
  const { data, isLoading, error, mutate } = useSWR<AuditApi>("/api/admin/audit", fetcher, { refreshInterval: 30000 })
  const sandbox = useSandbox()
  const params = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(params.get("q") ?? "")
  const [groupFilter, setGroupFilter] = useState("all")
  const [selectedLog, setSelectedLog] = useState<FormattedAuditLog | null>(null)

  // Actions taken in the recruiter sandbox are shown on top, clearly marked.
  const logs = useMemo<FormattedAuditLog[]>(() => {
    const local: FormattedAuditLog[] = sandbox.actions.map((a) => ({
      id: a.id,
      timestamp: a.timestamp,
      action: a.action,
      status: "sandbox",
      entityType: a.entityType,
      entityId: a.entityId,
      userId: "this demo session",
      hash: "",
      previousHash: "",
      metadata: a.details,
      sandbox: true,
    }))
    return [...local, ...(data?.logs ?? [])]
  }, [data, sandbox.actions])

  const activity = useMemo(() => {
    const days: { day: string; events: number }[] = []
    const DAY = 86400000
    const today = Math.floor(Date.now() / DAY) * DAY
    for (let i = 13; i >= 0; i--) {
      const start = today - i * DAY
      days.push({
        day: new Date(start).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        events: logs.filter((l) => {
          const t = Date.parse(l.timestamp)
          return t >= start && t < start + DAY
        }).length,
      })
    }
    return days
  }, [logs])

  const q = searchQuery.trim().toLowerCase()
  const filteredLogs = logs.filter((log) => {
    const haystack = `${log.action} ${log.entityType} ${log.entityId} ${log.userId} ${JSON.stringify(log.metadata)}`.toLowerCase()
    return (!q || haystack.includes(q)) && (groupFilter === "all" || groupOf(log.action) === groupFilter)
  })

  const statusIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-label="Success" />
      case "failed": return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" aria-label="Failed" />
      case "pending": return <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" aria-label="Pending" />
      case "sandbox": return <FlaskConical className="h-4 w-4 text-violet-600 dark:text-violet-400" aria-label="Demo session" />
      default: return <AlertTriangle className="h-4 w-4 text-muted-foreground" />
    }
  }

  const actionBadge = (action: string) => (
    <Badge className={GROUP_STYLE[groupOf(action)]}>{action.replaceAll("_", " ").toLowerCase()}</Badge>
  )

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Hash copied")
    } catch {
      toast.error("Copy is not available in this browser")
    }
  }

  const count = (group: string) => logs.filter((l) => groupOf(l.action) === group).length

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total events", value: logs.length, icon: Activity, tint: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
          { label: "Trading events", value: count("trades"), icon: ArrowRightLeft, tint: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
          { label: "Regulatory actions", value: count("regulatory"), icon: Gavel, tint: "bg-purple-500/15 text-purple-600 dark:text-purple-400" },
          { label: "Emission reports", value: count("reports"), icon: FileText, tint: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${s.tint}`}><s.icon className="h-6 w-6" /></div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold">{isLoading ? "..." : s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />Activity timeline</CardTitle>
            <CardDescription>Audit events per day, last 14 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activity} margin={{ left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} minTickGap={12} />
                  <YAxis allowDecimals={false} tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--color-muted)", opacity: 0.4 }} />
                  <Bar dataKey="events" name="Events" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />Ledger integrity</CardTitle>
            <CardDescription>Recomputed on every load with SHA 256</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {data?.ledgerStats ? (
              <>
                <div className="flex items-center gap-2">
                  {data.ledgerStats.chainIntegrity
                    ? <><CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /><span className="font-medium">Hash chain intact</span></>
                    : <><XCircle className="h-5 w-5 text-red-600" /><span className="font-medium">Chain broken</span></>}
                </div>
                <div className="flex justify-between"><span className="text-muted-foreground">Ledger blocks</span><span>{data.ledgerStats.totalTransactions}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Settled value</span><span>${data.ledgerStats.totalVolume.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Verified at</span><span>{new Date(data.ledgerStats.lastVerifiedAt).toLocaleTimeString()}</span></div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => mutate()}>Verify again</Button>
              </>
            ) : (
              <p className="text-muted-foreground">{error ? "Ledger status is unavailable." : "Checking..."}</p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Audit trail</CardTitle>
                <CardDescription>Each event is hashed together with the hash of the event before it</CardDescription>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search company, action or ID" className="pl-9 sm:w-64" aria-label="Search audit trail" />
                </div>
                <Select value={groupFilter} onValueChange={setGroupFilter}>
                  <SelectTrigger className="w-[180px]" aria-label="Filter by category">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All events</SelectItem>
                    <SelectItem value="trades">Trading</SelectItem>
                    <SelectItem value="reports">Emission reports</SelectItem>
                    <SelectItem value="regulatory">Regulatory</SelectItem>
                    <SelectItem value="sessions">Sessions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-64 items-center justify-center"><p className="text-muted-foreground">Loading audit trail...</p></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Status</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Hash</TableHead>
                    <TableHead className="text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">No events match this search</p>
                          {(q || groupFilter !== "all") && (
                            <Button variant="outline" size="sm" onClick={() => { setSearchQuery(""); setGroupFilter("all") }}>Clear filters</Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.slice(0, 120).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{statusIcon(log.status)}</TableCell>
                        <TableCell className="whitespace-nowrap font-mono text-xs">{new Date(log.timestamp).toLocaleString()}</TableCell>
                        <TableCell>{actionBadge(log.action)}</TableCell>
                        <TableCell className="max-w-[220px] truncate text-sm">{describe(log)}</TableCell>
                        <TableCell className="max-w-[180px] truncate text-sm">{log.userId}</TableCell>
                        <TableCell>
                          {log.hash ? (
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-xs text-muted-foreground">{log.hash.slice(0, 12)}...</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copy(log.hash)} aria-label="Copy hash"><Copy className="h-3 w-3" /></Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">demo session</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}><Eye className="mr-2 h-4 w-4" />View</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />Audit event</DialogTitle>
            <DialogDescription>
              {selectedLog?.sandbox
                ? "Recorded in this recruiter demo session. It is kept in your browser and not added to the shared chain."
                : "SHA 256 of this event chained to the hash of the previous event"}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><p className="text-sm text-muted-foreground">Event ID</p><p className="break-all font-mono text-sm">{selectedLog.id}</p></div>
                <div className="space-y-1"><p className="text-sm text-muted-foreground">Time</p><p className="font-mono text-sm">{new Date(selectedLog.timestamp).toISOString()}</p></div>
                <div className="space-y-1"><p className="text-sm text-muted-foreground">Action</p>{actionBadge(selectedLog.action)}</div>
                <div className="space-y-1"><p className="text-sm text-muted-foreground">Status</p><div className="flex items-center gap-2">{statusIcon(selectedLog.status)}<span className="capitalize">{selectedLog.sandbox ? "Demo session" : selectedLog.status}</span></div></div>
              </div>
              {selectedLog.hash && (
                <>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Event hash</p>
                    <div className="flex items-center gap-2 rounded-md bg-muted/50 p-2">
                      <Hash className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <code className="flex-1 break-all text-xs">{selectedLog.hash}</code>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copy(selectedLog.hash)} aria-label="Copy hash"><Copy className="h-3 w-3" /></Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Previous hash</p>
                    <div className="flex items-center gap-2 rounded-md bg-muted/50 p-2">
                      <Hash className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <code className="flex-1 break-all text-xs">{selectedLog.previousHash}</code>
                    </div>
                  </div>
                </>
              )}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Details</p>
                <pre className="overflow-auto rounded-md bg-muted/50 p-4 text-xs">{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
