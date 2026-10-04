"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowLeft, ArrowRight, Leaf, Lock, Mail, Scale, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

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
    <main className="min-h-screen bg-background p-4">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full gap-8 lg:grid-cols-[.9fr_1.1fr]">
          <section className="hidden rounded-2xl border border-border bg-card p-8 lg:block">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to overview</Link>
            <div className="mt-14 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10"><Leaf className="h-6 w-6 text-primary" /></span><span className="text-2xl font-semibold">CarbonEx</span></div>
            <h1 className="mt-8 text-3xl font-semibold tracking-tight">Private operator access</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Sign in only if you have a configured CarbonEx operator account. Recruiters do not need credentials.</p>
            <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-2 text-sm font-medium"><ShieldCheck className="h-4 w-4 text-primary" />Recruiter access is isolated</div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">Demo identities use synthetic records and state-changing API operations remain blocked.</p>
            </div>
          </section>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="text-2xl">Sign in</CardTitle>
              <CardDescription>CarbonEx operator workspace</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
                <div className="relative"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required /></div>
                <div className="relative"><Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" required /></div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing in..." : <span className="flex items-center gap-2">Sign in <ArrowRight className="h-4 w-4" /></span>}</Button>
              </form>

              <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[.14em] text-muted-foreground"><span className="h-px flex-1 bg-border" />Recruiter demo<span className="h-px flex-1 bg-border" /></div>
              <div className="grid gap-2 sm:grid-cols-2">
                <form action="/demo-login" method="post"><input type="hidden" name="role" value="company" /><Button type="submit" variant="outline" className="w-full"><Leaf className="h-4 w-4" />Company view</Button></form>
                <form action="/demo-login" method="post"><input type="hidden" name="role" value="regulator" /><Button type="submit" variant="outline" className="w-full"><Scale className="h-4 w-4" />Regulator view</Button></form>
              </div>
              <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">No demo username or password required. Synthetic, recruiter-safe data only.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
