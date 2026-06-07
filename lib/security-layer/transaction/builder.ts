/**
 * Transaction Builder for STL-C³T
 * Constructs the transaction payload and signs it using the C3T Cipher
 */
import { C3TCipher } from "../c3t/cipher";
import { KeyGenerator } from "../keygen/generator";
import { sha256 } from "../crypto/sha256";

export interface TransactionPayload {
  buyerId: string;
  sellerId: string;
  creditId: string;
  quantity: number;
  pricePerUnit: number;
  timestamp: number;
}

export class TransactionBuilder {
  /**
   * Packages a transaction into an encrypted, tamper-proof payload
   */
  public static buildAndSign(payload: TransactionPayload): { cipherText: string, hash: string } {
    const seed = KeyGenerator.generateTransactionSeed(payload.buyerId, payload.sellerId, payload.timestamp);
    const cipher = new C3TCipher(seed);
    
    const rawPayloadStr = JSON.stringify(payload);
    const cipherText = cipher.encrypt(rawPayloadStr);
    const hash = sha256(cipherText);
    
    return { cipherText, hash };
  }

  /**
   * Verifies and decrypts a transaction payload
   */
  public static verifyAndDecrypt(cipherText: string, expectedHash: string, buyerId: string, sellerId: string, timestamp: number): TransactionPayload | null {
    // Verify Integrity
    const actualHash = sha256(cipherText);
    if (actualHash !== expectedHash) {
      console.error("STL-C³T Verification Failed: Hash Mismatch. Payload compromised.");
      return null;
    }

    const seed = KeyGenerator.generateTransactionSeed(buyerId, sellerId, timestamp);
    const cipher = new C3TCipher(seed);

    try {
      const decrypted = cipher.decrypt(cipherText);
      // Basic validation of decrypted structure
      if (!decrypted.startsWith("{") || !decrypted.endsWith("}")) {
        return null;
      }
      return JSON.parse(decrypted) as TransactionPayload;
    } catch (e) {
      console.error("STL-C³T Decryption Failed", e);
      return null;
    }
  }
}
