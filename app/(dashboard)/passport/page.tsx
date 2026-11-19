import { requirePageSession } from "@/lib/auth/session"
import { Header } from "@/components/dashboard/header"
import { PassportContent } from "@/components/passport/passport-content"

export default async function PassportPage() {
  await requirePageSession(["company"])

  return (
    <div className="flex h-full flex-col">
      <Header title="Digital carbon passport" subtitle="Verified emissions, credits held and certifications" />
      <div className="min-w-0 flex-1 p-0 pt-4 sm:p-3">
        <PassportContent />
      </div>
    </div>
  )
}
