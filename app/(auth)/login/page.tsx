"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Leaf, Lock, Mail, AlertCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'register' | 'setup_password'>('login')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (mode === 'login') {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })
        const data = await res.json()

        if (!res.ok) {
          if (data.error?.includes('requires_password_setup') || data.error?.includes('password not set')) {
            setMode('setup_password')
            setError("Your registration was approved! Please set your new password.")
            setLoading(false)
            return
          }
          setError(data.error || "Login failed")
          setLoading(false)
          return
        }

        if (data.user.role === "regulator" || data.user.role === "admin") {
          router.push("/regulator")
        } else {
          router.push("/dashboard")
        }
      } else if (mode === 'register') {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: 'register', email, name, company_name: companyName }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || "Registration failed")
        } else {
          setError(data.message)
          setMode('login')
          setPassword("")
        }
        setLoading(false)
      } else if (mode === 'setup_password') {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: 'set_password', email, password }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || "Setup failed")
        } else {
          setError("Password set successfully! Please login.")
          setMode('login')
          setPassword("")
        }
        setLoading(false)
      }
    } catch {
      setError("An unexpected error occurred")
      setLoading(false)
    }
  }

  const demoCredentials = [
    { role: "Company (ACME Corp)", email: "acme@company.com", password: "company123" },
    { role: "Regulator (EPA)", email: "reg@gov.com", password: "regulator123" },
    { role: "Admin", email: "admin@carbonex.com", password: "admin123" },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Leaf className="w-6 h-6 text-primary" />
          </div>
          <span className="text-2xl font-bold tracking-tight">CarbonEx</span>
        </div>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Register Account' : 'Setup Password'}
            </CardTitle>
            <CardDescription>
              {mode === 'login' ? 'Sign in to access the Carbon Credit Exchange' : mode === 'register' ? 'Apply for platform access' : 'Set your permanent password'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {mode === 'register' && (
                <>
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Company Name"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {mode !== 'register' && (
                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder={mode === 'setup_password' ? "New Password" : "Password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {mode === 'login' ? 'Sign in' : mode === 'register' ? 'Submit Registration' : 'Set Password'}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>

            {mode === 'login' && (
              <div className="mt-4 text-center">
                <Button variant="link" onClick={() => setMode('register')} className="text-sm">
                  Don't have an account? Apply for Registration
                </Button>
              </div>
            )}
            
            {mode === 'register' && (
              <div className="mt-4 text-center">
                <Button variant="link" onClick={() => setMode('login')} className="text-sm">
                  Already have an account? Sign in
                </Button>
              </div>
            )}

            {/* Demo credentials */}
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground text-center mb-3">
                Demo Credentials
              </p>
              <div className="space-y-2">
                {demoCredentials.map((cred) => (
                  <button
                    key={cred.role}
                    type="button"
                    onClick={() => {
                      setEmail(cred.email)
                      setPassword(cred.password)
                    }}
                    className="w-full p-2 rounded-md bg-secondary/50 hover:bg-secondary text-sm text-left transition-colors"
                  >
                    <span className="font-medium text-foreground">{cred.role}:</span>{" "}
                    <span className="text-muted-foreground font-mono text-xs">{cred.email}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Secure, AI-powered carbon credit trading platform
        </p>
      </motion.div>
    </div>
  )
}
