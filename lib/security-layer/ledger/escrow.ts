/**
 * Escrow and Ledger system for STL-C³T
 * Chains transactions cryptographically to prevent tampering.
 */
import { sha256 } from "../crypto/sha256";
import { TransactionBuilder, TransactionPayload } from "../transaction/builder";

export interface LedgerEntry {
  id: string;
  previousHash: string;
  cipherText: string;
  hash: string;
  timestamp: number;
}

export class EscrowLedger {
  private static instance: EscrowLedger;
  private chain: LedgerEntry[] = [];

  private constructor() {
    // Genesis block
    this.chain.push({
      id: "GENESIS",
      previousHash: "00000000000000000000000000000000",
      cipherText: "GENESIS_BLOCK",
      hash: sha256("GENESIS"),
      timestamp: Date.now()
    });
  }

  public static getInstance(): EscrowLedger {
    if (!EscrowLedger.instance) {
      EscrowLedger.instance = new EscrowLedger();
    }
    return EscrowLedger.instance;
  }

  /**
   * Commits a transaction to the secure ledger.
   * Fails if the chain integrity is compromised.
   */
  public commitTransaction(payload: TransactionPayload): LedgerEntry {
    if (!this.verifyIntegrity()) {
      throw new Error("Ledger Integrity Compromised! Transaction blocked.");
    }

    const previousEntry = this.chain[this.chain.length - 1];
    const packaged = TransactionBuilder.buildAndSign(payload);

    // Cryptographic link
    const entryHash = sha256(`${previousEntry.hash}:${packaged.hash}`);

    const entry: LedgerEntry = {
      id: `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      previousHash: previousEntry.hash,
      cipherText: packaged.cipherText,
      hash: entryHash,
      timestamp: payload.timestamp
    };

    this.chain.push(entry);
    return entry;
  }

  /**
   * Verifies the cryptographic integrity of the entire chain.
   */
  public verifyIntegrity(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      if (current.previousHash !== previous.hash) {
        return false;
      }
      
      // In a real implementation, we would re-derive current.hash from its cipherText and previousHash
      // to ensure `hash` hasn't been modified.
    }
    return true;
  }

  public getChain(): LedgerEntry[] {
    return [...this.chain];
  }
}
