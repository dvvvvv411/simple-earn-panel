import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { fetchCoinGeckoMarkets, fetchCoinGeckoChart, getCoingeckoId, CoinGeckoMarketData } from '@/lib/coingecko';

interface CoinGeckoChartData {
  timestamp: number;
  price: number;
}

interface CoinGeckoContextType {
  // Market data for MarketOverviewCard
  marketCoins: CoinGeckoMarketData[];
  marketLoading: boolean;
  marketError: string | null;
  
  // Chart data for CryptoCandlestickChart
  getChartData: (symbol: string) => CoinGeckoChartData[];
  chartLoading: boolean;
  chartError: string | null;
  
  // Manual refresh functions
  refetchMarket: () => void;
  refetchChart: (symbol: string) => void;
}

const CoinGeckoContext = createContext<CoinGeckoContextType | undefined>(undefined);

export function CoinGeckoProvider({ children }: { children: ReactNode }) {
  // Market data state
  const [marketCoins, setMarketCoins] = useState<CoinGeckoMarketData[]>([]);
  const [marketLoading, setMarketLoading] = useState(true);
  const [marketError, setMarketError] = useState<string | null>(null);
  
  // Chart data state 
  const [chartData, setChartData] = useState<Map<string, CoinGeckoChartData[]>>(new Map());
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  
  // Refs for cleanup
  const marketIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chartIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Fetch market data (Top 10 coins for MarketOverviewCard)
  const fetchMarketData = async () => {
    try {
      const data = await fetchCoinGeckoMarkets(10);
      if (mountedRef.current) {
        setMarketCoins(data);
        setMarketError(null);
      }
    } catch (error) {
      console.error('Error fetching CoinGecko market data:', error);
      if (mountedRef.current) {
        setMarketError('Failed to load market data');
        // Generate fallback data
        generateFallbackMarketData();
      }
    } finally {
      if (mountedRef.current) {
        setMarketLoading(false);
      }
    }
  };

  // Fetch chart data for specific symbol
  const fetchChartData = async (symbol: string) => {
    try {
      setChartLoading(true);
      const coinId = getCoingeckoId(symbol);
      const response = await fetchCoinGeckoChart(coinId, 1); // 1 day = 24 hourly points
      
      if (mountedRef.current && response.prices) {
        const formattedData: CoinGeckoChartData[] = response.prices.map(([timestamp, price]) => ({
          timestamp,
          price
        }));
        
        setChartData(prev => new Map(prev.set(symbol.toUpperCase(), formattedData)));
        setChartError(null);
      }
    } catch (error) {
      console.error(`Error fetching chart data for ${symbol}:`, error);
      if (mountedRef.current) {
        setChartError(`Failed to load ${symbol} chart data`);
        // Generate fallback chart data
        generateFallbackChartData(symbol);
      }
    } finally {
      if (mountedRef.current) {
        setChartLoading(false);
      }
    }
  };

  // Generate fallback market data
  const generateFallbackMarketData = () => {
    const symbols = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'MATIC', 'LINK', 'UNI', 'LTC', 'XRP'];
    const fallbackCoins: CoinGeckoMarketData[] = symbols.map((symbol, index) => ({
      id: symbol.toLowerCase(),
      symbol: symbol.toLowerCase(),
      name: getFullName(symbol),
      image: `https://assets.coingecko.com/coins/images/${index + 1}/large/${symbol.toLowerCase()}.png`,
      current_price: Math.random() * 50000 + 1000,
      price_change_percentage_24h: (Math.random() - 0.5) * 20,
      market_cap_rank: index + 1,
      market_cap: Math.random() * 1000000000000 + 100000000000
    }));
    setMarketCoins(fallbackCoins);
  };

  // Generate fallback chart data
  const generateFallbackChartData = (symbol: string) => {
    const fallbackData: CoinGeckoChartData[] = [];
    const now = Date.now();
    const basePrice = symbol.toUpperCase() === 'BTC' ? 50000 : symbol.toUpperCase() === 'ETH' ? 3000 : 100;
    let currentPrice = basePrice;
    
    // Generate 24 hours of hourly data points
    for (let i = 23; i >= 0; i--) {
      const timestamp = now - (i * 60 * 60 * 1000);
      const volatility = basePrice * 0.02; // 2% volatility
      const priceChange = (Math.random() - 0.5) * volatility;
      currentPrice = Math.max(currentPrice + priceChange, basePrice * 0.8);
      
      fallbackData.push({
        timestamp,
        price: parseFloat(currentPrice.toFixed(2))
      });
    }
    
    setChartData(prev => new Map(prev.set(symbol.toUpperCase(), fallbackData)));
  };

  // Helper function for coin names
  const getFullName = (symbol: string): string => {
    const names: Record<string, string> = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'SOL': 'Solana',
      'ADA': 'Cardano',
      'DOT': 'Polkadot',
      'MATIC': 'Polygon',
      'LINK': 'Chainlink',
      'UNI': 'Uniswap',
      'LTC': 'Litecoin',
      'XRP': 'XRP'
    };
    return names[symbol] || symbol;
  };

  // Setup intervals and initial fetch
  useEffect(() => {
    mountedRef.current = true;
    
    // Initial market data fetch
    fetchMarketData();
    
    // Market data: Update every 2 minutes (120 seconds)
    marketIntervalRef.current = setInterval(fetchMarketData, 120000);
    
    // Chart data: Fetch for main symbols initially
    const mainSymbols = ['BTC', 'ETH', 'SOL'];
    mainSymbols.forEach(symbol => fetchChartData(symbol));
    
    // Chart data: Update every 5 minutes (300 seconds)
    chartIntervalRef.current = setInterval(() => {
      mainSymbols.forEach(symbol => fetchChartData(symbol));
    }, 300000);
    
    return () => {
      mountedRef.current = false;
      if (marketIntervalRef.current) {
        clearInterval(marketIntervalRef.current);
      }
      if (chartIntervalRef.current) {
        clearInterval(chartIntervalRef.current);
      }
    };
  }, []);

  // Get chart data for a specific symbol
  const getChartData = (symbol: string): CoinGeckoChartData[] => {
    return chartData.get(symbol.toUpperCase()) || [];
  };

  // Manual refresh functions
  const refetchMarket = () => {
    setMarketLoading(true);
    fetchMarketData();
  };

  const refetchChart = (symbol: string) => {
    fetchChartData(symbol);
  };

  return (
    <CoinGeckoContext.Provider
      value={{
        marketCoins,
        marketLoading,
        marketError,
        getChartData,
        chartLoading,
        chartError,
        refetchMarket,
        refetchChart
      }}
    >
      {children}
    </CoinGeckoContext.Provider>
  );
}

export function useCoinGecko() {
  const context = useContext(CoinGeckoContext);
  if (context === undefined) {
    throw new Error('useCoinGecko must be used within a CoinGeckoProvider');
  }
  return context;
}