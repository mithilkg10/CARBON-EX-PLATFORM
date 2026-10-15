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
      <div className="min-w-0 flex-1 p-0 sm:p-3">
        <EmissionsContent userId={session.userId} />
      </div>
    </div>
  )
}
