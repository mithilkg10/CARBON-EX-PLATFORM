"use client"

import { useState } from "react"
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
  Search,
  Filter,
  Download,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { StatsCard } from "@/components/dashboard/stats-card"
import { AIAnalytics } from "@/components/regulator/ai-analytics"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

// Mock data for regulator view
const complianceByIndustry = [
  { industry: "Energy", compliant: 85, nonCompliant: 15 },
  { industry: "Manufacturing", compliant: 72, nonCompliant: 28 },
  { industry: "Transport", compliant: 68, nonCompliant: 32 },
  { industry: "Agriculture", compliant: 91, nonCompliant: 9 },
  { industry: "Mining", compliant: 65, nonCompliant: 35 },
]

const alertDistribution = [
  { name: "Critical", value: 12, color: "#ef4444" },
  { name: "Warning", value: 34, color: "#f59e0b" },
  { name: "Info", value: 156, color: "#3b82f6" },
]

const initialPendingReviews = [
  { id: "REV-001", company: "EcoSteel Industries", type: "Emission Report", submitted: "2024-01-15", status: "pending", risk: "high" },
  { id: "REV-002", company: "GreenTech Solutions", type: "Credit Transfer", submitted: "2024-01-14", status: "pending", risk: "low" },
  { id: "REV-003", company: "Carbon Neutral Corp", type: "Offset Verification", submitted: "2024-01-13", status: "in-review", risk: "medium" },
  { id: "REV-004", company: "SustainaPower Ltd", type: "Compliance Audit", submitted: "2024-01-12", status: "pending", risk: "low" },
  { id: "REV-005", company: "BlueOcean Shipping", type: "Emission Report", submitted: "2024-01-11", status: "in-review", risk: "high" },
  { id: "REV-006", company: "AeroDynamics Inc", type: "Credit Transfer", submitted: "2024-01-10", status: "pending", risk: "medium" },
  { id: "REV-007", company: "SolarFlare Energy", type: "Offset Verification", submitted: "2024-01-09", status: "pending", risk: "low" },
  { id: "REV-008", company: "Global Logistics", type: "Compliance Audit", submitted: "2024-01-08", status: "in-review", risk: "high" },
  { id: "REV-009", company: "AgriGrow Co", type: "Emission Report", submitted: "2024-01-07", status: "pending", risk: "low" },
  { id: "REV-010", company: "NextGen Motors", type: "Credit Transfer", submitted: "2024-01-06", status: "in-review", risk: "medium" },
  { id: "REV-011", company: "WindForce Power", type: "Offset Verification", submitted: "2024-01-05", status: "pending", risk: "low" },
  { id: "REV-012", company: "PetroChem Dynamics", type: "Compliance Audit", submitted: "2024-01-04", status: "pending", risk: "high" },
  { id: "REV-013", company: "Urban Constructors", type: "Emission Report", submitted: "2024-01-03", status: "in-review", risk: "medium" },
  { id: "REV-014", company: "TechNova Cloud", type: "Credit Transfer", submitted: "2024-01-02", status: "pending", risk: "low" },
  { id: "REV-015", company: "DeepSea Mining", type: "Compliance Audit", submitted: "2024-01-01", status: "pending", risk: "high" },
]

const initialFlaggedEntities = [
  { id: "FL-001", company: "DarkCarbon Inc", reason: "Suspicious trading patterns", severity: "critical", flaggedAt: "2024-01-15" },
  { id: "FL-002", company: "GrayZone Manufacturing", reason: "Incomplete emission reports", severity: "warning", flaggedAt: "2024-01-14" },
  { id: "FL-003", company: "QuestionMark Energy", reason: "Trust score below threshold", severity: "warning", flaggedAt: "2024-01-13" },
  { id: "FL-004", company: "Shadow Logistics", reason: "Unverified credit sources", severity: "critical", flaggedAt: "2024-01-12" },
  { id: "FL-005", company: "Obscure Holdings", reason: "Sudden spike in transfers", severity: "warning", flaggedAt: "2024-01-11" },
  { id: "FL-006", company: "Phantom Exports", reason: "Mismatched ledger records", severity: "critical", flaggedAt: "2024-01-10" },
  { id: "FL-007", company: "Dusk Mining", reason: "Overdue compliance audit", severity: "warning", flaggedAt: "2024-01-09" },
  { id: "FL-008", company: "Mirage Energy", reason: "Multiple rejected reports", severity: "critical", flaggedAt: "2024-01-08" },
]

