import { useState, useEffect } from 'react';

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  image: string;
  market_cap_rank: number;
}

export function useCoinGeckoData() {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCoinData();
    
    // Refresh data every 5 minutes to reduce API calls
    const interval = setInterval(fetchCoinData, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchCoinData = async () => {
    try {
      setError(null);
      
      // Fetch top 10 cryptocurrencies in EUR
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=eur&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h'
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setCoins(data);
    } catch (err) {
      console.error('Error fetching CoinGecko data:', err);
      setError('Fehler beim Laden der Marktdaten');
      
      // Set placeholder data on error
      setCoins([
        {
          id: 'bitcoin',
          symbol: 'btc',
          name: 'Bitcoin',
          current_price: 45678.90,
          price_change_percentage_24h: 2.34,
          image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
          market_cap_rank: 1
        },
        {
          id: 'ethereum',
          symbol: 'eth',
          name: 'Ethereum',
          current_price: 2890.45,
          price_change_percentage_24h: -1.23,
          image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
          market_cap_rank: 2
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return { coins, loading, error, refetch: fetchCoinData };
}