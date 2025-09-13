// CoinGecko API Integration - Free API, No Keys Required!

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

export interface CoinGeckoMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap_rank: number;
  market_cap: number;
}

export interface CoinGeckoChartData {
  prices: number[][];  // [timestamp, price]
}

// Fetch top coins market data (for MarketOverviewCard)
export async function fetchCoinGeckoMarkets(limit: number = 10): Promise<CoinGeckoMarketData[]> {
  try {
    const response = await fetch(
      `${COINGECKO_BASE_URL}/coins/markets?vs_currency=eur&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching CoinGecko market data:', error);
    throw error;
  }
}

// Fetch chart data for a specific coin (for CryptoCandlestickChart)
export async function fetchCoinGeckoChart(coinId: string, days: number = 1): Promise<CoinGeckoChartData> {
  try {
    const response = await fetch(
      `${COINGECKO_BASE_URL}/coins/${coinId}/market_chart?vs_currency=eur&days=${days}&interval=${days === 1 ? 'hourly' : 'daily'}`
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko chart API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching CoinGecko chart data:', error);
    throw error;
  }
}

// Map symbol to CoinGecko ID
export const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum', 
  'SOL': 'solana',
  'ADA': 'cardano',
  'DOT': 'polkadot',
  'MATIC': 'polygon',
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'LTC': 'litecoin',
  'XRP': 'ripple'
};

export function getCoingeckoId(symbol: string): string {
  return SYMBOL_TO_COINGECKO_ID[symbol.toUpperCase()] || symbol.toLowerCase();
}