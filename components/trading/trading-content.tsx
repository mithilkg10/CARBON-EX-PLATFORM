"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import {
  ShoppingCart,
  Tag,
  ArrowRightLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Info,
  TrendingUp,
  Leaf,
  Wallet,
  FileText,
  Plus,
  ShieldCheck,
  Printer,
  Lock,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
import { CarbonPriceChart } from "@/components/dashboard/market-charts"
import { getMarketSeries, getMarketSnapshot, formatUsd, type Timeframe } from "@/lib/market/engine"
import { SecureTransactionLayer } from "./secure-transaction-layer"
import type { TransactionPayload, CommitResult } from "@/lib/security-layer/transaction"
import { usePortfolio, type Credit, type Trade } from "@/hooks/use-portfolio"
import { updateSandbox, recordAction, useSandbox } from "@/lib/demo/sandbox"

interface TradingContentProps {
  userId: string
}

const creditTypeColors: Record<string, string> = {
  renewable: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  forestry: "bg-green-500/10 text-green-700 dark:text-green-400",
  industrial: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  agriculture: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
}

export function TradingContent({ userId }: TradingContentProps) {
  const { portfolio, isLoading, error, refresh } = usePortfolio()
  const sandbox = useSandbox()

  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null)
  const [buyQuantity, setBuyQuantity] = useState("")
  const [buyDialogOpen, setBuyDialogOpen] = useState(false)
  const [listingId, setListingId] = useState<string | null>(null)
  const [stlPayload, setStlPayload] = useState<TransactionPayload | null>(null)
  const [addMoneyDialogOpen, setAddMoneyDialogOpen] = useState(false)
  const [addMoneyAmount, setAddMoneyAmount] = useState("")
  const [addingFunds, setAddingFunds] = useState(false)
  const [receiptTrade, setReceiptTrade] = useState<Trade | null>(null)
  const [activeTab, setActiveTab] = useState("buy")

  const [timeframe, setTimeframe] = useState<Timeframe>("30D")
  const chartData = useMemo(() => getMarketSeries(timeframe), [timeframe])
  const snapshot = useMemo(() => getMarketSnapshot(timeframe), [timeframe])

  const quantity = Number(buyQuantity)
  const quantityValid = selectedCredit !== null && Number.isInteger(quantity) && quantity > 0 && quantity <= selectedCredit.quantity
  const totalCost = selectedCredit && quantityValid ? Math.round(quantity * selectedCredit.pricePerUnit * 100) / 100 : 0

  function openBuy(credit: Credit) {
    setSelectedCredit(credit)
    setBuyQuantity("")
    setBuyDialogOpen(true)
  }

  function handleBuy() {
    if (!selectedCredit || !portfolio) return
    if (!quantityValid) {
      toast.error(`Enter a whole number between 1 and ${selectedCredit.quantity.toLocaleString()}`)
      return
    }
    if (totalCost > portfolio.wallet) {
      toast.error("Insufficient wallet balance", { description: `This purchase costs ${formatUsd(totalCost)}. Add funds to continue.` })
      return
    }
    setStlPayload({
      user_id: userId,
      txn_id: `TXN-${Date.now().toString(36).toUpperCase()}`,
      type: "BUY",
      credits: quantity,
      amount: totalCost,
      timestamp: new Date().toISOString(),
    })
    setBuyDialogOpen(false)
  }

  async function commitPurchase(integrityHash: string): Promise<CommitResult> {
    const credit = selectedCredit!
    const res = await fetch("/api/trade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creditId: credit.id, quantity, action: "buy", integrityHash, walletBalance: portfolio?.wallet }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Trade failed")

    if (data.simulated) {
      updateSandbox(s => ({
        ...s,
        walletDelta: Math.round((s.walletDelta - data.trade.totalPrice) * 100) / 100,
        trades: [data.trade, ...s.trades],
        acquired: data.credit ? [data.credit, ...s.acquired] : s.acquired,
        consumed: { ...s.consumed, [credit.id]: (s.consumed[credit.id] ?? 0) + quantity },
      }))
      recordAction({ action: "TRADE_BUY", entityType: "trade", entityId: data.trade.id, details: { quantity, totalPrice: data.trade.totalPrice, ledgerHash: data.ledger.hash, creditType: credit.type } })
    } else {
      await refresh()
    }
    toast.success(data.message, { description: `Ledger block ${data.ledger.hash.slice(0, 16)}...` })
    return { ledgerHash: data.ledger.hash, previousHash: data.ledger.previousHash, nonce: data.ledger.nonce, message: data.message }
  }

  async function handleListing(credit: Credit, list: boolean) {
    const message = list
      ? `Listed ${credit.quantity.toLocaleString()} ${credit.type} credits at ${formatUsd(credit.pricePerUnit)} each`
      : `Withdrew the ${credit.type} listing from the market`
    // Credits bought inside the demo sandbox exist only in this browser session.
    if (sandbox.acquired.some(c => c.id === credit.id)) {
      updateSandbox(s => ({ ...s, listings: { ...s.listings, [credit.id]: list } }))
      recordAction({ action: list ? "CREDIT_LISTED" : "LISTING_WITHDRAWN", entityType: "credit", entityId: credit.id, details: { quantity: credit.quantity, pricePerUnit: credit.pricePerUnit } })
      toast.success(message)
      return
    }
    setListingId(credit.id)
    try {
      const res = await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditId: credit.id, quantity: credit.quantity, action: list ? "list" : "withdraw" }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Could not update the listing")
        return
      }
      if (data.simulated) {
        updateSandbox(s => ({ ...s, listings: { ...s.listings, [credit.id]: list } }))
        recordAction({ action: list ? "CREDIT_LISTED" : "LISTING_WITHDRAWN", entityType: "credit", entityId: credit.id, details: { quantity: credit.quantity, pricePerUnit: credit.pricePerUnit } })
      } else {
        await refresh()
      }
      toast.success(data.message || message)
    } catch {
      toast.error("Could not update the listing")
    } finally {
      setListingId(null)
    }
  }

  async function handleAddFunds() {
    const amount = Number(addMoneyAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter an amount above zero")
      return
    }
    setAddingFunds(true)
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Could not add funds")
        return
      }
      if (data.simulated) {
        updateSandbox(s => ({ ...s, walletDelta: Math.round((s.walletDelta + data.amount) * 100) / 100 }))
        recordAction({ action: "WALLET_TOPUP", entityType: "wallet", entityId: userId, details: { amount: data.amount } })
      } else {
        await refresh()
      }
      toast.success(data.message)
      setAddMoneyDialogOpen(false)
      setAddMoneyAmount("")
    } catch {
      toast.error("Could not add funds")
    } finally {
      setAddingFunds(false)
    }
  }

  if (isLoading) return <TradingSkeleton />

  if (error || !portfolio) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="mb-4 text-muted-foreground">The trading data could not be loaded.</p>
          <Button onClick={() => refresh()}>Try again</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <CarbonPriceChart
          data={chartData}
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
          currentPrice={snapshot.price}
          priceChange={snapshot.change}
        />
      </motion.div>

      <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-card dark:from-emerald-950/40">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-emerald-500/15 p-3 text-emerald-600 dark:text-emerald-400">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Available balance</p>
              <p className="text-3xl font-bold text-foreground">{formatUsd(portfolio.wallet)}</p>
              <p className="text-xs text-muted-foreground">{portfolio.holdings.toLocaleString()} credits held · market price {formatUsd(snapshot.price)}</p>
            </div>
          </div>
          <Button onClick={() => setAddMoneyDialogOpen(true)} className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700">
            <Plus className="h-4 w-4" /> Add funds
          </Button>
        </CardContent>
      </Card>

      {portfolio.isDemo && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Recruiter demo sandbox</AlertTitle>
          <AlertDescription>
            Every action runs through the real API checks and hashing. Results are kept in this browser tab only, so the shared demo data stays clean for the next visitor.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="buy" className="flex items-center gap-2"><ShoppingCart className="h-4 w-4" />Buy</TabsTrigger>
          <TabsTrigger value="sell" className="flex items-center gap-2"><Tag className="h-4 w-4" />Sell</TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2"><ArrowRightLeft className="h-4 w-4" />History</TabsTrigger>
        </TabsList>

        <TabsContent value="buy">
          <Card>
            <CardHeader>
              <CardTitle>Available carbon credits</CardTitle>
              <CardDescription>Listings from other companies, priced around the current market of {formatUsd(snapshot.price)}</CardDescription>
            </CardHeader>
            <CardContent>
              {portfolio.forPurchase.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Vintage</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Certification</TableHead>
                      <TableHead>Expiry</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {portfolio.forPurchase.map((credit) => (
                      <TableRow key={credit.id}>
                        <TableCell><Badge className={creditTypeColors[credit.type] || "bg-secondary"}>{credit.type}</Badge></TableCell>
                        <TableCell>{credit.vintageYear}</TableCell>
                        <TableCell>{credit.quantity.toLocaleString()}</TableCell>
                        <TableCell className="font-medium">{formatUsd(credit.pricePerUnit)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{credit.certificationBody}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(credit.expiryDate).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => openBuy(credit)}>Buy</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <Leaf className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p>No credits are listed for sale right now</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sell">
          <Card>
            <CardHeader>
              <CardTitle>Your carbon credits</CardTitle>
              <CardDescription>List a holding on the marketplace or withdraw an active listing</CardDescription>
            </CardHeader>
            <CardContent>
              {portfolio.owned.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Vintage</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Certification</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {portfolio.owned.map((credit) => (
                      <TableRow key={credit.id}>
                        <TableCell><Badge className={creditTypeColors[credit.type] || "bg-secondary"}>{credit.type}</Badge></TableCell>
                        <TableCell>{credit.vintageYear}</TableCell>
                        <TableCell>{credit.quantity.toLocaleString()}</TableCell>
                        <TableCell className="font-medium">{formatUsd(credit.pricePerUnit)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{credit.certificationBody}</TableCell>
                        <TableCell>
                          {credit.listed ? (
                            <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-400">Listed</Badge>
                          ) : (
                            <Badge variant="secondary">Held</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={listingId === credit.id}
                            onClick={() => handleListing(credit, !credit.listed)}
                          >
                            {listingId === credit.id ? "Updating..." : credit.listed ? "Withdraw" : "List for sale"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <Tag className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p className="mb-4">You do not hold any credits yet</p>
                  <Button variant="outline" onClick={() => setActiveTab("buy")}>Browse the market</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-emerald-500/10 p-3"><TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total bought</p>
                      <p className="text-2xl font-semibold">{formatUsd(portfolio.summary.totalBought)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-blue-500/10 p-3"><Tag className="h-6 w-6 text-blue-600 dark:text-blue-400" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total sold</p>
                      <p className="text-2xl font-semibold">{formatUsd(portfolio.summary.totalSold)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Trade history</CardTitle>
                <CardDescription>Completed trades with their ledger hash</CardDescription>
              </CardHeader>
              <CardContent>
                {portfolio.trades.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Counterparty</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {portfolio.trades.slice(0, 25).map((trade) => (
                        <TableRow key={trade.id}>
                          <TableCell className="text-muted-foreground">{new Date(trade.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell><Badge variant={trade.isUserBuyer ? "default" : "outline"}>{trade.isUserBuyer ? "Buy" : "Sell"}</Badge></TableCell>
                          <TableCell>{trade.isUserBuyer ? trade.sellerName : trade.buyerName}</TableCell>
                          <TableCell>{trade.quantity}</TableCell>
                          <TableCell>{formatUsd(trade.pricePerUnit)}</TableCell>
                          <TableCell className="font-medium">{formatUsd(trade.totalPrice)}</TableCell>
                          <TableCell>
                            {trade.status === "completed" ? (
                              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-4 w-4" /><span className="text-sm">Completed</span></span>
                            ) : trade.status === "pending" ? (
                              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400"><Clock className="h-4 w-4" /><span className="text-sm">Pending</span></span>
                            ) : (
                              <span className="flex items-center gap-1 text-red-600 dark:text-red-400"><XCircle className="h-4 w-4" /><span className="text-sm capitalize">{trade.status}</span></span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => setReceiptTrade(trade)}>
                              <FileText className="mr-2 h-4 w-4" /> Receipt
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <ArrowRightLeft className="mx-auto mb-4 h-12 w-12 opacity-50" />
                    <p>No trades yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Buy dialog */}
      <Dialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buy carbon credits</DialogTitle>
            <DialogDescription>Purchase {selectedCredit?.type} credits from the marketplace</DialogDescription>
          </DialogHeader>

          {selectedCredit && (
            <div className="space-y-4">
              <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertTitle>STL C³T and STAVP secured</AlertTitle>
                <AlertDescription>
                  The order is encrypted with AES 256 GCM and hashed with SHA 256 in your browser, then checked by the STAVP escrow and chained to the ledger.
                </AlertDescription>
              </Alert>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Credit type</span><Badge className={creditTypeColors[selectedCredit.type]}>{selectedCredit.type}</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Available</span><span>{selectedCredit.quantity.toLocaleString()} credits</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Price per unit</span><span className="font-medium">{formatUsd(selectedCredit.pricePerUnit)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Certification</span><span>{selectedCredit.certificationBody}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Wallet balance</span><span>{formatUsd(portfolio.wallet)}</span></div>
              </div>

              <div className="space-y-2">
                <label htmlFor="buy-quantity" className="text-sm font-medium">Quantity to purchase</label>
                <Input
                  id="buy-quantity"
                  type="number"
                  inputMode="numeric"
                  placeholder={`1 to ${selectedCredit.quantity}`}
                  value={buyQuantity}
                  onChange={(e) => setBuyQuantity(e.target.value)}
                  max={selectedCredit.quantity}
                  min={1}
                  step={1}
                />
                {buyQuantity && (
                  quantityValid ? (
                    <p className={`text-sm ${totalCost > portfolio.wallet ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                      Total: <span className="font-medium text-foreground">{formatUsd(totalCost)}</span>
                      {totalCost > portfolio.wallet && " · exceeds your wallet balance"}
                    </p>
                  ) : (
                    <p className="text-sm text-red-600 dark:text-red-400">Enter a whole number between 1 and {selectedCredit.quantity.toLocaleString()}</p>
                  )
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setBuyDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleBuy} disabled={!quantityValid || totalCost > portfolio.wallet} className="gap-2 bg-blue-600 text-white hover:bg-blue-700">
              <Lock className="h-4 w-4" /> Confirm secure purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {stlPayload && (
        <SecureTransactionLayer
          payload={stlPayload}
          commit={commitPurchase}
          onComplete={() => { setStlPayload(null); setSelectedCredit(null); setBuyQuantity(""); setActiveTab("history") }}
          onCancel={() => setStlPayload(null)}
        />
      )}

      {/* Add funds dialog */}
      <Dialog open={addMoneyDialogOpen} onOpenChange={setAddMoneyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add funds to wallet</DialogTitle>
            <DialogDescription>Enter the amount in USD to add to your trading balance.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <label htmlFor="add-funds" className="text-sm font-medium">Amount (USD)</label>
            <Input id="add-funds" type="number" placeholder="10000" value={addMoneyAmount} onChange={(e) => setAddMoneyAmount(e.target.value)} min={1} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMoneyDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddFunds} disabled={addingFunds} className="bg-emerald-600 text-white hover:bg-emerald-700">
              {addingFunds ? "Adding..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt */}
      <Dialog open={!!receiptTrade} onOpenChange={(open: boolean) => !open && setReceiptTrade(null)}>
        <DialogContent className="overflow-y-auto border-none bg-white p-0 text-zinc-900 shadow-2xl sm:max-w-md">
          <div className="no-print flex items-center justify-between border-b border-zinc-200 bg-zinc-100 px-6 py-4">
            <DialogTitle className="text-zinc-900">Transaction receipt</DialogTitle>
            <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2 border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50">
              <Printer className="h-4 w-4" /> Print
            </Button>
          </div>
          <DialogDescription className="sr-only">Receipt for trade {receiptTrade?.id}</DialogDescription>

          {receiptTrade && (
            <div className="print-document relative space-y-6 p-8">
              <div className="border-b-2 border-zinc-800 pb-4 text-center">
                <h3 className="text-xl font-bold uppercase tracking-wider">CarbonEx trade receipt</h3>
                <p className="text-sm font-medium text-zinc-600">{new Date(receiptTrade.createdAt).toLocaleString()}</p>
              </div>

              <div className="space-y-4 text-sm font-medium">
                {[
                  ["Transaction ID", <span key="id" className="font-mono text-xs">{receiptTrade.id}</span>],
                  ["Type", <span key="t" className="text-base font-bold">{receiptTrade.isUserBuyer ? "PURCHASE" : "SALE"}</span>],
                  ["Counterparty", receiptTrade.isUserBuyer ? receiptTrade.sellerName : receiptTrade.buyerName],
                  ["Quantity", `${receiptTrade.quantity} credits`],
                  ["Price per unit", formatUsd(receiptTrade.pricePerUnit)],
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex justify-between gap-4 border-b border-zinc-200 pb-2">
                    <span className="uppercase text-zinc-600">{label}</span>
                    <span className="text-right">{value}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 text-lg font-bold">
                  <span className="uppercase">Total amount</span>
                  <span>{formatUsd(receiptTrade.totalPrice)}</span>
                </div>
              </div>

              <div className="rounded-md border border-emerald-700/40 bg-emerald-50 p-3">
                <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
                  <ShieldCheck className="h-4 w-4" /> CarbonEx ledger record
                </div>
                <p className="break-all font-mono text-[11px] text-emerald-900">{receiptTrade.ledgerHash}</p>
              </div>

              <p className="text-center text-[11px] italic text-zinc-500">
                Generated by the CarbonEx research prototype from synthetic data. Not a financial or regulatory document.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TradingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-10 w-96 max-w-full" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  )
}
