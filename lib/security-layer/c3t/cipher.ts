/**
 * C³T Cipher Implementation
 * Carbon Credit Cryptographic Transfer (C³T) Cipher
 * Features: Seed-based mapping, chunk scrambling, and noise injection.
 */
import { sha256 } from "../crypto/sha256";
import { AES } from "../crypto/aes";

export class C3TCipher {
  private baseKey: string;
  private aes: AES;

  constructor(key: string) {
    this.baseKey = key;
    this.aes = new AES(sha256(key));
  }

  /**
   * Generates a deterministic sequence based on the seed
   */
  private generateSequence(seed: string, length: number): number[] {
    const sequence: number[] = [];
    let currentHash = sha256(seed);
    
    for (let i = 0; i < length; i++) {
      const val = parseInt(currentHash.substring(0, 8), 16);
      sequence.push(val);
      currentHash = sha256(currentHash);
    }
    
    return sequence;
  }

  /**
   * Encrypts the payload by injecting noise, encrypting with AES, and scrambling chunks
   */
  public encrypt(payload: string): string {
    // 1. Inject Noise
    const noisyPayload = this.injectNoiseFramed(payload);
    
    // 2. Encrypt with AES
    const aesEncrypted = this.aes.encrypt(noisyPayload);
    
    // 3. Scramble Chunks
    return this.scramble(aesEncrypted);
  }

  /**
   * Decrypts the payload by reversing the scramble, decrypting AES, and extracting noise
   */
  public decrypt(cipherText: string): string {
    // 1. Unscramble Chunks
    const unscrambled = this.unscramble(cipherText);
    
    // 2. Decrypt with AES
    const aesDecrypted = this.aes.decrypt(unscrambled);
    
    // 3. Remove Noise
    return this.removeNoise(aesDecrypted);
  }

  private injectNoise(data: string): string {
    // Inject random bytes every N characters
    const result: string[] = [];
    const seq = this.generateSequence(this.baseKey, data.length);
    
    for (let i = 0; i < data.length; i++) {
      result.push(data[i]);
      // Inject noise based on sequence
      if (seq[i] % 3 === 0) {
        result.push(String.fromCharCode((seq[i] % 26) + 97)); // Random a-z
      }
    }
    return result.join('');
  }

  private removeNoise(noisyData: string): string {
    // The seq sequence tells us exactly where noise was injected
    // Wait, the length of `data` is unknown during decrypt! 
    // We must track original data length or use a framing protocol.
    // For simplicity in this mock, we encode original length at the start.
    const parts = noisyData.split('||');
    if (parts.length < 2) return noisyData; // Fallback
    
    const origLength = parseInt(parts[0], 10);
    const dataWithNoise = parts.slice(1).join('||');
    
    const result: string[] = [];
    const seq = this.generateSequence(this.baseKey, origLength);
    
    let readIdx = 0;
    for (let i = 0; i < origLength; i++) {
      result.push(dataWithNoise[readIdx]);
      readIdx++;
      if (seq[i] % 3 === 0) {
        readIdx++; // Skip the noise character
      }
    }
    
    return result.join('');
  }

  // Override injectNoise to include framing
  private injectNoiseFramed(data: string): string {
    const noisy = this.injectNoise(data);
    return `${data.length}||${noisy}`;
  }

  private scramble(data: string): string {
    // Divide into 4 chunks and reorder based on baseKey
    const len = data.length;
    const chunkSize = Math.ceil(len / 4);
    const chunks = [];
    
    for (let i = 0; i < len; i += chunkSize) {
      chunks.push(data.substring(i, Math.min(i + chunkSize, len)));
    }
    
    // Pad chunks to 4
    while (chunks.length < 4) chunks.push("");

    const seq = this.generateSequence(this.baseKey, 1)[0];
    const order = [
      [0, 1, 2, 3],
      [3, 1, 0, 2],
      [2, 0, 3, 1],
      [1, 3, 2, 0]
    ][seq % 4];

    return `${order[0]}${chunks[order[0]]}||${order[1]}${chunks[order[1]]}||${order[2]}${chunks[order[2]]}||${order[3]}${chunks[order[3]]}`;
  }

  private unscramble(scrambled: string): string {
    const parts = scrambled.split('||');
    if (parts.length !== 4) return scrambled;

    const chunks: string[] = ["", "", "", ""];
    
    for (const part of parts) {
      if (part.length > 0) {
        const idx = parseInt(part[0], 10);
        chunks[idx] = part.substring(1);
      }
    }
    
    return chunks.join('');
  }
}
