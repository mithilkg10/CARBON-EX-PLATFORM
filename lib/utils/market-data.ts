export type Timeframe = '1D' | '1W' | '15D' | '30D';

export interface DataPoint {
  date: string;
  price: number;
  volume: number;
}

export function generateMarketData(timeframe: Timeframe): DataPoint[] {
  const points: DataPoint[] = [];
  const now = new Date();
  
  // Base configuration
  let numPoints = 24; // 1D defaults to hours
  let stepMs = 60 * 60 * 1000;
  
  if (timeframe === '1W') {
    numPoints = 7;
    stepMs = 24 * 60 * 60 * 1000;
  } else if (timeframe === '15D') {
    numPoints = 15;
    stepMs = 24 * 60 * 60 * 1000;
  } else if (timeframe === '30D') {
    numPoints = 30;
    stepMs = 24 * 60 * 60 * 1000;
  }

  // Regression based on supply & demand logic (Simulated upward trend)
  // Base price $15.00 climbing to ~$22.00
  let currentPrice = 15.00 + (Math.random() * 2);
  let currentVolume = 5000;

  for (let i = numPoints; i >= 0; i--) {
    const pointTime = new Date(now.getTime() - (i * stepMs));
    
    // Simulating demand increasing over time vs constrained supply causing regression upward
    const demandSpike = Math.random() > 0.7 ? (Math.random() * 1.5) : 0;
    const supplyDrop = Math.random() > 0.8 ? (Math.random() * -0.8) : 0;
    
    // Add realistic random walk
    const randomWalk = (Math.random() - 0.4) * 0.8; // Bias slightly upward
    
    currentPrice = Math.max(10, currentPrice + randomWalk + demandSpike + supplyDrop);
    currentVolume = Math.max(1000, currentVolume + (Math.random() - 0.5) * 2000 + (demandSpike * 1000));
    
    points.push({
      date: pointTime.toISOString(),
      price: parseFloat(currentPrice.toFixed(2)),
      volume: parseFloat(currentVolume.toFixed(2)),
    });
  }
  
  return points;
}
