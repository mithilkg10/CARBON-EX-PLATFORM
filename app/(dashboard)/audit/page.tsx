"use client"

import { Suspense } from "react"
import { AuditContent } from "@/components/audit/audit-content"
import { Spinner } from "@/components/ui/spinner"

export default function AuditPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[80vh] items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      }
    >
      <AuditContent />
    </Suspense>
  )
}
