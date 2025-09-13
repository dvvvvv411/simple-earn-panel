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
  coins: FormattedCoinData[];
  getPriceData: (symbol: string) => LivePriceData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const CoinMarketCapContext = createContext<CoinMarketCapContextType | undefined>(undefined);

const SYMBOLS = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'LINK', 'XRP', 'LTC', 'BCH', 'BNB'];

export function CoinMarketCapProvider({ children }: { children: ReactNode }) {
  const [coins, setCoins] = useState<FormattedCoinData[]>([]);
  const [priceData, setPriceData] = useState<Map<string, LivePriceData>>(new Map());
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const fetchAllData = async () => {
    try {
      // Fetch listings data
      const listingsResponse = await fetchCoinMarketCapData('listings', {
        start: 1,
        limit: 10,
        convert: 'EUR'
      });

      if (listingsResponse?.data && mountedRef.current) {
        const formattedCoins: FormattedCoinData[] = listingsResponse.data.map((coin: CoinData, index: number) => ({
          id: coin.id.toString(),
          symbol: coin.symbol.toLowerCase(),
          name: coin.name,
          image: `https://s2.coinmarketcap.com/static/img/coins/32x32/${coin.id}.png`,
          current_price: coin.quote.EUR.price,
          price_change_percentage_24h: coin.quote.EUR.percent_change_24h,
          market_cap_rank: index + 1
        }));
        setCoins(formattedCoins);

        // Generate price data from listings response
        const newPriceData = new Map<string, LivePriceData>();
        formattedCoins.forEach(coin => {
          const symbol = coin.symbol.toUpperCase();
          if (SYMBOLS.includes(symbol)) {
            newPriceData.set(symbol, {
              price: coin.current_price,
              change24h: coin.price_change_percentage_24h,
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
        setError('Failed to load market data');
        // Set fallback data
        generateFallbackData();
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };


  const generateFallbackData = () => {
    // Generate fallback coins data
    const fallbackCoins: FormattedCoinData[] = SYMBOLS.map((symbol, index) => ({
      id: (index + 1).toString(),
      symbol: symbol.toLowerCase(),
      name: symbol === 'BTC' ? 'Bitcoin' : symbol === 'ETH' ? 'Ethereum' : symbol === 'SOL' ? 'Solana' : symbol,
      image: `https://s2.coinmarketcap.com/static/img/coins/32x32/${index + 1}.png`,
      current_price: Math.random() * 50000 + 1000,
      price_change_percentage_24h: (Math.random() - 0.5) * 20,
      market_cap_rank: index + 1
    }));
    setCoins(fallbackCoins);

    // Generate fallback price data
    const fallbackPriceData = new Map<string, LivePriceData>();
    SYMBOLS.forEach(symbol => {
      fallbackPriceData.set(symbol, {
        price: Math.random() * 50000 + 1000,
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
    
    // Set up 60-second interval
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
        coins,
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