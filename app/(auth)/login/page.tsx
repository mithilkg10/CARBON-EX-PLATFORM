"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowRight, Leaf, Lock, Mail, Scale, ShieldCheck, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

const edgeLeaves = [
  { className: "left-[3%] top-[8%] rotate-[-28deg] delay-0", size: "h-16 w-16" },
  { className: "left-[8%] top-[32%] rotate-[18deg] delay-700", size: "h-10 w-10" },
  { className: "left-[2%] bottom-[10%] rotate-[42deg] delay-1000", size: "h-14 w-14" },
  { className: "right-[4%] top-[14%] rotate-[32deg] delay-500", size: "h-14 w-14" },
  { className: "right-[8%] top-[46%] rotate-[-16deg] delay-1200", size: "h-9 w-9" },
  { className: "right-[2%] bottom-[8%] rotate-[-38deg] delay-300", size: "h-16 w-16" },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Login failed")
        return
      }

      router.push(data.user.role === "company" ? "/dashboard" : "/regulator")
    } catch {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050807] px-4 py-8 text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[48rem] w-[48rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.08] blur-[120px]" />
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-lime-400/[0.08] blur-[90px]" />
        <div className="absolute -right-24 bottom-16 h-80 w-80 rounded-full bg-emerald-400/[0.08] blur-[100px]" />
        <div className="carbon-ribbon carbon-ribbon-login-a" />
        <div className="carbon-ribbon carbon-ribbon-login-b" />
        <div className="carbon-orbit carbon-orbit-login" />

        {edgeLeaves.map((leaf, index) => (
          <div key={index} className={`carbon-leaf-float absolute ${leaf.className}`}>
            <Leaf className={`${leaf.size} text-emerald-300/20 drop-shadow-[0_0_18px_rgba(74,222,128,0.28)]`} strokeWidth={1.25} />
          </div>
        ))}
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-emerald-300/10 bg-black/30 shadow-[0_30px_120px_rgba(0,0,0,0.55)] backdrop-blur-2xl lg:grid-cols-[0.95fr_1.05fr]">
          <section className="relative hidden min-h-[640px] border-r border-white/[0.06] bg-gradient-to-br from-emerald-400/[0.08] via-transparent to-transparent p-10 lg:flex lg:flex-col">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl border border-emerald-300/15 bg-emerald-300/10 shadow-[0_0_30px_rgba(52,211,153,0.12)]">
                <Leaf className="h-6 w-6 text-emerald-300" />
              </span>
              <div>
                <div className="text-2xl font-semibold tracking-tight">CarbonEx</div>
                <div className="text-xs uppercase tracking-[.18em] text-emerald-300/70">Secure exchange prototype</div>
              </div>
            </div>

            <div className="my-auto max-w-md">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[0.06] px-3 py-1.5 text-xs font-medium text-emerald-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                Security built into the transaction flow
              </div>
              <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight">
                Carbon-market workflows with access control, auditability and tamper-evident records.
              </h1>
              <p className="mt-5 text-sm leading-7 text-slate-400">
                CarbonEx combines company and regulator workflows with Digital Carbon Passports, controlled trade operations and reviewable audit evidence.
              </p>

              <div className="mt-8 grid gap-3">
                {[
                  "Role-separated company and regulator workflows",
                  "Protected transaction and audit paths",
                  "Synthetic recruiter environment with write actions blocked",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3.5">
                    <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-emerald-400/10">
                      <ShieldCheck className="h-3 w-3 text-emerald-300" />
                    </span>
                    <span className="text-sm leading-6 text-slate-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs leading-5 text-slate-500">
              Research prototype · synthetic recruiter data · no production financial activity
            </p>
          </section>

          <section className="flex min-h-[640px] items-center p-6 sm:p-10 lg:p-12">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-8 lg:hidden">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-300/10">
                    <Leaf className="h-5 w-5 text-emerald-300" />
                  </span>
                  <div>
                    <div className="text-xl font-semibold">CarbonEx</div>
                    <div className="text-xs text-slate-500">Secure exchange prototype</div>
                  </div>
                </div>
              </div>

              <div className="mb-7">
                <p className="text-sm font-medium text-emerald-300">Operator access</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight">Sign in to CarbonEx</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Private accounts use credentials. Recruiters can open a view-only synthetic session below.
                </p>
              </div>

              <Card className="border-white/[0.07] bg-white/[0.025] shadow-none backdrop-blur-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Private workspace</CardTitle>
                  <CardDescription className="text-slate-500">Configured operator accounts only</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <Alert variant="destructive" className="border-red-400/20 bg-red-500/[0.07]">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <Input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 border-white/10 bg-black/20 pl-10 placeholder:text-slate-600 focus-visible:border-emerald-400/50 focus-visible:ring-emerald-400/10"
                        required
                      />
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 border-white/10 bg-black/20 pl-10 placeholder:text-slate-600 focus-visible:border-emerald-400/50 focus-visible:ring-emerald-400/10"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      className="h-11 w-full bg-emerald-400 font-semibold text-emerald-950 shadow-[0_0_25px_rgba(52,211,153,0.15)] hover:bg-emerald-300"
                      disabled={loading}
                    >
                      {loading ? "Signing in..." : <span className="flex items-center gap-2">Sign in <ArrowRight className="h-4 w-4" /></span>}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="my-7 flex items-center gap-3 text-[11px] uppercase tracking-[.16em] text-slate-600">
                <span className="h-px flex-1 bg-white/[0.08]" />
                Recruiter demo
                <span className="h-px flex-1 bg-white/[0.08]" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <form action="/demo-login" method="post">
                  <input type="hidden" name="role" value="company" />
                  <Button type="submit" variant="outline" className="h-12 w-full border-emerald-300/15 bg-emerald-300/[0.04] text-emerald-100 hover:bg-emerald-300/[0.09]">
                    <Leaf className="h-4 w-4" />
                    Company demo
                  </Button>
                </form>

                <form action="/demo-login" method="post">
                  <input type="hidden" name="role" value="regulator" />
                  <Button type="submit" variant="outline" className="h-12 w-full border-white/10 bg-white/[0.025] text-slate-200 hover:bg-white/[0.06]">
                    <Scale className="h-4 w-4" />
                    Regulator demo
                  </Button>
                </form>
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-300/10 bg-emerald-300/[0.035] p-4">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <p className="text-xs leading-5 text-slate-400">
                  Recruiter access requires no username or password and uses synthetic, read-only records.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
