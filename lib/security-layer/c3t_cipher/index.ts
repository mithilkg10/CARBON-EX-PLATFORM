/**
 * C³T Cipher Engine
 * Custom obfuscation layer with seed-based mapping, position shift,
 * chunk scrambling, and noise injection.
 */

export class C3TCipher {
  private static readonly NOISE_CHARS = '!@#$%^&*()_+~`|}{[]:;?><,./-=';

  /**
   * Encrypts the input string using the C³T algorithm
   */
  static obfuscate(data: string, seed: number): string {
    // 1. Dynamic mapping based on seed
    const mapped = data.split('').map(char => {
      const charCode = char.charCodeAt(0);
      return String.fromCharCode(charCode ^ (seed % 256));
    }).join('');

    // 2. Position-based shift
    const shifted = mapped.split('').map((char, index) => {
      const shiftAmount = (seed + index) % 10;
      return String.fromCharCode(char.charCodeAt(0) + shiftAmount);
    }).join('');

    // 3. Chunk scrambling
    const chunkSize = Math.max(2, (seed % 5) + 2);
    const chunks = [];
    for (let i = 0; i < shifted.length; i += chunkSize) {
      chunks.push(shifted.slice(i, i + chunkSize));
    }
    // Reverse odd chunks
    const scrambled = chunks.map((chunk, index) => {
      return index % 2 !== 0 ? chunk.split('').reverse().join('') : chunk;
    }).join('');

    // 4. Noise injection
    let noisy = '';
    for (let i = 0; i < scrambled.length; i++) {
      noisy += scrambled[i];
      if (i % 3 === 0) {
        const noiseChar = this.NOISE_CHARS[Math.floor((seed + i) % this.NOISE_CHARS.length)];
        noisy += noiseChar;
      }
    }

    return Buffer.from(noisy).toString('base64');
  }

  static generateSeed(userId: string, txnId: string): number {
    let hash = 0;
    const input = `${userId}:${txnId}`;
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) - hash) + input.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
}
