import { useState, useEffect, useRef } from 'react';

interface LivePriceData {
  price: number;
  change24h: number;
  lastUpdate: number;
}

export function useLiveCoinPrice(symbol: string) {
  const [priceData, setPriceData] = useState<LivePriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const symbolMap: { [key: string]: string } = {
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

  const fetchLivePrice = async () => {
    try {
      const coinId = symbolMap[symbol.toUpperCase()] || symbol.toLowerCase();
      
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=eur&include_24hr_change=true`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const coinData = data[coinId];
      
      if (coinData && mountedRef.current) {
        setPriceData({
          price: coinData.eur,
          change24h: coinData.eur_24h_change || 0,
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
    
    // Set up 15-second interval for live updates to avoid rate limiting
    intervalRef.current = setInterval(fetchLivePrice, 15000);
    
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