import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { Header } from "@/components/dashboard/header"
import { TradingContent } from "@/components/trading/trading-content"

export default async function TradingPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex flex-col h-full">
      <Header 
        title="Trading Console" 
        subtitle="Buy and sell carbon credits securely"
      />
      <div className="min-w-0 flex-1 p-0 sm:p-3">
        <TradingContent userId={session.userId} userRole={session.role} />
      </div>
    </div>
  )
}
