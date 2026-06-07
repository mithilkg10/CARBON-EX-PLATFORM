/**
 * Simplified Custom AES Engine
 * Implements simplified versions of SubBytes, ShiftRows, MixColumns, and AddRoundKey
 * strictly using native language features.
 */

export class AESEngine {
  // Simplified S-Box for demonstration
  private static SBOX = [
    0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
    0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0
  ];

  static encrypt(data: string, key: string): string {
    let encryptedHex = '';
    
    // Convert to simplified blocks
    const keyBytes = this.stringToBytes(key);
    const dataBytes = this.stringToBytes(data);
    
    for (let i = 0; i < dataBytes.length; i += 4) {
      let block = [
        dataBytes[i] || 0,
        dataBytes[i + 1] || 0,
        dataBytes[i + 2] || 0,
        dataBytes[i + 3] || 0
      ];

      // Simplified AES rounds
      for (let round = 0; round < 4; round++) {
        block = this.subBytes(block);
        block = this.shiftRows(block);
        block = this.mixColumns(block);
        block = this.addRoundKey(block, keyBytes, round);
      }

      encryptedHex += block.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    return encryptedHex;
  }

  private static stringToBytes(str: string): number[] {
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
      bytes.push(str.charCodeAt(i) & 0xff);
    }
    return bytes;
  }

  private static subBytes(block: number[]): number[] {
    return block.map(b => this.SBOX[b % this.SBOX.length]);
  }

  private static shiftRows(block: number[]): number[] {
    // Simple 1-position left shift for a 4-byte block
    return [block[1], block[2], block[3], block[0]];
  }

  private static mixColumns(block: number[]): number[] {
    // Simplified mix: XOR adjacent elements
    return [
      block[0] ^ block[1],
      block[1] ^ block[2],
      block[2] ^ block[3],
      block[3] ^ block[0]
    ];
  }

  private static addRoundKey(block: number[], key: number[], round: number): number[] {
    return block.map((b, i) => b ^ (key[(i + round) % key.length] || 0x11));
  }
}
