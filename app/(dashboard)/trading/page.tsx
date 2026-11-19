import { requirePageSession } from "@/lib/auth/session"
import { Header } from "@/components/dashboard/header"
import { TradingContent } from "@/components/trading/trading-content"
import { RegulatorMarketView } from "@/components/trading/market-view-regulator"

export default async function TradingPage() {
  const session = await requirePageSession(["company", "regulator", "admin"])
  const supervisor = session.role !== "company"

  return (
    <div className="flex h-full flex-col">
      <Header
        title={supervisor ? "Market supervision" : "Trading console"}
        subtitle={supervisor ? "Exchange activity for regulatory oversight" : "Buy, list and track carbon credits"}
      />
      <div className="min-w-0 flex-1 p-0 pt-4 sm:p-3">
        {supervisor ? <RegulatorMarketView /> : <TradingContent userId={session.userId} />}
      </div>
    </div>
  )
}
