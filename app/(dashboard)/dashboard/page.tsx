import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { Header } from "@/components/dashboard/header"
import { DashboardContent } from "@/components/dashboard/dashboard-content"

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex flex-col h-full">
      <Header 
        title="Dashboard" 
        subtitle={`Welcome back, ${session.name}`}
      />
      <div className="flex-1 overflow-auto p-6">
        <DashboardContent userId={session.userId} userRole={session.role} />
      </div>
    </div>
  )
}
