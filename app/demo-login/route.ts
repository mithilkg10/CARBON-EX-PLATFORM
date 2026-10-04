import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { signToken } from "@/lib/auth/jwt"
import { setSessionCookie } from "@/lib/auth/session"

const DEMO_USERS = {
  company: "demo.company@mithilkg.dev",
  regulator: "demo.regulator@mithilkg.dev",
} as const

export async function POST(request: Request) {
  const formData = await request.formData()
  const requestedRole = String(formData.get("role") ?? "company")
  const role = requestedRole === "regulator" ? "regulator" : "company"
  const user = await db.getUserByEmail(DEMO_USERS[role])

  if (!user || !user.is_demo || user.role !== role) {
    return NextResponse.json({ error: "Recruiter demo is unavailable." }, { status: 503 })
  }

  const token = await signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    companyName: user.company_name,
    isDemo: true,
  })

  await setSessionCookie(token)
  return NextResponse.redirect(new URL(role === "company" ? "/dashboard" : "/regulator", request.url), 303)
}
