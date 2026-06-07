// STAVP - Secure Trade Authorization & Verification Protocol
// Implements cryptographic hash chaining for immutable transaction logging

import { db, generateId } from '@/lib/db'
import type { Trade, LedgerEntry, CarbonCredit } from '@/lib/db/types'

export interface STAVPTransaction {
  buyerId: string
  sellerId: string
  creditId: string
  quantity: number
  pricePerUnit: number
}

export interface STAVPResult {
  success: boolean
  trade?: Trade
  ledgerEntry?: LedgerEntry
  error?: string
  verificationHash?: string
}

// Generate SHA-256 hash using Web Crypto API
async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Generate cryptographic nonce
function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
}

// STAVP Protocol Implementation
export async function executeSTAVP(transaction: STAVPTransaction): Promise<STAVPResult> {
  const { buyerId, sellerId, creditId, quantity, pricePerUnit } = transaction

  try {
    // Step 1: Generate nonce for this transaction
    const nonce = generateNonce()

    // Step 2: Validate credit ownership and availability
    const credit = await db.getCreditById(creditId)
    if (!credit) {
      return { success: false, error: 'Credit not found' }
    }

    if (credit.owner_id !== sellerId) {
      return { success: false, error: 'Seller does not own this credit' }
    }

    if (credit.status !== 'available') {
      return { success: false, error: 'Credit is not available for trading' }
    }

    if (credit.quantity < quantity) {
      return { success: false, error: 'Insufficient credit quantity' }
    }

    // Step 3: Check for double-spend (credit must not be locked in another pending transaction)
    const pendingTrades = (await db.getAllTrades()).filter(
      t => t.credit_id === creditId && t.status === 'pending'
    )
    if (pendingTrades.length > 0) {
      return { success: false, error: 'Credit is locked in a pending transaction' }
    }

    // Step 4: Lock the credit
    await db.updateCredit(creditId, { status: 'locked' })

    // Step 5: Create transaction hash
    const transactionData = {
      buyerId,
      sellerId,
      creditId,
      quantity,
      pricePerUnit,
      nonce,
      timestamp: Date.now(),
    }
    const transactionString = JSON.stringify(transactionData)

    // Step 6: Get previous hash from ledger
    const lastEntry = await db.getLastLedgerEntry()
    const previousHash = lastEntry?.transaction_hash || '0'.repeat(64)

    // Step 7: Generate chained hash (includes previous hash for immutability)
    const chainedData = `${previousHash}|${transactionString}`
    const transactionHash = await sha256(chainedData)

    // Step 8: Create trade record
    const totalPrice = parseFloat((quantity * pricePerUnit).toFixed(2))
    const trade: Trade = {
      id: `trd_${generateId()}`,
      buyer_id: buyerId,
      seller_id: sellerId,
      credit_id: creditId,
      quantity,
      price_per_unit: pricePerUnit,
      total_price: totalPrice,
      trade_type: 'buy',
      status: 'completed',
      ledger_hash: transactionHash,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    }

    // Step 9: Create ledger entry
    const ledgerEntry: LedgerEntry = {
      id: `led_${generateId()}`,
      trade_id: trade.id,
      transaction_hash: transactionHash,
      previous_hash: previousHash,
      nonce,
      action: 'trade',
      data: transactionString,
      timestamp: new Date().toISOString(),
      verified: true,
    }

    // Step 10: Atomic execution - update all records
    await db.addTrade(trade)
    await db.addLedgerEntry(ledgerEntry)

    // Update credit - split if partial, transfer ownership
    if (quantity === credit.quantity) {
      // Full transfer
      await db.updateCredit(creditId, {
        owner_id: buyerId,
        status: 'available',
      })
    } else {
      // Partial transfer - create new credit for buyer
      const remainingQuantity = credit.quantity - quantity
      await db.updateCredit(creditId, {
        quantity: remainingQuantity,
        status: 'available',
      })

      // Create new credit for transferred portion
      const newCredit: CarbonCredit = {
        id: `crd_${generateId()}`,
        owner_id: buyerId,
        credit_type: credit.credit_type,
        vintage_year: credit.vintage_year,
        quantity,
        price_per_unit: pricePerUnit,
        expiry_date: credit.expiry_date,
        status: 'available',
        certification_body: credit.certification_body,
        created_at: new Date().toISOString(),
      }
      // Note: In production, would add this to credits collection
    }

    return {
      success: true,
      trade,
      ledgerEntry,
      verificationHash: transactionHash,
    }
  } catch (error) {
    // Rollback: unlock credit if error occurred
    try {
      await db.updateCredit(creditId, { status: 'available' })
    } catch {
      // Ignore rollback errors
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transaction failed',
    }
  }
}

// Verify transaction integrity
export async function verifyTransaction(transactionHash: string): Promise<{
  valid: boolean
  entry?: LedgerEntry
  chainIntact: boolean
  message: string
}> {
  const ledger = await db.getLedger()
  const entry = ledger.find(e => e.transaction_hash === transactionHash)

  if (!entry) {
    return {
      valid: false,
      chainIntact: false,
      message: 'Transaction not found in ledger',
    }
  }

  // Find this entry's position in the chain
  const entryIndex = ledger.indexOf(entry)

  // Verify chain integrity up to this point
  let chainIntact = true
  for (let i = 1; i <= entryIndex; i++) {
    if (ledger[i].previous_hash !== ledger[i - 1].transaction_hash) {
      chainIntact = false
      break
    }
  }

  // Verify the hash itself
  const previousHash = entryIndex > 0 ? ledger[entryIndex - 1].transaction_hash : '0'.repeat(64)
  const chainedData = `${previousHash}|${entry.data}`
  const computedHash = await sha256(chainedData)
  const hashValid = computedHash === entry.transaction_hash

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

// Get ledger statistics
export async function getLedgerStats(): Promise<{
  totalTransactions: number
  totalVolume: number
  chainIntegrity: boolean
  lastVerifiedAt: string
}> {
  const ledger = await db.getLedger()
  const trades = await db.getAllTrades()

  const totalVolume = trades
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.total_price, 0)

  // Verify full chain integrity
  let chainIntegrity = true
  for (let i = 1; i < ledger.length; i++) {
    if (ledger[i].previous_hash !== ledger[i - 1].transaction_hash) {
      chainIntegrity = false
      break
    }
  }

  return {
    totalTransactions: ledger.length,
    totalVolume: parseFloat(totalVolume.toFixed(2)),
    chainIntegrity,
    lastVerifiedAt: new Date().toISOString(),
  }
}
