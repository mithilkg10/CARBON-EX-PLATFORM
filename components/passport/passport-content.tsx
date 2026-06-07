"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import useSWR from "swr"
import {
  FileText,
  Shield,
  Leaf,
  TrendingDown,
  Award,
  Download,
  QrCode,
  CheckCircle,
  Clock,
  Building2,
  Calendar,
  Hash,
  Stamp,
  Printer,
  X
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"

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

export function PassportContent() {
  const { data: passportData, isLoading } = useSWR<any>("/api/passport", fetcher)
  const { data: marketData } = useSWR<any>("/api/market/stats", fetcher)

  const [printMode, setPrintMode] = useState<'none' | 'government' | 'audit'>('none')

  const triggerPrint = () => {
    window.print()
  }

  const rawPassport = passportData?.passport;
  const verifStatusMap: Record<string, string> = {
    'compliant': 'verified',
    'non-compliant': 'unverified',
    'pending': 'pending'
  };

  const passport = rawPassport ? {
    id: rawPassport.id || "N/A",
    organizationName: rawPassport.companyName || rawPassport.company_name || "Organization",
    totalEmissions: rawPassport.annualEmissions || rawPassport.annual_emissions || 8500,
    totalOffsets: marketData?.credits?.total || 2150,
    netPosition: (rawPassport.annualEmissions || rawPassport.annual_emissions || 8500) - (marketData?.credits?.total || 2150),
    complianceScore: 85,
    verificationStatus: verifStatusMap[rawPassport.complianceStatus || rawPassport.compliance_status] || "pending",
    issuedAt: rawPassport.createdAt || rawPassport.created_at || new Date().toISOString(),
  } : null;

  const sustainabilityMetrics = [
    { metric: "Emissions", value: passport ? Math.max(0, 100 - (passport.totalEmissions / 100000) * 100) : 80 },
    { metric: "Offsets", value: passport && passport.totalEmissions > 0 ? Math.min(100, (passport.totalOffsets / passport.totalEmissions) * 100) : 50 },
    { metric: "Compliance", value: passport?.complianceScore || 85 },
    { metric: "Trading", value: 75 },
    { metric: "Reporting", value: 88 },
    { metric: "Verification", value: passport?.verificationStatus === "verified" ? 95 : 60 },
  ]

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-muted-foreground">Loading passport data...</div>
      </div>
    )
  }

  if (!passport) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
        <FileText className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold">No Carbon Passport Found</h2>
        <p className="text-muted-foreground">Your organization does not have a carbon passport yet.</p>
        <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">Generate Passport</Button>
      </div>
    )
  }

  // A fully custom print layout rendered dynamically when requested for Preview
  if (printMode !== 'none') {
    return (
      <div className="bg-gray-100 min-h-screen fixed inset-0 z-50 overflow-y-auto no-print-bg">
        {/* Preview Header fixed at the top, hidden during actual native print */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm no-print">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Document Preview Mode</h2>
            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
              {printMode === 'government' ? 'Government Letter Format' : 'Internal Audit Format'}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setPrintMode('none')}>
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
            <Button onClick={triggerPrint} className="bg-emerald-600 hover:bg-emerald-700">
              <Printer className="w-4 h-4 mr-2" /> Print Document
            </Button>
          </div>
        </div>

        {/* The Document Canvas */}
        <div className="py-12 flex justify-center print-canvas">
          <div className="w-[800px] bg-white text-black p-12 shadow-xl font-serif border border-gray-300 print-document">
            <div className="border-4 border-gray-800 p-12 flex flex-col min-h-[900px]">
              
              {/* Header */}
              <div className="text-center mb-10 border-b-2 border-gray-800 pb-8 shrink-0">
                <h1 className="text-3xl font-bold uppercase tracking-wider mb-2">Bureau of Energy Efficiency</h1>
                <h2 className="text-xl tracking-widest text-gray-700 mb-4">Ministry of Environment, Forest and Climate Change</h2>
                <div className="w-24 h-1 bg-gray-800 mx-auto my-4"></div>
                <h3 className="text-2xl font-bold uppercase">Official Proof of Carbon Emission & Compliance</h3>
              </div>

              {/* Organization Profile */}
              <div className="grid grid-cols-2 gap-8 mb-8 shrink-0">
                <div>
                  <p className="font-bold text-gray-500 text-sm uppercase">Organization Name</p>
                  <p className="text-2xl font-bold">{passport.organizationName}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-500 text-sm uppercase">Passport ID</p>
                  <p className="text-lg font-mono">{passport.id}</p>
                  <p className="text-sm mt-1">Issued: {new Date(passport.issuedAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Data Table */}
              <div className="grid grid-cols-3 gap-6 mb-12 bg-gray-50 flex-none p-6 border border-gray-300 shrink-0">
                <div>
                  <p className="font-bold text-gray-600 uppercase text-sm mb-1">Total Verified Emissions</p>
                  <p className="text-2xl font-bold text-red-600">{passport.totalEmissions.toLocaleString()} tCO2e</p>
                </div>
                <div>
                  <p className="font-bold text-gray-600 uppercase text-sm mb-1">Total Carbon Credits</p>
                  <p className="text-2xl font-bold text-green-600">{passport.totalOffsets.toLocaleString()} Credits</p>
                </div>
                <div>
                  <p className="font-bold text-gray-600 uppercase text-sm mb-1">Net Compliance Position</p>
                  <p className="text-2xl font-bold">{passport.netPosition.toLocaleString()} tCO2e</p>
                </div>
              </div>

              {/* Dynamic Content depending on mode */}
              <div className="flex-1 mb-12">
                {printMode === 'government' ? (
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold border-b border-gray-300 pb-2">Active Certifications</h3>
                    <div className="space-y-4 text-sm font-semibold text-gray-800">
                      <p>✓ ISO 14064-1 : Active / Valid until 2028-12-31</p>
                      <p>✓ GHG Protocol : Active / Valid until 2028-06-30</p>
                      <p>• Science Based Targets : Verification in Progress</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold border-b border-gray-300 pb-2">Internal Compliance Audit Record</h3>
                    <table className="w-full text-left border-collapse border border-gray-400">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-400 p-3 w-1/4">Auditor Name</th>
                          <th className="border border-gray-400 p-3 w-1/4">Role / Department</th>
                          <th className="border border-gray-400 p-3 w-1/4">Audit Date</th>
                          <th className="border border-gray-400 p-3 w-1/4">Remarks & Signature</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...Array(4)].map((_, i) => (
                          <tr key={i} className="h-16">
                            <td className="border border-gray-400 p-3"></td>
                            <td className="border border-gray-400 p-3"></td>
                            <td className="border border-gray-400 p-3"></td>
                            <td className="border border-gray-400 p-3"></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Stamp and Disclaimer Flow Footer */}
              <div className="shrink-0 mt-8 relative flex flex-col items-end">
                {/* Visual authenticity stamp physically drawn above footer text but keeping document flow */}
                <div className="mb-8 mr-12 transform rotate-[-15deg]">
                  <div className="border-4 border-red-700 rounded-full w-32 h-32 flex items-center justify-center p-1 bg-white opacity-90">
                    <div className="border-2 border-red-700 rounded-full w-full h-full flex flex-col items-center justify-center text-red-700 bg-white">
                      <Shield className="w-6 h-6 mb-1" />
                      <span className="font-bold tracking-widest uppercase text-xs">Verified</span>
                      <span className="text-[9px] uppercase font-bold mt-1">Govt. Of India</span>
                    </div>
                  </div>
                </div>

                <div className="w-full text-center border-t border-gray-400 pt-4">
                  <p className="text-xs text-gray-500 font-sans italic">
                    <strong>Disclaimer Note:</strong> This document is generated via the current platform which provides only a temporary carbon passport. This document cannot be used as an original legal certification until manually verified by the relevant authorities.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Global styles injected only when printMode is active to ensure the browser print matches preview */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body { background: white !important; }
            .no-print, .no-print * { display: none !important; }
            .no-print-bg { background: white !important; position: static !important; }
            .print-canvas { padding: 0 !important; }
            .print-document { box-shadow: none !important; border: none !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
          }
        `}} />
      </div>
    )
  }

  return (
    <motion.div
      className="space-y-6 p-6 no-print"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Digital Carbon Passport</h1>
          <p className="text-muted-foreground">Bureau of Energy Efficiency Format - Government Bonafide Letter</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 shrink-0 bg-blue-600/10 text-blue-500 border-blue-500/20 hover:bg-blue-600/20 hover:text-blue-400" onClick={() => setPrintMode('audit')}>
            <Printer className="h-4 w-4" /> Download Audit PDF
          </Button>
          <Button className="gap-2 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setPrintMode('government')}>
            <Download className="h-4 w-4" /> Download Govt. Passport
          </Button>
        </div>
      </motion.div>

      {/* Modern Passport Overview Card */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 to-background shadow-lg">
          <CardContent className="p-0">
            <div className="grid md:grid-cols-3">
              {/* Identity Panel */}
              <div className="border-r border-border/50 p-8 flex flex-col justify-center">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
                    <Leaf className="h-8 w-8 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{passport.organizationName}</h3>
                    <p className="text-sm font-medium text-emerald-500">Verified Platform User</p>
                  </div>
                </div>
                <div className="space-y-4 mt-auto">
                  <div className="flex items-center gap-3 text-sm">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground w-20">ID:</span>
                    <span className="font-mono text-foreground font-medium">{passport.id.slice(0, 16)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground w-20">Sector:</span>
                    <span className="font-medium">Industrial</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground w-20">Issued:</span>
                    <span className="font-medium">{new Date(passport.issuedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Data Panel */}
              <div className="border-r border-border/50 p-8 bg-black/20">
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6">Emission Metrics</h4>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Total Verified Emissions</span>
                      <span className="font-bold text-lg">{passport.totalEmissions.toLocaleString()} tCO2e</span>
                    </div>
                    <Progress value={Math.min(100, (passport.totalEmissions / 100000) * 100)} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Total Carbon Credits Owned</span>
                      <span className="font-bold text-lg text-emerald-400">{passport.totalOffsets.toLocaleString()}</span>
                    </div>
                    <Progress value={Math.min(100, (passport.totalOffsets / passport.totalEmissions) * 100)} className="h-2 [&>div]:bg-emerald-500" />
                  </div>
                  <div className="pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Net Liability Position</span>
                      <span className={`font-bold text-xl ${passport.netPosition <= 0 ? "text-emerald-400" : "text-amber-400"}`}>
                        {passport.netPosition > 0 ? "+" : ""}{passport.netPosition.toLocaleString()} tCO2e
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Verified Stamp Panel */}
              <div className="p-8 flex flex-col items-center justify-center relative bg-gradient-to-br from-emerald-500/5 to-transparent">
                <div className="mb-4">
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-4 py-1 text-sm">
                    <CheckCircle className="mr-2 h-4 w-4" /> Platform Verified
                  </Badge>
                </div>
                
                {/* Visual authenticity stamp */}
                <div className="mt-4 mb-6 transform rotate-[-5deg]">
                  <div className="w-32 h-32 rounded-full border-4 border-emerald-500/40 flex items-center justify-center p-1">
                     <div className="w-full h-full rounded-full border border-dashed border-emerald-500/60 flex flex-col items-center justify-center">
                       <Stamp className="h-8 w-8 text-emerald-500/80 mb-1" />
                       <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/80">Authentic</span>
                     </div>
                  </div>
                </div>
                
                <p className="text-xs text-center text-muted-foreground max-w-[200px] mt-auto">
                  This platform gives only the temporary passport and cannot be used originally.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Metrics Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Sustainability Radar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-400" />
              Sustainability Score
            </CardTitle>
            <CardDescription>Multi-dimensional performance analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={sustainabilityMetrics}>
                <PolarGrid stroke="var(--color-border)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                <PolarRadiusAxis 
                   angle={30} 
                   domain={[0, 100]} 
                   tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }} 
                   axisLine={false} 
                 />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="var(--color-primary)"
                  fill="var(--color-primary)"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Existing Certificates Layout included in new page */}
        <Card className="flex flex-col">
          <CardHeader>
             <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-400" />
              Active Certifications
            </CardTitle>
            <CardDescription>Standardized compliance tracking</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4">
            {[
              { name: "ISO 14064-1", status: "Active", expires: "2028-12-31" },
              { name: "GHG Protocol", status: "Active", expires: "2028-06-30" },
              { name: "Science Based Targets", status: "Verification in Progress", expires: "N/A" },
            ].map((cert, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border border-border/50 rounded-lg bg-black/20 hover:bg-black/40 transition-colors">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                  <Award className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate">{cert.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {cert.status === "Active" ? `Expires: ${cert.expires}` : "Verification in progress"}
                  </p>
                </div>
                <Badge variant={cert.status === "Active" ? "default" : "secondary"} className="shrink-0">
                  {cert.status}
                </Badge>
              </div>
            ))}
            
            <div className="mt-auto pt-4">
               <div className="rounded-lg bg-emerald-500/10 p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                    <span className="font-medium text-sm">On track for 2030 targets</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Current trajectory shows 45% reduction by 2030. Maintain your ISO 14064-1 to keep certification.
                  </p>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </motion.div>
  )
}
