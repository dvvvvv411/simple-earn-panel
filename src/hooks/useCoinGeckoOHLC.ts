import { useState, useEffect } from 'react';

interface OHLCData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface CoinGeckoMarketChartResponse {
  prices: [number, number][]; // [timestamp, price]
}

const SYMBOL_TO_ID_MAP: { [key: string]: string } = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'XRP': 'ripple',
  'USDT': 'tether',
  'SOL': 'solana',
  'BNB': 'binancecoin',
  'USDC': 'usd-coin',
  'DOGE': 'dogecoin',
  'STETH': 'staked-ether',
  'ADA': 'cardano'
};

export function useCoinGeckoOHLC(symbol: string) {
  const [ohlcData, setOhlcData] = useState<OHLCData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOHLCData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const coinId = SYMBOL_TO_ID_MAP[symbol.toUpperCase()];
      if (!coinId) {
        throw new Error(`Unknown symbol: ${symbol}`);
      }

      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=eur&days=1`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch market chart data');
      }
      
      const data: CoinGeckoMarketChartResponse = await response.json();
      
      // Transform market chart format to OHLC format (using price as close)
      const transformedData: OHLCData[] = data.prices.map((item) => ({
        timestamp: item[0],
        open: item[1], // Use price for all OHLC values
        high: item[1],
        low: item[1],
        close: item[1]
      }));
      
      setOhlcData(transformedData);
    } catch (err) {
      console.error('Error fetching OHLC data:', err);
      setError('Failed to load chart data');
      
      // Fallback data if API fails - 5-minute intervals for 24 hours
      const fallbackData: OHLCData[] = [];
      const now = Date.now();
      const basePrice = 50000; // Fallback price
      let currentPrice = basePrice;
      
      for (let i = 287; i >= 0; i--) {
        const timestamp = now - (i * 5 * 60 * 1000); // 5-minute intervals
        
        // Simulate realistic price movement
        const volatility = Math.random() * 800 + 200; // 200-1000 volatility
        const priceChange = (Math.random() - 0.5) * volatility;
        currentPrice = Math.max(currentPrice + priceChange, basePrice * 0.8); // Prevent going too low
        
        fallbackData.push({
          timestamp,
          open: parseFloat(currentPrice.toFixed(2)),
          high: parseFloat(currentPrice.toFixed(2)),
          low: parseFloat(currentPrice.toFixed(2)),
          close: parseFloat(currentPrice.toFixed(2))
        });
      }
      
      setOhlcData(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOHLCData();
    
    // Refresh every 2 minutes
    const interval = setInterval(fetchOHLCData, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [symbol]);

  return { ohlcData, loading, error, refetch: fetchOHLCData };
}