import { useState, useEffect } from 'react';

interface CoinData {
  id: number;
  symbol: string;
  name: string;
  quote: {
    EUR: {
      price: number;
      percent_change_24h: number;
    }
  };
  cmc_rank: number;
}

interface CMCResponse {
  data: CoinData[];
}

interface FormattedCoinData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  image: string;
  market_cap_rank: number;
}

export function useCoinMarketCapData() {
  const [coins, setCoins] = useState<FormattedCoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const coinImages: { [key: string]: string } = {
    'BTC': 'https://coin-images.coingecko.com/coins/images/1/small/bitcoin.png',
    'ETH': 'https://coin-images.coingecko.com/coins/images/279/small/ethereum.png',
    'XRP': 'https://coin-images.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
    'USDT': 'https://coin-images.coingecko.com/coins/images/325/small/Tether.png',
    'SOL': 'https://coin-images.coingecko.com/coins/images/4128/small/solana.png',
    'BNB': 'https://coin-images.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
    'USDC': 'https://coin-images.coingecko.com/coins/images/6319/small/usdc.png',
    'DOGE': 'https://coin-images.coingecko.com/coins/images/5/small/dogecoin.png',
    'STETH': 'https://coin-images.coingecko.com/coins/images/13442/small/steth_logo.png',
    'ADA': 'https://coin-images.coingecko.com/coins/images/975/small/cardano.png'
  };

  useEffect(() => {
    fetchCoinData();
    
    // Update every 20 seconds
    const interval = setInterval(fetchCoinData, 20000);
    return () => clearInterval(interval);
  }, []);

  const fetchCoinData = async () => {
    try {
      setError(null);
      
      const data: CMCResponse = await import('@/lib/coinmarketcap').then(({ fetchCoinMarketCapData }) =>
        fetchCoinMarketCapData('listings', {
          start: 1,
          limit: 10,
          convert: 'EUR'
        })
      );
      
      // Transform CMC data to match CoinGecko format
      const formattedCoins: FormattedCoinData[] = data.data.map(coin => ({
        id: coin.symbol.toLowerCase(),
        symbol: coin.symbol.toLowerCase(),
        name: coin.name,
        current_price: coin.quote.EUR.price,
        price_change_percentage_24h: coin.quote.EUR.percent_change_24h,
        image: coinImages[coin.symbol] || 'https://coin-images.coingecko.com/coins/images/1/small/bitcoin.png',
        market_cap_rank: coin.cmc_rank
      }));
      
      setCoins(formattedCoins);
    } catch (err) {
      console.error('Error fetching CoinMarketCap data:', err);
      setError('Fehler beim Laden der Marktdaten');
      
      // Set placeholder data on error
      setCoins([
        {
          id: 'bitcoin',
          symbol: 'btc',
          name: 'Bitcoin',
          current_price: 45678.90,
          price_change_percentage_24h: 2.34,
          image: 'https://coin-images.coingecko.com/coins/images/1/small/bitcoin.png',
          market_cap_rank: 1
        },
        {
          id: 'ethereum',
          symbol: 'eth',
          name: 'Ethereum',
          current_price: 2890.45,
          price_change_percentage_24h: -1.23,
          image: 'https://coin-images.coingecko.com/coins/images/279/small/ethereum.png',
          market_cap_rank: 2
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return { coins, loading, error, refetch: fetchCoinData };
}