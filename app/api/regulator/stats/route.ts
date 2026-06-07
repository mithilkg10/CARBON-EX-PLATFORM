import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.role !== 'regulator' && session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Admin or regulator role required.' },
        { status: 403 }
      )
    }

    const passports = await db.getAllPassports()
    const users = await db.getAllUsers()
    const emissions = await db.getAllEmissions()

    // 1. Dynamic "Compliance by Industry" data
    // We aggregate actual data from passports, then add a slight random fluctuation 
    // to simulate live market data "changing" as requested.
    const targetIndustries = ["Energy", "Manufacturing", "Transport", "Agriculture", "Mining", "Technology"]
    
    const complianceByIndustry = targetIndustries.map(industry => {
      const industryPassports = passports.filter(p => p.industry_sector === industry)
      let compliant = 0;
      let total = industryPassports.length;
      
      if (total > 0) {
        compliant = industryPassports.filter(p => p.compliance_status === 'compliant').length
      } else {
        // Fallback for demo purposes if no passports exist for this industry
        compliant = Math.floor(Math.random() * 40) + 40;
        total = 100;
      }
      
      const baseCompliantPercent = Math.round((compliant / total) * 100);
      
      // Fluctuation to make the graph dynamic (-3% to +3%)
      const fluctuation = Math.floor(Math.random() * 7) - 3;
      const finalCompliant = Math.min(100, Math.max(0, baseCompliantPercent + fluctuation));
      
      return {
        industry,
        compliant: finalCompliant,
        nonCompliant: 100 - finalCompliant
      }
    })

    // 2. Alert Distribution (dynamic simulation)
    const alertDistribution = [
      { name: "Critical", value: Math.floor(Math.random() * 5) + 5, color: "#ef4444" },
      { name: "Warning", value: Math.floor(Math.random() * 15) + 20, color: "#f59e0b" },
      { name: "Info", value: Math.floor(Math.random() * 30) + 100, color: "#3b82f6" },
    ]

    // 3. Market Health Indicators (dynamic simulation)
    const marketHealth = {
      liquidity: Math.floor(Math.random() * 15) + 75, // 75-90
      stability: Math.floor(Math.random() * 20) + 55, // 55-75
      fraudDetection: Math.floor(Math.random() * 10) + 85 // 85-95
    }

    // 4. Top Stats Dashboard Values
    // Add some simulated growth/variation so numbers keep moving
    const totalEntities = users.length * 100 + Math.floor(Math.random() * 50) 
    const pendingReviewsCount = emissions.filter(e => e.verification_status === 'pending').length + Math.floor(Math.random() * 10)
    
    // Overall compliance rate
    const compliantPassports = passports.filter(p => p.compliance_status === 'compliant').length
    const baseComplianceRate = passports.length > 0 ? (compliantPassports / passports.length) * 100 : 78.3
    const dynamicComplianceRate = (baseComplianceRate + (Math.random() * 2 - 1)).toFixed(1)

    const activeAlerts = alertDistribution.reduce((sum, a) => sum + a.value, 0)

    return NextResponse.json({
      complianceByIndustry,
      alertDistribution,
      marketHealth,
      stats: {
        totalEntities: totalEntities.toLocaleString(),
        pendingReviews: pendingReviewsCount.toString(),
        complianceRate: `${dynamicComplianceRate}%`,
        activeAlerts: activeAlerts.toString()
      }
    })
  } catch (error) {
    console.error('Regulator stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch regulator stats' },
      { status: 500 }
    )
  }
}