export function RegulatorContent() {
  // Use SWR with refreshInterval to continuously poll for new dynamic data
  const { data: regulatorData } = useSWR("/api/regulator/stats", fetcher, { refreshInterval: 5000 })
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIndustry, setSelectedIndustry] = useState("all")
  const [blockedEntities, setBlockedEntities] = useState<string[]>([])
  
  const [pendingReviews, setPendingReviews] = useState(initialPendingReviews)
  const [flaggedEntities, setFlaggedEntities] = useState(initialFlaggedEntities)

  const { data: registrationData, mutate: mutateRegistrations } = useSWR("/api/admin/registrations", fetcher, { refreshInterval: 5000 })
  const registrationRequests = registrationData?.requests || []

  const handleRegistrationAction = async (id: string, actionName: 'accepted' | 'rejected') => {
    try {
      await fetch('/api/admin/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: actionName })
      })
      mutateRegistrations()
      toast.success(`Registration ${actionName}`, {
        description: `The request has been ${actionName}.`,
      })
    } catch (e) {
      toast.error('Action failed')
    }
  }

  const handleAction = (id: string, actionName: string, company: string) => {
    setPendingReviews(prev => prev.filter(review => review.id !== id))
    toast.success(`Review ${actionName}`, {
      description: `Action applied to ${company}'s submission.`,
    })
  }

  const handleInvestigate = (companyName: string) => {
    toast("Investigation started from now", {
      description: `Reviewing activity for ${companyName}`,
    })
  }

  const handleToggleBlock = async (id: string, companyName: string) => {
    const isBlocked = blockedEntities.includes(id)
    
    // Optimistic UI update
    if (isBlocked) {
      setBlockedEntities(prev => prev.filter(e => e !== id))
      toast("User Unblocked", { description: `${companyName} can now access the platform.` })
    } else {
      setBlockedEntities(prev => [...prev, id])
      toast.error("Taken out from platform", { description: `${companyName} has been put in the blocklist.` })
    }

    try {
      await fetch("/api/regulator/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: isBlocked ? 'unblock' : 'block' })
      })
    } catch (e) {
      console.error("Failed to block user", e)
    }
  }

  // Bind dynamic data or fallback to mock data while loading
  const dynamicComplianceByIndustry = regulatorData?.complianceByIndustry || complianceByIndustry
  const dynamicAlertDistribution = regulatorData?.alertDistribution || alertDistribution
  const dynamicStats = regulatorData?.stats || {
    totalEntities: "2,847",
    pendingReviews: "47",
    complianceRate: "78.3%",
    activeAlerts: "12"
  }
  const dynamicMarketHealth = regulatorData?.marketHealth || {
    liquidity: 85,
    stability: 62,
    fraudDetection: 94
  }

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "high":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">High Risk</Badge>
      case "medium":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Medium</Badge>
      default:
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Low Risk</Badge>
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>
      case "warning":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Warning</Badge>
      default:
        return <Badge variant="secondary">Info</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="border-yellow-500/30 text-yellow-400">
            <Clock className="mr-1 h-3 w-3" /> Pending
          </Badge>
        )
      case "in-review":
        return (
          <Badge variant="outline" className="border-blue-500/30 text-blue-400">
            <Eye className="mr-1 h-3 w-3" /> In Review
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
            <CheckCircle className="mr-1 h-3 w-3" /> Approved
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <motion.div
      className="space-y-6 p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Regulator Dashboard</h1>
          <p className="text-muted-foreground">Market oversight and compliance monitoring</p>
        </div>

      </motion.div>

      {/* Stats Overview */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Entities"
          value={dynamicStats.totalEntities}
          change={12.5}
          icon={Building2}
        />
        <StatsCard
          title="Pending Reviews"
          value={dynamicStats.pendingReviews}
          change={-8.2}
          icon={Clock}
        />
        <StatsCard
          title="Compliance Rate"
          value={dynamicStats.complianceRate}
          change={2.1}
          icon={CheckCircle}
        />
        <StatsCard
          title="Active Alerts"
          value={dynamicStats.activeAlerts}
          change={3}
          icon={AlertTriangle}
          className="border-red-500/20"
        />
      </motion.div>

      {/* Main Content Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reviews">Pending Reviews</TabsTrigger>
            <TabsTrigger value="alerts">Alerts & Flags</TabsTrigger>
            <TabsTrigger value="registrations">Registration Requests</TabsTrigger>
            <TabsTrigger value="ai-analytics">🤖 AI Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Compliance by Industry */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                    Compliance by Industry
                  </CardTitle>
                  <CardDescription>Industry-wide compliance rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dynamicComplianceByIndustry} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                      <YAxis type="category" dataKey="industry" stroke="hsl(var(--muted-foreground))" width={100} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="compliant" stackId="a" fill="#10b981" name="Compliant %" />
                      <Bar dataKey="nonCompliant" stackId="a" fill="#ef4444" name="Non-Compliant %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Alert Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    Alert Distribution
                  </CardTitle>
                  <CardDescription>Active alerts by severity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={dynamicAlertDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {dynamicAlertDistribution.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 flex justify-center gap-6">
                    {dynamicAlertDistribution.map((item: any) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm">{item.name}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Market Health Indicators */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-emerald-400" />
                  Market Health Indicators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Market Liquidity</span>
                      <span className="text-emerald-400">High</span>
                    </div>
                    <Progress value={dynamicMarketHealth.liquidity} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Price Stability</span>
                      <span className="text-yellow-400">Moderate</span>
                    </div>
                    <Progress value={dynamicMarketHealth.stability} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Fraud Detection</span>
                      <span className="text-emerald-400">Optimal</span>
                    </div>
                    <Progress value={dynamicMarketHealth.fraudDetection} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Pending Reviews</CardTitle>
                    <CardDescription>Items requiring regulatory approval</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                      <SelectTrigger className="w-[150px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="emission">Emission Report</SelectItem>
                        <SelectItem value="transfer">Credit Transfer</SelectItem>
                        <SelectItem value="offset">Offset Verification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                    {pendingReviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell className="font-mono text-sm">{review.id}</TableCell>
                        <TableCell className="font-medium">{review.company}</TableCell>
                        <TableCell>{review.type}</TableCell>
                        <TableCell>{review.submitted}</TableCell>
                        <TableCell>{getRiskBadge(review.risk)}</TableCell>
                        <TableCell>{getStatusBadge(review.status)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleAction(review.id, "Approved", review.company)}>
                                <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" /> Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => handleAction(review.id, "Rejected", review.company)}>
                                <Ban className="mr-2 h-4 w-4" /> Reject
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  Flagged Entities
                </CardTitle>
                <CardDescription>Entities requiring immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {flaggedEntities.map((entity) => (
                    <div
                      key={entity.id}
                      className="flex items-center justify-between rounded-lg border border-border/50 bg-card/50 p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          entity.severity === "critical" ? "bg-red-500/20" : "bg-yellow-500/20"
                        }`}>
                          <AlertTriangle className={`h-5 w-5 ${
                            entity.severity === "critical" ? "text-red-400" : "text-yellow-400"
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{entity.company}</span>
                            {getSeverityBadge(entity.severity)}
                          </div>
                          <p className="text-sm text-muted-foreground">{entity.reason}</p>
                          <p className="text-xs text-muted-foreground">Flagged: {entity.flaggedAt}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleInvestigate(entity.company)}
                        >
                          <FileSearch className="mr-2 h-4 w-4" /> Investigate
                        </Button>
                        <Button 
                          variant={blockedEntities.includes(entity.id) ? "outline" : "destructive"} 
                          size="sm"
                          onClick={() => handleToggleBlock(entity.id, entity.company)}
                        >
                          <Ban className="mr-2 h-4 w-4" /> 
                          {blockedEntities.includes(entity.id) ? "Unblock" : "Suspend"}
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
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-400" />
                  Registration Requests
                </CardTitle>
                <CardDescription>Approve or reject new organization access</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrationRequests.map((req: any) => (
                      <TableRow key={req.id}>
                        <TableCell className="font-medium">{req.company_name}</TableCell>
                        <TableCell>{req.name}</TableCell>
                        <TableCell>{req.email}</TableCell>
                        <TableCell>{getStatusBadge(req.status)}</TableCell>
                        <TableCell className="text-right">
                          {req.status === 'pending' && (
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleRegistrationAction(req.id, 'accepted')}>
                                <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" /> Accept
                              </Button>
                              <Button variant="outline" size="sm" className="text-destructive border-destructive" onClick={() => handleRegistrationAction(req.id, 'rejected')}>
                                <Ban className="mr-2 h-4 w-4" /> Reject
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {registrationRequests.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                          No pending registration requests.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-analytics" className="mt-6">
            <AIAnalytics />
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}
