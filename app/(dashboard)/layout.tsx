import { Leaf } from "lucide-react"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { Sidebar } from "@/components/dashboard/sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="carbon-app-shell relative flex overflow-hidden bg-background">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-44 -top-36 h-[36rem] w-[36rem] rounded-full bg-emerald-500/[0.06] blur-[125px] dark:bg-emerald-500/[0.10]" />
        <div className="absolute right-[-8rem] top-[8%] h-[32rem] w-[32rem] rounded-full bg-cyan-400/[0.05] blur-[130px] dark:bg-cyan-400/[0.07]" />
        <div className="absolute bottom-[-15rem] left-[28%] h-[34rem] w-[34rem] rounded-full bg-lime-400/[0.06] blur-[140px]" />

        <div className="carbon-ribbon carbon-ribbon-a" />
        <div className="carbon-ribbon carbon-ribbon-b" />
        <div className="carbon-orbit carbon-orbit-a" />
        <div className="carbon-orbit carbon-orbit-b" />

        <Leaf className="carbon-app-leaf left-[18%] top-[14%] h-9 w-9 rotate-[-24deg]" />
        <Leaf className="carbon-app-leaf right-[12%] top-[26%] h-7 w-7 rotate-[18deg]" />
        <Leaf className="carbon-app-leaf bottom-[18%] left-[38%] h-6 w-6 rotate-[35deg]" />
      </div>

      <div className="relative z-10 flex h-full min-h-0 w-full flex-col lg:flex-row">
        <Sidebar userRole={session.role} userName={session.name} />
        <main className="carbon-workspace min-h-0 min-w-0 flex-1 overflow-auto">
          {session.isDemo && (
            <div className="z-30 border-b border-emerald-600/15 bg-emerald-500/[0.07] px-5 py-2 text-xs text-emerald-900 backdrop-blur-xl dark:border-emerald-300/10 dark:bg-emerald-300/[0.05] dark:text-emerald-100">
              Recruiter demo · synthetic data · your actions run through the real checks and stay in this browser tab
            </div>
          )}
          <div className="mx-auto w-full max-w-[1600px] p-3 sm:p-5 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
