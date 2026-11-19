/**
 * STL C³T transaction orchestrator (runs in the browser).
 *
 * BUILD     canonical JSON payload
 * C3T       custom C³T obfuscation of the payload
 * KEYGEN    fresh AES 256 GCM session key and 96 bit IV from the Web Crypto API
 * AES       AES 256 GCM encryption of the obfuscated payload
 * HASH      SHA 256 integrity hash over ciphertext and transaction id
 * VERIFY    decrypts the ciphertext again and checks it matches (GCM tag check)
 * ESCROW    server runs STAVP: validates listing, balance and quantity, locks the credit
 * LEDGER    server chains the trade to the previous ledger block with SHA 256
 * SETTLED   ownership and wallet settlement confirmed by the server
 *
 * Every step is real. The only pacing is a short delay between steps so the log is readable.
 */
import { C3TCipher } from '../c3t_cipher';

export interface TransactionPayload {
  user_id: string;
  txn_id: string;
  type: 'BUY' | 'SELL';
  credits: number;
  amount: number;
  timestamp: string;
}

export interface CommitResult {
  ledgerHash: string;
  previousHash: string;
  nonce: string;
  message: string;
}

export type ProgressHandler = (step: string, data: { message: string; output: string }) => void;

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sha256(data: string | Uint8Array): Promise<string> {
  const bytes = typeof data === 'string' ? encoder.encode(data) : data;
  return toHex(await crypto.subtle.digest('SHA-256', bytes as BufferSource));
}

const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class TransactionOrchestrator {
  static async execute(
    payload: TransactionPayload,
    onProgress: ProgressHandler,
    commit: (integrityHash: string) => Promise<CommitResult>,
  ): Promise<CommitResult> {
    const payloadStr = JSON.stringify(payload);
    onProgress('BUILD', { message: 'Transaction payload built', output: `${payload.txn_id} · ${payload.credits} credits · $${payload.amount.toFixed(2)}` });
    await pause(350);

    const seed = C3TCipher.generateSeed(payload.user_id, payload.txn_id);
    const obfuscated = C3TCipher.obfuscate(payloadStr, seed);
    onProgress('C3T', { message: 'C³T obfuscation applied', output: `${obfuscated.substring(0, 48)}...` });
    await pause(350);

    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const rawKey = new Uint8Array(await crypto.subtle.exportKey('raw', key));
    const fingerprint = (await sha256(rawKey)).slice(0, 32);
    onProgress('KEYGEN', { message: 'AES 256 GCM session key generated (Web Crypto)', output: `key fingerprint ${fingerprint} · iv ${toHex(iv)}` });
    await pause(350);

    const plaintext = encoder.encode(obfuscated);
    const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext));
    const cipherHex = toHex(ciphertext);
    onProgress('AES', { message: `AES 256 GCM encryption complete (${ciphertext.length} bytes incl. 16 byte auth tag)`, output: `${cipherHex.substring(0, 48)}...` });
    await pause(350);

    const integrityHash = await sha256(`${cipherHex}:${payload.txn_id}`);
    onProgress('HASH', { message: 'SHA 256 integrity hash generated', output: integrityHash });
    await pause(350);

    const decrypted = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext));
    const roundTrip = new TextDecoder().decode(decrypted) === obfuscated;
    if (!roundTrip) throw new Error('Decryption check failed: ciphertext did not round trip');
    onProgress('VERIFY', { message: 'Decryption round trip verified, GCM auth tag valid', output: 'OK' });
    await pause(300);

    onProgress('ESCROW', { message: 'Submitting to STAVP escrow: listing, quantity and balance checks', output: 'AWAITING SERVER' });
    const result = await commit(integrityHash);
    onProgress('ESCROW_LOCKED', { message: 'Escrow checks passed, credit locked', output: `nonce ${result.nonce}` });
    await pause(300);

    onProgress('LEDGER', { message: 'Ledger block chained to previous block', output: `prev ${result.previousHash.slice(0, 24)}... → ${result.ledgerHash}` });
    await pause(300);

    onProgress('SETTLED', { message: result.message, output: 'COMPLETED' });
    return result;
  }
}
