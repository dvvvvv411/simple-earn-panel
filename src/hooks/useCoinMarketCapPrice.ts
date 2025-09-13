import { useState, useEffect, useRef } from 'react';

interface LivePriceData {
  price: number;
  change24h: number;
  lastUpdate: number;
}

interface CMCQuoteResponse {
  data: {
    [symbol: string]: {
      quote: {
        EUR: {
          price: number;
          percent_change_24h: number;
        }
      }
    }
  }
}

export function useCoinMarketCapPrice(symbol: string) {
  const [priceData, setPriceData] = useState<LivePriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const fetchLivePrice = async () => {
    try {
      const data: CMCQuoteResponse = await import('@/lib/coinmarketcap').then(({ fetchCoinMarketCapData }) =>
        fetchCoinMarketCapData('quotes', {
          symbol: symbol.toUpperCase(),
          convert: 'EUR'
        })
      );
      const coinData = data.data[symbol.toUpperCase()];
      
      if (coinData && mountedRef.current) {
        setPriceData({
          price: coinData.quote.EUR.price,
          change24h: coinData.quote.EUR.percent_change_24h,
          lastUpdate: Date.now()
        });
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching live price:', err);
      if (mountedRef.current) {
        // Keep last known data instead of showing error immediately
        if (!priceData) {
          setError('Fehler beim Laden des Live-Preises');
        }
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    
    // Initial fetch
    fetchLivePrice();
    
    // Set up 20-second interval for live updates
    intervalRef.current = setInterval(fetchLivePrice, 20000);
    
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [symbol]);

  // Format price to exactly 2 decimal places
  const formatPrice = (price: number) => {
    return price.toLocaleString('de-DE', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return {
    price: priceData?.price || 0,
    formattedPrice: priceData ? formatPrice(priceData.price) : '€0,00',
    change24h: priceData?.change24h || 0,
    lastUpdate: priceData?.lastUpdate || 0,
    loading,
    error,
    isLive: priceData !== null && !error
  };
}
