"use client"

import { Suspense } from "react"
import { RegulatorContent } from "@/components/regulator/regulator-content"
import { Spinner } from "@/components/ui/spinner"

export default function RegulatorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[80vh] items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      }
    >
      <RegulatorContent />
    </Suspense>
  )
}
