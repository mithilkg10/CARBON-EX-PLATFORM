/**
 * Simulated Escrow Controller
 * Holds funds and locks credits safely during transaction
 */

export class EscrowController {
  private static locks: Map<string, any> = new Map();

  static async lockAssets(txnId: string, payload: any): Promise<boolean> {
    return new Promise((resolve) => {
      // Simulate validation latency
      setTimeout(() => {
        this.locks.set(txnId, {
          status: 'LOCKED',
          payload,
          timestamp: Date.now()
        });
        resolve(true);
      }, 800);
    });
  }

  static async settle(txnId: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const lock = this.locks.get(txnId);
        if (lock) {
          lock.status = 'SETTLED';
          this.locks.set(txnId, lock);
          resolve(true);
        } else {
          resolve(false);
        }
      }, 1000);
    });
  }
}
