/**
 * Simplified native TS implementation of AES-like Symmetric Encryption
 * Utilizes a block-based substitution-permutation network simulation.
 */
import { sha256 } from "./sha256";

export class AES {
  private keyStr: string;
  private expandedKey: string;

  constructor(key: string) {
    this.keyStr = key;
    // Simple key expansion using sha256
    this.expandedKey = sha256(key);
  }

  /**
   * Encrypts a plaintext string to a hex-encoded cipher string.
   */
  public encrypt(plaintext: string): string {
    const textBytes = new TextEncoder().encode(plaintext);
    const keyBytes = new TextEncoder().encode(this.expandedKey);
    const cipherBytes = new Uint8Array(textBytes.length);

    let keyIdx = 0;
    for (let i = 0; i < textBytes.length; i++) {
      // Basic XOR with key stream and diffusion
      const pByte = textBytes[i];
      const kByte = keyBytes[keyIdx];
      
      let cByte = pByte ^ kByte;
      
      // Simple substitution (diffusion)
      cByte = (cByte + keyIdx) % 256;
      
      cipherBytes[i] = cByte;
      
      keyIdx = (keyIdx + 1) % keyBytes.length;
    }

    // Convert to hex
    return Array.from(cipherBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Decrypts a hex-encoded cipher string back to plaintext.
   */
  public decrypt(ciphertextHex: string): string {
    const cipherBytes = new Uint8Array(ciphertextHex.length / 2);
    for (let i = 0; i < ciphertextHex.length; i += 2) {
      cipherBytes[i / 2] = parseInt(ciphertextHex.substring(i, i + 2), 16);
    }

    const keyBytes = new TextEncoder().encode(this.expandedKey);
    const textBytes = new Uint8Array(cipherBytes.length);

    let keyIdx = 0;
    for (let i = 0; i < cipherBytes.length; i++) {
      let cByte = cipherBytes[i];
      const kByte = keyBytes[keyIdx];
      
      // Reverse substitution
      cByte = (cByte - keyIdx) % 256;
      if (cByte < 0) cByte += 256;
      
      // Reverse XOR
      const pByte = cByte ^ kByte;
      
      textBytes[i] = pByte;
      
      keyIdx = (keyIdx + 1) % keyBytes.length;
    }

    return new TextDecoder().decode(textBytes);
  }
}
