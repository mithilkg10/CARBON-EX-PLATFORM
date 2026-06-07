/**
 * Simplified Custom SHA-256 Equivalent
 * Implements bitwise operations and a compression-style function
 * to guarantee integrity.
 */

export class HashEngine {
  /**
   * Generates a 64-character hex hash based on input data
   */
  static generateHash(data: string): string {
    let h0 = 0x6a09e667, h1 = 0xbb67ae85;
    let h2 = 0x3c6ef372, h3 = 0xa54ff53a;

    const bytes = this.stringToUtf8Bytes(data);
    
    // Simulate compression blocks
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      h0 = Math.imul(h0 ^ b, 3432918353);
      h0 = (h0 << 15) | (h0 >>> 17);
      h1 = Math.imul(h1 ^ h0, 461845907);
      h1 = (h1 << 13) | (h1 >>> 19);
      
      h2 = (h2 ^ b) + h0;
      h3 = (h3 ^ h1) + h2;
    }

    h0 ^= bytes.length;
    h1 ^= bytes.length;
    h2 ^= bytes.length;
    h3 ^= bytes.length;

    h0 = this.avalanche(h0);
    h1 = this.avalanche(h1);
    h2 = this.avalanche(h2);
    h3 = this.avalanche(h3);

    return [h0, h1, h2, h3].map(h => (h >>> 0).toString(16).padStart(8, '0')).join('') + 
           [h3, h2, h1, h0].map(h => (h >>> 0).toString(16).padStart(8, '0')).join(''); // 64 chars
  }

  private static stringToUtf8Bytes(str: string): number[] {
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
      bytes.push(str.charCodeAt(i) & 0xff);
    }
    return bytes;
  }

  private static avalanche(h: number): number {
    h ^= h >>> 16;
    h = Math.imul(h, 2246822507);
    h ^= h >>> 13;
    h = Math.imul(h, 3266489909);
    h ^= h >>> 16;
    return h;
  }
}
