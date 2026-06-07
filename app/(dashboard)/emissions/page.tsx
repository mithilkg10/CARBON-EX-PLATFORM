import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { Header } from "@/components/dashboard/header"
import { EmissionsContent } from "@/components/emissions/emissions-content"

export default async function EmissionsPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex flex-col h-full">
      <Header 
        title="Emissions Reporting" 
        subtitle="Track and report your carbon emissions"
      />
      <div className="flex-1 overflow-auto p-6">
        <EmissionsContent userId={session.userId} />
      </div>
    </div>
  )
}
