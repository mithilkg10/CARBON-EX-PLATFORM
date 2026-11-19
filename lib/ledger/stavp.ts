// STAVP: Secure Trade Authorization & Verification Protocol
// Validates a trade, locks the credit, chains a SHA-256 ledger entry to the previous
// one, settles ownership and records the trade. In simulate mode (recruiter demo) every
// check and hash is computed exactly the same way but nothing shared is written.

import { db, generateId, sha256Hex } from '@/lib/db'
import type { Trade, LedgerEntry, CarbonCredit } from '@/lib/db/types'

export interface STAVPTransaction {
  buyerId: string
  sellerId: string
  creditId: string
  quantity: number
  pricePerUnit: number
  integrityHash?: string
}

export interface STAVPResult {
  success: boolean
  simulated?: boolean
  trade?: Trade
  ledgerEntry?: LedgerEntry
  buyerCredit?: CarbonCredit
  error?: string
  verificationHash?: string
}

function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function executeSTAVP(transaction: STAVPTransaction, options: { simulate?: boolean } = {}): Promise<STAVPResult> {
  const { buyerId, sellerId, creditId, quantity, pricePerUnit, integrityHash } = transaction
  const simulate = options.simulate === true

  const credit = await db.getCreditById(creditId)
  if (!credit) return { success: false, error: 'Credit not found' }
  if (credit.owner_id !== sellerId) return { success: false, error: 'Seller does not own this credit' }
  if (credit.status !== 'available' || !credit.listed) return { success: false, error: 'This credit is no longer listed for sale' }
  if (!Number.isInteger(quantity) || quantity <= 0) return { success: false, error: 'Quantity must be a whole number above zero' }
  if (credit.quantity < quantity) return { success: false, error: `Only ${credit.quantity} credits are available in this listing` }

  const pending = (await db.getAllTrades()).some(t => t.credit_id === creditId && t.status === 'pending')
  if (pending) return { success: false, error: 'Credit is locked in a pending transaction' }

  if (!simulate) await db.updateCredit(creditId, { status: 'locked' })

  try {
    const nonce = generateNonce()
    const now = new Date().toISOString()
    const tradeId = `trd_${generateId()}`
    const transactionString = JSON.stringify({ tradeId, buyerId, sellerId, creditId, quantity, pricePerUnit, nonce, integrityHash: integrityHash ?? null, timestamp: now })
    const lastEntry = await db.getLastLedgerEntry()
    const previousHash = lastEntry?.transaction_hash || '0'.repeat(64)
    const transactionHash = sha256Hex(`${previousHash}|${transactionString}`)

    const trade: Trade = {
      id: tradeId,
      buyer_id: buyerId,
      seller_id: sellerId,
      credit_id: creditId,
      quantity,
      price_per_unit: pricePerUnit,
      total_price: Math.round(quantity * pricePerUnit * 100) / 100,
      trade_type: 'buy',
      status: 'completed',
      ledger_hash: transactionHash,
      created_at: now,
      completed_at: now,
    }

    const ledgerEntry: LedgerEntry = {
      id: `led_${generateId()}`,
      trade_id: tradeId,
      transaction_hash: transactionHash,
      previous_hash: previousHash,
      nonce,
      action: 'trade',
      data: transactionString,
      timestamp: now,
      verified: true,
    }

    const buyerCredit: CarbonCredit = {
      id: quantity === credit.quantity ? credit.id : `crd_${generateId()}`,
      owner_id: buyerId,
      credit_type: credit.credit_type,
      vintage_year: credit.vintage_year,
      quantity,
      price_per_unit: pricePerUnit,
      expiry_date: credit.expiry_date,
      status: 'available',
      listed: false,
      certification_body: credit.certification_body,
      created_at: now,
    }

    if (!simulate) {
      await db.addTrade(trade)
      await db.addLedgerEntry(ledgerEntry)
      if (quantity === credit.quantity) {
        await db.updateCredit(creditId, { owner_id: buyerId, status: 'available', listed: false, price_per_unit: pricePerUnit })
      } else {
        await db.updateCredit(creditId, { quantity: credit.quantity - quantity, status: 'available' })
        await db.addCredit(buyerCredit)
      }
    }

    return { success: true, simulated: simulate, trade, ledgerEntry, buyerCredit, verificationHash: transactionHash }
  } catch (error) {
    if (!simulate) await db.updateCredit(creditId, { status: 'available' })
    return { success: false, error: error instanceof Error ? error.message : 'Transaction failed' }
  }
}

export async function verifyTransaction(transactionHash: string): Promise<{
  valid: boolean
  entry?: LedgerEntry
  chainIntact: boolean
  message: string
}> {
  const ledger = await db.getLedger()
  const entryIndex = ledger.findIndex(e => e.transaction_hash === transactionHash)
  if (entryIndex === -1) {
    return { valid: false, chainIntact: false, message: 'Transaction not found in ledger' }
  }
  const entry = ledger[entryIndex]

  let chainIntact = true
  for (let i = 1; i <= entryIndex; i++) {
    if (ledger[i].previous_hash !== ledger[i - 1].transaction_hash) {
      chainIntact = false
      break
    }
  }

  const previousHash = entryIndex > 0 ? ledger[entryIndex - 1].transaction_hash : '0'.repeat(64)
  const hashValid = sha256Hex(`${previousHash}|${entry.data}`) === entry.transaction_hash

  return {
    valid: hashValid && chainIntact,
    entry,
    chainIntact,
    message: hashValid && chainIntact
      ? 'Transaction verified successfully. Hash chain is intact.'
      : hashValid
        ? 'Transaction hash is valid but chain integrity is compromised.'
        : 'Transaction hash verification failed.',
  }
}

export async function getLedgerStats(): Promise<{
  totalTransactions: number
  totalVolume: number
  chainIntegrity: boolean
  lastVerifiedAt: string
}> {
  const ledger = await db.getLedger()
  const trades = await db.getAllTrades()
  const totalVolume = trades.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.total_price, 0)

  let chainIntegrity = true
  for (let i = 0; i < ledger.length; i++) {
    const previousHash = i > 0 ? ledger[i - 1].transaction_hash : '0'.repeat(64)
    if (ledger[i].previous_hash !== previousHash || sha256Hex(`${previousHash}|${ledger[i].data}`) !== ledger[i].transaction_hash) {
      chainIntegrity = false
      break
    }
  }

  return {
    totalTransactions: ledger.length,
    totalVolume: Math.round(totalVolume * 100) / 100,
    chainIntegrity,
    lastVerifiedAt: new Date().toISOString(),
  }
}
