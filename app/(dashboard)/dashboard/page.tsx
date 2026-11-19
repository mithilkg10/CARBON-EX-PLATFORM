import { requirePageSession } from "@/lib/auth/session"
import { Header } from "@/components/dashboard/header"
import { DashboardContent } from "@/components/dashboard/dashboard-content"

export default async function DashboardPage() {
  const session = await requirePageSession(["company"])

  return (
    <div className="flex h-full flex-col">
      <Header title="Dashboard" subtitle={`Welcome back, ${session.name}`} />
      <div className="min-w-0 flex-1 p-0 pt-4 sm:p-3">
        <DashboardContent userId={session.userId} userRole={session.role} />
      </div>
    </div>
  )
}
