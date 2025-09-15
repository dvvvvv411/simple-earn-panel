import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CryptoPrice {
  id: string;
  symbol: string;
  price: number;
  change_24h: number;
  timestamp: string;
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

const COIN_NAMES: Record<string, string> = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum', 
  SOL: 'Solana',
  ADA: 'Cardano',
  DOT: 'Polkadot',
  LINK: 'Chainlink',
  XRP: 'XRP',
  LTC: 'Litecoin',
  BCH: 'Bitcoin Cash',
  BNB: 'BNB',
  USDT: 'Tether',
  USDC: 'USD Coin',
  DOGE: 'Dogecoin',
  TRX: 'TRON'
};

const COIN_IDS: Record<string, number> = {
  BTC: 1,
  ETH: 1027,
  SOL: 5426,
  ADA: 2010,
  DOT: 6636,
  LINK: 1975,
  XRP: 52,
  LTC: 2,
  BCH: 1831,
  BNB: 1839,
  USDT: 825,
  USDC: 3408,
  DOGE: 74,
  TRX: 1958
};

export function useCryptoPrices() {
  const [coins, setCoins] = useState<FormattedCoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLatestPrices = async () => {
    try {
      setLoading(true);
      
      // Get latest price for each symbol
      const { data: pricesData, error: pricesError } = await supabase
        .from('crypto_price_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (pricesError) {
        throw pricesError;
      }

      // Group by symbol and get latest entry for each
      const latestPrices = new Map<string, CryptoPrice>();
      pricesData?.forEach((price: any) => {
        if (!latestPrices.has(price.symbol) || 
            new Date(price.created_at) > new Date(latestPrices.get(price.symbol)!.timestamp)) {
          latestPrices.set(price.symbol, {
            id: price.id,
            symbol: price.symbol,
            price: price.price,
            change_24h: price.change_24h,
            timestamp: price.created_at
          });
        }
      });

      // Format for display
      const formattedCoins: FormattedCoinData[] = Array.from(latestPrices.values())
        .map((price, index) => ({
          id: COIN_IDS[price.symbol]?.toString() || price.id,
          symbol: price.symbol.toLowerCase(),
          name: COIN_NAMES[price.symbol] || price.symbol,
          image: `https://s2.coinmarketcap.com/static/img/coins/32x32/${COIN_IDS[price.symbol] || 1}.png`,
          current_price: price.price,
          price_change_percentage_24h: price.change_24h,
          market_cap_rank: index + 1
        }))
        .sort((a, b) => a.market_cap_rank - b.market_cap_rank);

      setCoins(formattedCoins);
      setError(null);
    } catch (err) {
      console.error('Error fetching crypto prices:', err);
      setError('Failed to load market data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestPrices();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('crypto-price-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'crypto_price_history'
        },
        () => {
          fetchLatestPrices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const refetch = () => {
    fetchLatestPrices();
  };

  return {
    coins,
    loading,
    error,
    refetch
  };
}