"use client"

import { Suspense } from "react"
import { PassportContent } from "@/components/passport/passport-content"
import { Spinner } from "@/components/ui/spinner"

export default function PassportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[80vh] items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      }
    >
      <PassportContent />
    </Suspense>
  )
}
