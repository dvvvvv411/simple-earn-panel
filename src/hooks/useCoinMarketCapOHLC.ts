import { useState, useEffect } from 'react';

interface OHLCData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface CMCOHLCVResponse {
  data: {
    quotes: {
      time_open: string;
      quote: {
        EUR: {
          open: number;
          high: number;
          low: number;
          close: number;
        }
      }
    }[]
  }
}

export function useCoinMarketCapOHLC(symbol: string) {
  const [ohlcData, setOhlcData] = useState<OHLCData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOHLCData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data: CMCOHLCVResponse = await import('@/lib/coinmarketcap').then(({ fetchCoinMarketCapData }) =>
        fetchCoinMarketCapData('ohlcv', {
          symbol: symbol.toUpperCase(),
          convert: 'EUR',
          count: 24,
          interval: 'hourly'
        })
      );
      
      // Transform CMC OHLCV format to our format
      const transformedData: OHLCData[] = data.data.quotes.map((item) => ({
        timestamp: new Date(item.time_open).getTime(),
        open: item.quote.EUR.open,
        high: item.quote.EUR.high,
        low: item.quote.EUR.low,
        close: item.quote.EUR.close
      }));
      
      setOhlcData(transformedData);
    } catch (err) {
      console.error('Error fetching OHLCV data:', err);
      setError('Failed to load chart data');
      
      // Fallback data if API fails - hourly intervals for 24 hours
      const fallbackData: OHLCData[] = [];
      const now = Date.now();
      const basePrice = 50000; // Fallback price
      let currentPrice = basePrice;
      
      for (let i = 23; i >= 0; i--) {
        const timestamp = now - (i * 60 * 60 * 1000); // Hourly intervals
        
        // Simulate realistic price movement
        const volatility = Math.random() * 2000 + 500; // 500-2500 volatility
        const priceChange = (Math.random() - 0.5) * volatility;
        currentPrice = Math.max(currentPrice + priceChange, basePrice * 0.8); // Prevent going too low
        
        fallbackData.push({
          timestamp,
          open: parseFloat(currentPrice.toFixed(2)),
          high: parseFloat((currentPrice * 1.02).toFixed(2)),
          low: parseFloat((currentPrice * 0.98).toFixed(2)),
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
    
    // Refresh every 20 seconds
    const interval = setInterval(fetchOHLCData, 20000);
    
    return () => clearInterval(interval);
  }, [symbol]);

  return { ohlcData, loading, error, refetch: fetchOHLCData };
}