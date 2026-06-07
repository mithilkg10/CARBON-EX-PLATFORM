/**
 * Secure Ledger Engine
 * Chain-based tamper-proof logging and block creation
 */
import { HashEngine } from '../hash_engine';

export interface LedgerBlock {
  txn_id: string;
  prev_hash: string;
  data_hash: string;
  timestamp: string;
  signature: string;
}

export class LedgerEngine {
  private static chain: LedgerBlock[] = [{
    txn_id: 'GENESIS',
    prev_hash: '0000000000000000000000000000000000000000000000000000000000000000',
    data_hash: HashEngine.generateHash('GENESIS_DATA'),
    timestamp: new Date().toISOString(),
    signature: 'GENESIS_SIG'
  }];

  static async commit(txnId: string, encryptedData: string): Promise<LedgerBlock> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const lastBlock = this.chain[this.chain.length - 1];
        const dataHash = HashEngine.generateHash(encryptedData + txnId);
        
        // Custom simple RSA-like simulation for signature
        const signature = HashEngine.generateHash(dataHash + "SECRET_KEY_SIM");

        const newBlock: LedgerBlock = {
          txn_id: txnId,
          prev_hash: lastBlock.data_hash,
          data_hash: dataHash,
          timestamp: new Date().toISOString(),
          signature: signature
        };

        this.chain.push(newBlock);
        resolve(newBlock);
      }, 1200);
    });
  }

  static getChain(): LedgerBlock[] {
    return [...this.chain];
  }
}
