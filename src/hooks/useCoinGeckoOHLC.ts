import { useState, useEffect } from 'react';

interface OHLCData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface CoinGeckoOHLCResponse {
  [timestamp: string]: [number, number, number, number]; // [open, high, low, close]
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
        `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=eur&days=1`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch OHLC data');
      }
      
      const data: number[][] = await response.json();
      
      // Transform CoinGecko OHLC format to our format
      const transformedData: OHLCData[] = data.map((item) => ({
        timestamp: item[0],
        open: item[1],
        high: item[2],
        low: item[3],
        close: item[4]
      }));
      
      setOhlcData(transformedData);
    } catch (err) {
      console.error('Error fetching OHLC data:', err);
      setError('Failed to load chart data');
      
      // Fallback data if API fails
      const fallbackData: OHLCData[] = [];
      const now = Date.now();
      const basePrice = 50000; // Fallback price
      
      for (let i = 23; i >= 0; i--) {
        const timestamp = now - (i * 60 * 60 * 1000); // Hourly data
        const open = basePrice + (Math.random() - 0.5) * 1000;
        const volatility = 500;
        const high = open + Math.random() * volatility;
        const low = open - Math.random() * volatility;
        const close = open + (Math.random() - 0.5) * volatility;
        
        fallbackData.push({
          timestamp,
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2))
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