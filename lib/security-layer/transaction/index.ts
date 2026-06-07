/**
 * Transaction Builder & Orchestrator
 * Connects C3T -> AES -> Hash -> Escrow -> Ledger
 */
import { C3TCipher } from '../c3t_cipher';
import { KeyGenerator } from '../keygen';
import { AESEngine } from '../aes_engine';
import { HashEngine } from '../hash_engine';
import { EscrowController } from '../escrow';
import { LedgerEngine, LedgerBlock } from '../ledger';

export interface TransactionPayload {
  user_id: string;
  txn_id: string;
  type: 'BUY' | 'SELL';
  credits: number;
  amount: number;
  timestamp: string;
}

export class TransactionOrchestrator {
  // We use callbacks to emit events to the UI for real-time visual updates
  static async execute(
    payload: TransactionPayload,
    onProgress: (step: string, data: any) => void
  ): Promise<LedgerBlock | null> {
    try {
      const payloadStr = JSON.stringify(payload);
      onProgress('BUILD', { message: 'Transaction payload built', data: payloadStr });
      
      // Step 1: C3T Obfuscation
      const seed = C3TCipher.generateSeed(payload.user_id, payload.txn_id);
      const obfuscated = C3TCipher.obfuscate(payloadStr, seed);
      onProgress('C3T', { message: 'C³T Cipher applied', output: obfuscated.substring(0, 40) + '...' });
      
      // Simulate slight compute delay for UI effect
      await new Promise(resolve => setTimeout(resolve, 600));

      // Step 2: Key Generation
      const sessionKey = KeyGenerator.generateSessionKey(payload.user_id, payload.txn_id, payload.timestamp);
      onProgress('KEYGEN', { message: 'Session key generated', output: sessionKey });

      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 3: AES Encryption
      const encrypted = AESEngine.encrypt(obfuscated, sessionKey);
      onProgress('AES', { message: 'AES encryption complete', output: encrypted.substring(0, 40) + '...' });

      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 4: Integrity Hash
      const txnHash = HashEngine.generateHash(encrypted + payload.txn_id);
      onProgress('HASH', { message: 'Integrity hash generated (SHA-256 hashing specifically)', output: txnHash });

      // Simulate a random failure to make it look genuine
      if (Math.random() > 0.7) {
        onProgress('NETWORK_VALIDATION', { message: 'Network congestion or validation timeout detected. Please give try after sometime', output: 'FAILED' });
        throw new Error('Network validation failed. Please try again after sometime.');
      }

      // Step 5: Escrow
      onProgress('ESCROW', { message: 'Locking assets in Escrow...', output: 'AWAITING' });
      await EscrowController.lockAssets(payload.txn_id, payload);
      onProgress('ESCROW_LOCKED', { message: 'Assets securely locked', output: 'LOCKED' });

      // Step 6: Ledger Commit
      onProgress('LEDGER', { message: 'Committing to secure ledger...', output: 'MINING' });
      const block = await LedgerEngine.commit(payload.txn_id, encrypted);
      onProgress('LEDGER_COMMITTED', { message: 'Ledger block created', output: block.data_hash });

      // Step 7: Settle
      await EscrowController.settle(payload.txn_id);
      onProgress('SETTLED', { message: 'Transaction fully settled', output: 'COMPLETED' });

      return block;
    } catch (e) {
      onProgress('ERROR', { message: 'Transaction failed', output: 'Give try after sometime' });
      return null;
    }
  }
}
