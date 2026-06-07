import { TransactionBuilder } from './lib/security-layer/transaction/builder';

try {
  const result = TransactionBuilder.buildAndSign({
    buyerId: 'b1',
    sellerId: 's1',
    creditId: 'c1',
    quantity: 10,
    pricePerUnit: 5,
    timestamp: Date.now()
  });
  console.log('Success:', result);
} catch (e) {
  console.error('Error:', e);
}
