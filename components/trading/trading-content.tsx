"use client"

import { useEffect, useState, useMemo } from "react"
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
  Download,
  Plus,
  Shield,
  Printer,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { toast } from "sonner"
import { CarbonPriceChart } from "@/components/dashboard/market-charts"
import { generateMarketData, type Timeframe } from "@/lib/utils/market-data"
import { RegulatorMarketView } from "./market-view-regulator"
import { SecureTransactionLayer } from "./secure-transaction-layer"
import type { TransactionPayload } from "@/lib/security-layer/transaction"

interface Credit {
  id: string
  type: string
  vintageYear: number
  quantity: number
  pricePerUnit: number
  expiryDate: string
  certificationBody: string
}

interface Trade {
  id: string
  buyerName: string
  sellerName: string
  quantity: number
  pricePerUnit: number
  totalPrice: number
  status: string
  ledgerHash: string
  createdAt: string
  isUserBuyer: boolean
  isUserSeller: boolean
}

interface TradingContentProps {
  userId: string
  userRole?: string
}

export function TradingContent({ userId, userRole }: TradingContentProps) {
  const [credits, setCredits] = useState<{ forPurchase: Credit[]; forSale: Credit[] } | null>(null)
  const [trades, setTrades] = useState<{ trades: Trade[]; summary: { totalBought: number; totalSold: number } } | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null)
  const [buyQuantity, setBuyQuantity] = useState("")
  const [buyDialogOpen, setBuyDialogOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [listingId, setListingId] = useState<string | null>(null)
  
  const [showSTL, setShowSTL] = useState(false)
  const [stlPayload, setStlPayload] = useState<TransactionPayload | null>(null)

  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [addMoneyDialogOpen, setAddMoneyDialogOpen] = useState(false)
  const [addMoneyAmount, setAddMoneyAmount] = useState("")
  const [receiptTrade, setReceiptTrade] = useState<Trade | null>(null)

  // Chart state
  const [timeframe, setTimeframe] = useState<Timeframe>("30D")
  const chartData = useMemo(() => generateMarketData(timeframe), [timeframe])
  const currentSimulatedPrice = chartData[chartData.length - 1]?.price || 0
  const firstPrice = chartData[0]?.price || 0
  const syncPriceChange = firstPrice > 0 ? ((currentSimulatedPrice - firstPrice) / firstPrice) * 100 : 0

  useEffect(() => {
    fetchData()
    setWalletBalance(Math.floor(Math.random() * 50000) + 10000)
  }, [])

  async function fetchData() {
    try {
      const [creditsRes, tradesRes] = await Promise.all([
        fetch("/api/trade"),
        fetch("/api/trade/history"),
      ])

      if (creditsRes.ok) setCredits(await creditsRes.json())
      if (tradesRes.ok) setTrades(await tradesRes.json())
    } catch (error) {
      console.error("Failed to fetch trading data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleBuy() {
    if (!selectedCredit || !buyQuantity) return
    
    const quantity = parseInt(buyQuantity)
    if (isNaN(quantity) || quantity <= 0 || quantity > selectedCredit.quantity) {
      toast.error("Invalid quantity")
      return
    }
    
    const totalCost = quantity * selectedCredit.pricePerUnit;
    if (walletBalance !== null && totalCost > walletBalance) {
      toast.error("Insufficient wallet balance to complete this purchase")
      return
    }

    setStlPayload({
      user_id: userId || 'USER-123',
      txn_id: `TXN-${Math.floor(Math.random() * 1000000)}`,
      type: 'BUY',
      credits: quantity,
      amount: quantity * selectedCredit.pricePerUnit,
      timestamp: new Date().toISOString()
    })
    setShowSTL(true)
    setBuyDialogOpen(false)
  }

  async function handleSTLComplete() {
    setProcessing(true)
    try {
      const res = await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creditId: selectedCredit!.id,
          quantity: parseInt(buyQuantity),
          action: "buy",
        }),
      })

      const data = await res.json()
      
      if (!res.ok) {
        toast.error(data.error || "Trade failed")
        return
      }

      toast.success(data.message || "Trade executed successfully")
      
      if (walletBalance !== null) {
        setWalletBalance(walletBalance - (parseInt(buyQuantity) * selectedCredit!.pricePerUnit))
      }

      setShowSTL(false)
      setSelectedCredit(null)
      setBuyQuantity("")
      fetchData()
    } catch {
      toast.error("Trade execution failed")
    } finally {
      setProcessing(false)
    }
  }

  const handleListForSale = async (credit: Credit) => {
    setListingId(credit.id)
    setTimeout(() => {
      setListingId(null)
      toast.success("Successfully listed on the marketplace", {
        description: `${credit.quantity} ${credit.type} credits are now live.`,
      })
      if (walletBalance !== null) {
        setWalletBalance(walletBalance + (credit.quantity * credit.pricePerUnit))
      }
      if (credits) {
        setCredits({
          ...credits,
          forSale: credits.forSale.filter((c) => c.id !== credit.id),
        })
      }
    }, 1500)
  }

  if (loading) {
    return <TradingSkeleton />
  }

  if (userRole === "regulator") {
    return <RegulatorMarketView />
  }

  const creditTypeColors: Record<string, string> = {
    renewable: "bg-emerald-500/10 text-emerald-500",
    forestry: "bg-green-500/10 text-green-500",
    industrial: "bg-blue-500/10 text-blue-500",
    agriculture: "bg-amber-500/10 text-amber-500",
  }

  return (
    <div className="space-y-6">
      {/* Replaced AI Prediction with Carbon Price Graph */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <CarbonPriceChart 
          data={chartData} 
          timeframe={timeframe} 
          onTimeframeChange={setTimeframe} 
          currentPrice={currentSimulatedPrice}
          priceChange={syncPriceChange}
        />
      </motion.div>

      {/* Wallet Balance Section */}
      {walletBalance !== null && (
        <Card className="bg-gradient-to-br from-emerald-950/30 to-background border-emerald-500/20">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-500 uppercase tracking-wider">Available Balance</p>
                <p className="text-3xl font-bold text-foreground">${walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
            <Button onClick={() => setAddMoneyDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <Plus className="h-4 w-4" /> Add Funds
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="buy" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="buy" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Buy
          </TabsTrigger>
          <TabsTrigger value="sell" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Sell
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Buy Tab */}
        <TabsContent value="buy">
          <Card>
            <CardHeader>
              <CardTitle>Available Carbon Credits</CardTitle>
              <CardDescription>Browse and purchase verified carbon credits</CardDescription>
            </CardHeader>
            <CardContent>
              {credits?.forPurchase && credits.forPurchase.length > 0 ? (
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
                    {credits.forPurchase.map((credit) => (
                      <TableRow key={credit.id}>
                        <TableCell>
                          <Badge className={creditTypeColors[credit.type] || "bg-secondary"}>
                            {credit.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{credit.vintageYear}</TableCell>
                        <TableCell>{credit.quantity.toLocaleString()}</TableCell>
                        <TableCell className="font-medium">${credit.pricePerUnit.toFixed(2)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{credit.certificationBody}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(credit.expiryDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedCredit(credit)
                              setBuyDialogOpen(true)
                            }}
                          >
                            Buy
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Leaf className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No credits available for purchase</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sell Tab */}
        <TabsContent value="sell">
          <Card>
            <CardHeader>
              <CardTitle>Your Carbon Credits</CardTitle>
              <CardDescription>List your credits for sale on the marketplace</CardDescription>
            </CardHeader>
            <CardContent>
              {credits?.forSale && credits.forSale.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Vintage</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Certification</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {credits.forSale.map((credit) => (
                      <TableRow key={credit.id}>
                        <TableCell>
                          <Badge className={creditTypeColors[credit.type] || "bg-secondary"}>
                            {credit.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{credit.vintageYear}</TableCell>
                        <TableCell>{credit.quantity.toLocaleString()}</TableCell>
                        <TableCell className="font-medium">${credit.pricePerUnit.toFixed(2)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{credit.certificationBody}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            variant="outline"
                            disabled={listingId === credit.id}
                            onClick={() => handleListForSale(credit)}
                          >
                            {listingId === credit.id ? "Listing..." : "List for Sale"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>You don't have any credits to sell</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-emerald-500/10">
                      <TrendingUp className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Bought</p>
                      <p className="text-2xl font-semibold">${trades?.summary?.totalBought?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-blue-500/10">
                      <Tag className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Sold</p>
                      <p className="text-2xl font-semibold">${trades?.summary?.totalSold?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Trade History</CardTitle>
                <CardDescription>All your completed and pending trades</CardDescription>
              </CardHeader>
              <CardContent>
                {trades?.trades && trades.trades.length > 0 ? (
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
                      {trades.trades.slice(0, 20).map((trade) => (
                        <TableRow key={trade.id}>
                          <TableCell className="text-muted-foreground">
                            {new Date(trade.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={trade.isUserBuyer ? "default" : "outline"}>
                              {trade.isUserBuyer ? "Buy" : "Sell"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {trade.isUserBuyer ? trade.sellerName : trade.buyerName}
                          </TableCell>
                          <TableCell>{trade.quantity}</TableCell>
                          <TableCell>${trade.pricePerUnit.toFixed(2)}</TableCell>
                          <TableCell className="font-medium">${trade.totalPrice.toFixed(2)}</TableCell>
                          <TableCell>
                            {trade.status === "completed" ? (
                              <div className="flex items-center gap-1 text-emerald-500">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-sm">Completed</span>
                              </div>
                            ) : trade.status === "pending" ? (
                              <div className="flex items-center gap-1 text-amber-500">
                                <Clock className="h-4 w-4" />
                                <span className="text-sm">Pending</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-red-500">
                                <XCircle className="h-4 w-4" />
                                <span className="text-sm">{trade.status}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {trade.status === "completed" && (
                              <Button variant="outline" size="sm" onClick={() => setReceiptTrade(trade)}>
                                <Download className="h-4 w-4 mr-2" /> Receipt
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <ArrowRightLeft className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No trade history yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Buy Dialog */}
      <Dialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buy Carbon Credits</DialogTitle>
            <DialogDescription>
              Purchase {selectedCredit?.type} credits from the marketplace
            </DialogDescription>
          </DialogHeader>
          
          {selectedCredit && (
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>STAVP Secured</AlertTitle>
                <AlertDescription>
                  This transaction is secured by the Secure Trade Authorization & Verification Protocol with hash-chain verification.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Credit Type</span>
                  <Badge className={creditTypeColors[selectedCredit.type]}>
                    {selectedCredit.type}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Available</span>
                  <span>{selectedCredit.quantity.toLocaleString()} credits</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price per unit</span>
                  <span className="font-medium">${selectedCredit.pricePerUnit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Certification</span>
                  <span>{selectedCredit.certificationBody}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity to Purchase</label>
                <Input
                  type="number"
                  placeholder="Enter quantity"
                  value={buyQuantity}
                  onChange={(e) => setBuyQuantity(e.target.value)}
                  max={selectedCredit.quantity}
                  min={1}
                />
                {buyQuantity && (
                  <p className="text-sm text-muted-foreground">
                    Total: <span className="font-medium text-foreground">
                      ${(parseInt(buyQuantity) * selectedCredit.pricePerUnit).toFixed(2)}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setBuyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBuy} disabled={!buyQuantity} className="bg-blue-600 hover:bg-blue-700">
              🔐 Launch Secure Purchase (STL-C³T)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* STL-C³T Animated UI Overlay */}
      {showSTL && stlPayload && (
        <SecureTransactionLayer 
          payload={stlPayload}
          onComplete={handleSTLComplete}
          onCancel={() => setShowSTL(false)}
        />
      )}

      {/* Add Money Dialog */}
      <Dialog open={addMoneyDialogOpen} onOpenChange={setAddMoneyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Funds to Wallet</DialogTitle>
            <DialogDescription>
              Enter the amount in USD you want to add to your trading balance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (USD)</label>
              <Input
                type="number"
                placeholder="e.g. 10000"
                value={addMoneyAmount}
                onChange={(e) => setAddMoneyAmount(e.target.value)}
                min={1}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMoneyDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => {
                const amount = parseFloat(addMoneyAmount);
                if (!isNaN(amount) && amount > 0) {
                  setWalletBalance((prev) => (prev || 0) + amount);
                  setAddMoneyDialogOpen(false);
                  setAddMoneyAmount("");
                  toast.success(`Successfully added $${amount.toLocaleString()} to your wallet`);
                } else {
                  toast.error("Please enter a valid amount");
                }
              }} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Modal */}
      <Dialog open={!!receiptTrade} onOpenChange={(open: boolean) => !open && setReceiptTrade(null)}>
        <DialogContent className="sm:max-w-md bg-white text-black p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-gray-100 px-6 py-4 flex justify-between items-center border-b border-gray-200 no-print">
            <DialogTitle className="text-black">Transaction Receipt</DialogTitle>
            <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
              <Printer className="h-4 w-4" /> Print
            </Button>
          </div>
          
          {receiptTrade && (
            <div className="p-8 space-y-6 relative print-document">
              <div className="text-center border-b-2 border-gray-800 pb-4">
                <h3 className="text-xl font-bold uppercase tracking-wider">Carbon Exchange Receipt</h3>
                <p className="text-sm text-gray-600 font-medium">{new Date(receiptTrade.createdAt).toLocaleString()}</p>
              </div>

              <div className="space-y-4 text-sm font-medium">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-600 uppercase">Transaction ID</span>
                  <span className="font-mono text-xs">{receiptTrade.id}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-600 uppercase">Type</span>
                  <span className="font-bold text-base">{receiptTrade.isUserBuyer ? "PURCHASE" : "SALE"}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-600 uppercase">Counterparty</span>
                  <span>{receiptTrade.isUserBuyer ? receiptTrade.sellerName : receiptTrade.buyerName}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-600 uppercase">Quantity</span>
                  <span>{receiptTrade.quantity} Credits</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-600 uppercase">Price Per Unit</span>
                  <span>${receiptTrade.pricePerUnit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 text-lg font-bold">
                  <span className="uppercase">Total Amount</span>
                  <span>${receiptTrade.totalPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* Verified Stamp */}
              <div className="mt-8 flex justify-end">
                <div className="transform rotate-[-15deg] right-4 relative">
                  <div className="border-4 border-red-700 rounded-full w-28 h-28 flex items-center justify-center p-1 bg-white opacity-90">
                    <div className="border-2 border-red-700 rounded-full w-full h-full flex flex-col items-center justify-center text-red-700">
                      <Shield className="w-5 h-5 mb-1" />
                      <span className="font-bold tracking-widest uppercase text-[10px]">Verified</span>
                      <span className="text-[8px] uppercase font-bold mt-1 text-center">Govt. Of India<br/>BEE</span>
                    </div>
                  </div>
                </div>
              </div>

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
      <Skeleton className="h-10 w-96" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  )
}
