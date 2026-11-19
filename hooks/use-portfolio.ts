"use client"

import useSWR from "swr"
import { useMemo } from "react"
import { useSandbox, type SandboxCredit, type SandboxTrade } from "@/lib/demo/sandbox"

export type Credit = SandboxCredit
export type Trade = SandboxTrade

interface TradeApi {
  forPurchase: Credit[]
  forSale: Credit[]
  holdings: number
  wallet: { balance: number }
  isDemo: boolean
}

interface HistoryApi {
  trades: Trade[]
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

/**
 * Credits, wallet and trade history for the signed in company, with the recruiter
 * sandbox applied on top so demo actions show up everywhere in the session.
 */
export function usePortfolio(enabled = true) {
  const { data: tradeData, error: tradeError, isLoading: tradeLoading, mutate: mutateTrade } =
    useSWR<TradeApi>(enabled ? "/api/trade" : null, fetcher, { revalidateOnFocus: true })
  const { data: historyData, error: historyError, isLoading: historyLoading, mutate: mutateHistory } =
    useSWR<HistoryApi>(enabled ? "/api/trade/history" : null, fetcher, { revalidateOnFocus: true })
  const sandbox = useSandbox()

  const merged = useMemo(() => {
    if (!tradeData) return null
    const forPurchase = tradeData.forPurchase
      .map(c => ({ ...c, quantity: c.quantity - (sandbox.consumed[c.id] ?? 0) }))
      .filter(c => c.quantity > 0)
    const owned = [...sandbox.acquired, ...tradeData.forSale]
      .map(c => (c.id in sandbox.listings ? { ...c, listed: sandbox.listings[c.id] } : c))
    const holdings = owned.reduce((sum, c) => sum + c.quantity, 0)
    const trades = [...sandbox.trades, ...(historyData?.trades ?? [])]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const totalBought = trades.filter(t => t.isUserBuyer).reduce((s, t) => s + t.totalPrice, 0)
    const totalSold = trades.filter(t => t.isUserSeller).reduce((s, t) => s + t.totalPrice, 0)
    return {
      forPurchase,
      owned,
      holdings,
      wallet: Math.round((tradeData.wallet.balance + sandbox.walletDelta) * 100) / 100,
      trades,
      summary: { totalBought: Math.round(totalBought * 100) / 100, totalSold: Math.round(totalSold * 100) / 100 },
      isDemo: tradeData.isDemo,
    }
  }, [tradeData, historyData, sandbox])

  return {
    portfolio: merged,
    isLoading: tradeLoading || historyLoading,
    error: tradeError || historyError,
    refresh: () => Promise.all([mutateTrade(), mutateHistory()]),
  }
}
