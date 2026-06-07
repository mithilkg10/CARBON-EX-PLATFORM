/**
 * Generator for Secure Transaction Keys
 * Provides deterministic seeds based on user identity and time vectors
 */
import { sha256 } from "../crypto/sha256";

export class KeyGenerator {
  /**
   * Generates a unique transaction seed.
   * @param buyerId The ID of the buyer
   * @param sellerId The ID of the seller
   * @param timestamp The transaction timestamp
   */
  public static generateTransactionSeed(buyerId: string, sellerId: string, timestamp: number): string {
    const rawData = `${buyerId}:${sellerId}:${timestamp}`;
    return sha256(rawData);
  }

  /**
   * Generates a temporary session key for a user.
   */
  public static generateSessionKey(userId: string): string {
    const timeVector = Math.floor(Date.now() / 1000 / 3600); // Changes every hour
    return sha256(`${userId}:${timeVector}:SECURE_SALT_99X`);
  }
}
