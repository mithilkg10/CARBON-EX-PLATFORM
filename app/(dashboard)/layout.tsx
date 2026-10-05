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
    <div className="relative flex h-screen overflow-hidden bg-[#050807]">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-32 h-[34rem] w-[34rem] rounded-full bg-emerald-500/[0.08] blur-[110px]" />
        <div className="absolute right-[8%] top-[12%] h-[28rem] w-[28rem] rounded-full bg-cyan-400/[0.06] blur-[120px]" />
        <div className="absolute bottom-[-12rem] left-[30%] h-[30rem] w-[30rem] rounded-full bg-lime-400/[0.05] blur-[130px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:52px_52px]" />
      </div>

      <div className="relative z-10 flex h-full w-full">
        <Sidebar userRole={session.role} userName={session.name} />
        <main className="min-w-0 flex-1 overflow-auto">
          {session.isDemo && (
            <div className="sticky top-0 z-30 border-b border-emerald-300/10 bg-emerald-300/[0.05] px-5 py-2 text-xs text-emerald-100 backdrop-blur-xl">
              Recruiter demo · synthetic data · view-only access
            </div>
          )}
          <div className="mx-auto w-full max-w-[1600px] p-5 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
