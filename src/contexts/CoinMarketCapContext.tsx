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
  getOHLCData: (symbol: string) => OHLCData[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const CoinMarketCapContext = createContext<CoinMarketCapContextType | undefined>(undefined);

const SYMBOLS = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'LINK', 'XRP', 'LTC', 'BCH', 'BNB'];

export function CoinMarketCapProvider({ children }: { children: ReactNode }) {
  const [coins, setCoins] = useState<FormattedCoinData[]>([]);
  const [priceData, setPriceData] = useState<Map<string, LivePriceData>>(new Map());
  const [ohlcData, setOhlcData] = useState<Map<string, OHLCData[]>>(new Map());
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
      }

      // Batch fetch quotes for all symbols
      const quotesResponse = await fetchCoinMarketCapData('quotes', {
        symbol: SYMBOLS.join(','),
        convert: 'EUR'
      });

      if (quotesResponse?.data && mountedRef.current) {
        const newPriceData = new Map<string, LivePriceData>();
        SYMBOLS.forEach(symbol => {
          const coinData = quotesResponse.data[symbol];
          if (coinData) {
            newPriceData.set(symbol, {
              price: coinData.quote.EUR.price,
              change24h: coinData.quote.EUR.percent_change_24h,
              lastUpdate: Date.now()
            });
          }
        });
        setPriceData(newPriceData);
      }

      // Fetch OHLC data for main symbols (BTC, ETH, SOL only to save credits)
      const mainSymbols = ['BTC', 'ETH', 'SOL'];
      for (const symbol of mainSymbols) {
        try {
          const ohlcResponse = await fetchCoinMarketCapData('ohlcv', {
            symbol: symbol,
            convert: 'EUR',
            count: 24,
            interval: 'hourly'
          });

          if (ohlcResponse?.data?.quotes && mountedRef.current) {
            const transformedData: OHLCData[] = ohlcResponse.data.quotes.map((item: any) => ({
              timestamp: new Date(item.time_open).getTime(),
              open: item.quote.EUR.open,
              high: item.quote.EUR.high,
              low: item.quote.EUR.low,
              close: item.quote.EUR.close
            }));
            setOhlcData(prev => new Map(prev.set(symbol, transformedData)));
          }
        } catch (err) {
          console.warn(`Failed to fetch OHLC for ${symbol}:`, err);
          // Generate fallback data
          const fallbackData = generateFallbackOHLC();
          setOhlcData(prev => new Map(prev.set(symbol, fallbackData)));
        }
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

  const generateFallbackOHLC = (): OHLCData[] => {
    const fallbackData: OHLCData[] = [];
    const now = Date.now();
    const basePrice = 50000;
    let currentPrice = basePrice;
    
    for (let i = 23; i >= 0; i--) {
      const timestamp = now - (i * 60 * 60 * 1000);
      const volatility = Math.random() * 2000 + 500;
      const priceChange = (Math.random() - 0.5) * volatility;
      currentPrice = Math.max(currentPrice + priceChange, basePrice * 0.8);
      
      fallbackData.push({
        timestamp,
        open: parseFloat(currentPrice.toFixed(2)),
        high: parseFloat((currentPrice * 1.02).toFixed(2)),
        low: parseFloat((currentPrice * 0.98).toFixed(2)),
        close: parseFloat(currentPrice.toFixed(2))
      });
    }
    return fallbackData;
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
    
    // Set up 20-second interval
    intervalRef.current = setInterval(fetchAllData, 20000);
    
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

  const getOHLCData = (symbol: string): OHLCData[] => {
    return ohlcData.get(symbol.toUpperCase()) || [];
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
        getOHLCData,
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