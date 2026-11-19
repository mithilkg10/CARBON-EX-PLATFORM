import { requirePageSession } from "@/lib/auth/session"
import { Header } from "@/components/dashboard/header"
import { EmissionsContent } from "@/components/emissions/emissions-content"

export default async function EmissionsPage() {
  const session = await requirePageSession(["company"])

  return (
    <div className="flex h-full flex-col">
      <Header title="Emissions reporting" subtitle="Track and report Scope 1, 2 and 3 emissions" />
      <div className="min-w-0 flex-1 p-0 pt-4 sm:p-3">
        <EmissionsContent userId={session.userId} />
      </div>
    </div>
  )
}
