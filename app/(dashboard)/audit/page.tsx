import { Suspense } from "react"
import { requirePageSession } from "@/lib/auth/session"
import { Header } from "@/components/dashboard/header"
import { AuditContent } from "@/components/audit/audit-content"
import { Spinner } from "@/components/ui/spinner"

export default async function AuditPage() {
  await requirePageSession(["regulator", "admin"])

  return (
    <div className="flex h-full flex-col">
      <Header title="Audit logs" subtitle="Hash chained record of trading, reporting and regulatory activity" />
      <div className="min-w-0 flex-1 p-0 pt-4 sm:p-3">
        <Suspense fallback={<div className="flex h-[50vh] items-center justify-center"><Spinner className="h-8 w-8" /></div>}>
          <AuditContent />
        </Suspense>
      </div>
    </div>
  )
}
