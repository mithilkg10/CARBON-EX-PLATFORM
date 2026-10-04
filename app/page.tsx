import Link from "next/link"
import { ArrowRight, FileCheck2, Fingerprint, KeyRound, Leaf, LockKeyhole, Scale, ShieldCheck } from "lucide-react"

const security = [
  { icon: KeyRound, title: "Role-based access", text: "Company, regulator and administrator workflows are separated by authenticated role checks." },
  { icon: LockKeyhole, title: "Protected transaction flow", text: "Trade operations pass through authenticated API routes and a transaction security layer before ledger recording." },
  { icon: Fingerprint, title: "Tamper-evident records", text: "Transaction and audit records retain cryptographic linkage so reviewers can inspect integrity relationships." },
  { icon: FileCheck2, title: "Auditability", text: "Trading, emissions, identity and regulatory activity are represented through reviewable audit records." },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2 font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10"><Leaf className="h-5 w-5 text-primary" /></span>
            CarbonEx
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">Operator sign in</Link>
            <form action="/demo-login" method="post">
              <input type="hidden" name="role" value="company" />
              <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Open recruiter demo</button>
            </form>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-20 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
        <div>
          <p className="mb-4 text-sm font-medium uppercase tracking-[.18em] text-primary">Secure carbon-market research prototype</p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">Carbon credit exchange designed with security and auditability built in.</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground">
            CarbonEx combines carbon-credit trading, Digital Carbon Passports, emissions reporting and regulator workflows with a dedicated application-security architecture. The emphasis is not only on market functionality, but on authenticated roles, protected transactions, tamper-evident records and auditable actions.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <form action="/demo-login" method="post">
              <input type="hidden" name="role" value="company" />
              <button className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">Company recruiter demo <ArrowRight className="h-4 w-4" /></button>
            </form>
            <form action="/demo-login" method="post">
              <input type="hidden" name="role" value="regulator" />
              <button className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-3 text-sm font-medium hover:bg-muted">Regulator recruiter demo <Scale className="h-4 w-4" /></button>
            </form>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">One click. Synthetic data. Demo sessions are view-only for state-changing operations.</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-5 w-5 text-primary" /> Security architecture</div>
          <div className="mt-5 space-y-4">
            {security.map(({icon: Icon,title,text}) => (
              <div key={title} className="rounded-xl border border-border/70 p-4">
                <div className="flex items-center gap-2 font-medium"><Icon className="h-4 w-4 text-primary" />{title}</div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border/70 bg-muted/20">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <div className="grid gap-6 md:grid-cols-3">
            <div><p className="text-sm font-semibold">Digital Carbon Passport</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Company identity, emissions posture, compliance state and sustainability records in one reviewable profile.</p></div>
            <div><p className="text-sm font-semibold">Secure exchange workflow</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Authenticated trade paths, escrow-style transaction handling and ledger-linked records for the prototype exchange.</p></div>
            <div><p className="text-sm font-semibold">Regulatory oversight</p><p className="mt-2 text-sm leading-6 text-muted-foreground">A separate regulator view for compliance review, platform activity and audit evidence.</p></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 text-sm leading-6 text-muted-foreground">
          <strong className="text-foreground">Engineering scope:</strong> CarbonEx is a research prototype, not a production financial exchange or certified cryptographic system. Experimental security components are presented as engineering work and are not claimed as production-certified cryptography.
        </div>
      </section>
    </main>
  )
}
