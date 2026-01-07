import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Mapping von Symbol zu lesbarem Namen
const CRYPTO_NAMES: Record<string, string> = {
  btc: 'Bitcoin',
  eth: 'Ethereum',
  usdt: 'Tether',
  usdterc20: 'Tether (ERC20)',
  usdttrc20: 'Tether (TRC20)',
  usdtbsc: 'Tether (BSC)',
  usdc: 'USD Coin',
  ltc: 'Litecoin',
  xrp: 'Ripple',
  doge: 'Dogecoin',
  sol: 'Solana',
  bnb: 'BNB',
  ada: 'Cardano',
  trx: 'Tron',
  matic: 'Polygon',
  dot: 'Polkadot',
  avax: 'Avalanche',
  shib: 'Shiba Inu',
  link: 'Chainlink',
  uni: 'Uniswap',
  atom: 'Cosmos',
  xlm: 'Stellar',
  xmr: 'Monero',
  etc: 'Ethereum Classic',
  bch: 'Bitcoin Cash',
  fil: 'Filecoin',
  vet: 'VeChain',
  algo: 'Algorand',
  near: 'NEAR Protocol',
  ftm: 'Fantom',
  sand: 'The Sandbox',
  mana: 'Decentraland',
  aave: 'Aave',
  grt: 'The Graph',
  mkr: 'Maker',
  snx: 'Synthetix',
  crv: 'Curve DAO',
  comp: 'Compound',
  yfi: 'yearn.finance',
  sushi: 'SushiSwap',
  '1inch': '1inch',
  bat: 'Basic Attention Token',
  zec: 'Zcash',
  dash: 'Dash',
  eos: 'EOS',
  neo: 'NEO',
  waves: 'Waves',
  xtz: 'Tezos',
  theta: 'Theta Network',
  egld: 'MultiversX',
  hbar: 'Hedera',
  icp: 'Internet Computer',
  kcs: 'KuCoin Token',
  cro: 'Cronos',
  cake: 'PancakeSwap',
  apt: 'Aptos',
  arb: 'Arbitrum',
  op: 'Optimism',
  sui: 'Sui',
  ton: 'Toncoin',
  inj: 'Injective',
  sei: 'Sei',
  tia: 'Celestia',
  jup: 'Jupiter',
  wif: 'dogwifhat',
  pepe: 'Pepe',
  floki: 'Floki',
  bonk: 'Bonk',
};

// Beliebte Währungen die oben angezeigt werden sollen
const POPULAR_CURRENCIES = ['btc', 'eth', 'usdt', 'usdterc20', 'usdc', 'ltc', 'xrp', 'doge', 'sol', 'bnb', 'trx', 'matic'];

// URI Prefixes für QR-Codes
const URI_PREFIXES: Record<string, string> = {
  btc: 'bitcoin',
  eth: 'ethereum',
  ltc: 'litecoin',
  doge: 'dogecoin',
  bch: 'bitcoincash',
  xrp: 'ripple',
  sol: 'solana',
  bnb: 'bnb',
  trx: 'tron',
};

export interface CryptoCurrency {
  symbol: string;
  name: string;
  icon: string;
  uriPrefix: string;
  isPopular: boolean;
}

// CoinGecko Icon URLs für bekannte Währungen
function getCryptoIcon(symbol: string): string {
  const iconMap: Record<string, string> = {
    btc: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
    eth: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    usdt: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
    usdterc20: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
    usdttrc20: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
    usdtbsc: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
    usdc: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
    ltc: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png',
    xrp: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
    doge: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
    sol: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
    bnb: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
    ada: 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
    trx: 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png',
    matic: 'https://assets.coingecko.com/coins/images/4713/small/polygon.png',
    dot: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png',
    avax: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
    shib: 'https://assets.coingecko.com/coins/images/11939/small/shiba.png',
    link: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
    uni: 'https://assets.coingecko.com/coins/images/12504/small/uni.jpg',
    atom: 'https://assets.coingecko.com/coins/images/1481/small/cosmos_hub.png',
    xlm: 'https://assets.coingecko.com/coins/images/100/small/Stellar_symbol_black_RGB.png',
    xmr: 'https://assets.coingecko.com/coins/images/69/small/monero_logo.png',
    etc: 'https://assets.coingecko.com/coins/images/453/small/ethereum-classic-logo.png',
    bch: 'https://assets.coingecko.com/coins/images/780/small/bitcoin-cash-circle.png',
    ton: 'https://assets.coingecko.com/coins/images/17980/small/ton_symbol.png',
    pepe: 'https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg',
  };
  
  return iconMap[symbol.toLowerCase()] || `https://nowpayments.io/images/coins/${symbol.toLowerCase()}.svg`;
}

export function useNowPaymentsCurrencies() {
  const [currencies, setCurrencies] = useState<CryptoCurrency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fnError } = await supabase.functions.invoke('nowpayments-currencies');

        if (fnError) {
          throw new Error(fnError.message);
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        const currencyList: string[] = data?.currencies || [];
        
        // Währungen anreichern und sortieren
        const enrichedCurrencies: CryptoCurrency[] = currencyList.map((symbol: string) => {
          const lowerSymbol = symbol.toLowerCase();
          return {
            symbol: lowerSymbol,
            name: CRYPTO_NAMES[lowerSymbol] || symbol.toUpperCase(),
            icon: getCryptoIcon(lowerSymbol),
            uriPrefix: URI_PREFIXES[lowerSymbol] || lowerSymbol,
            isPopular: POPULAR_CURRENCIES.includes(lowerSymbol),
          };
        });

        // Sortierung: Beliebte zuerst (in definierter Reihenfolge), dann alphabetisch nach Name
        enrichedCurrencies.sort((a, b) => {
          const aPopularIndex = POPULAR_CURRENCIES.indexOf(a.symbol);
          const bPopularIndex = POPULAR_CURRENCIES.indexOf(b.symbol);
          
          if (a.isPopular && b.isPopular) {
            return aPopularIndex - bPopularIndex;
          }
          if (a.isPopular) return -1;
          if (b.isPopular) return 1;
          
          return a.name.localeCompare(b.name);
        });

        setCurrencies(enrichedCurrencies);
      } catch (err) {
        console.error('Error fetching currencies:', err);
        setError(err instanceof Error ? err.message : 'Failed to load currencies');
        
        // Fallback auf beliebte Währungen
        const fallbackCurrencies: CryptoCurrency[] = POPULAR_CURRENCIES.map(symbol => ({
          symbol,
          name: CRYPTO_NAMES[symbol] || symbol.toUpperCase(),
          icon: getCryptoIcon(symbol),
          uriPrefix: URI_PREFIXES[symbol] || symbol,
          isPopular: true,
        }));
        setCurrencies(fallbackCurrencies);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrencies();
  }, []);

  const popularCurrencies = currencies.filter(c => c.isPopular);
  const otherCurrencies = currencies.filter(c => !c.isPopular);

  return { 
    currencies, 
    popularCurrencies, 
    otherCurrencies, 
    loading, 
    error 
  };
}
