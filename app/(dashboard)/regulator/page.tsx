import { requirePageSession } from "@/lib/auth/session"
import { Header } from "@/components/dashboard/header"
import { RegulatorContent } from "@/components/regulator/regulator-content"

export default async function RegulatorPage() {
  await requirePageSession(["regulator", "admin"])

  return (
    <div className="flex h-full flex-col">
      <Header title="Regulator dashboard" subtitle="Market oversight and compliance monitoring" />
      <div className="min-w-0 flex-1 p-0 pt-4 sm:p-3">
        <RegulatorContent />
      </div>
    </div>
  )
}
