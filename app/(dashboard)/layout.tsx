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
    <div className="flex h-screen bg-background">
      <Sidebar userRole={session.role} userName={session.name} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
