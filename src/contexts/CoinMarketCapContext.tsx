import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { fetchCoinMarketCapData } from '@/lib/coinmarketcap';

interface LivePriceData {
  price: number;
  change24h: number;
  lastUpdate: number;
}

interface OHLCData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface CoinData {
  id: number;
  name: string;
  symbol: string;
  quote: {
    EUR: {
      price: number;
      percent_change_24h: number;
      market_cap: number;
      market_cap_dominance: number;
    }
  }
}

interface FormattedCoinData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap_rank: number;
}

interface CoinMarketCapContextType {
  getPriceData: (symbol: string) => LivePriceData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const CoinMarketCapContext = createContext<CoinMarketCapContextType | undefined>(undefined);

const SYMBOLS = ['BTC', 'ETH', 'SOL']; // Reduced to save API costs

export function CoinMarketCapProvider({ children }: { children: ReactNode }) {
  const [priceData, setPriceData] = useState<Map<string, LivePriceData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const fetchAllData = async () => {
    try {
      // ONLY FETCH LIVE PRICE DATA for BTC/ETH/SOL
      const listingsResponse = await fetchCoinMarketCapData('listings', {
        start: 1,
        limit: 10,
        convert: 'EUR'
      });

      if (listingsResponse?.data && mountedRef.current) {
        // Extract ONLY price data for live price display
        const newPriceData = new Map<string, LivePriceData>();
        listingsResponse.data.forEach((coin: CoinData) => {
          if (SYMBOLS.includes(coin.symbol)) {
            newPriceData.set(coin.symbol, {
              price: coin.quote.EUR.price,
              change24h: coin.quote.EUR.percent_change_24h,
              lastUpdate: Date.now()
            });
          }
        });
        setPriceData(newPriceData);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching CoinMarketCap data:', err);
      if (mountedRef.current) {
        setError('Failed to load live prices');
        generateFallbackPriceData();
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const generateFallbackPriceData = () => {
    // Generate fallback price data ONLY
    const fallbackPriceData = new Map<string, LivePriceData>();
    SYMBOLS.forEach(symbol => {
      const basePrice = symbol === 'BTC' ? 50000 : symbol === 'ETH' ? 3000 : 100;
      fallbackPriceData.set(symbol, {
        price: basePrice + (Math.random() - 0.5) * basePrice * 0.1,
        change24h: (Math.random() - 0.5) * 20,
        lastUpdate: Date.now()
      });
    });
    setPriceData(fallbackPriceData);
  };

  useEffect(() => {
    mountedRef.current = true;
    
    // Initial fetch
    fetchAllData();
    
    // Set up 60-second interval to save API costs
    intervalRef.current = setInterval(fetchAllData, 60000);
    
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const getPriceData = (symbol: string): LivePriceData | null => {
    return priceData.get(symbol.toUpperCase()) || null;
  };

  const refetch = () => {
    setLoading(true);
    fetchAllData();
  };

  return (
    <CoinMarketCapContext.Provider
      value={{
        getPriceData,
        loading,
        error,
        refetch
      }}
    >
      {children}
    </CoinMarketCapContext.Provider>
  );
}

export function useCoinMarketCap() {
  const context = useContext(CoinMarketCapContext);
  if (context === undefined) {
    throw new Error('useCoinMarketCap must be used within a CoinMarketCapProvider');
  }
  return context;
}