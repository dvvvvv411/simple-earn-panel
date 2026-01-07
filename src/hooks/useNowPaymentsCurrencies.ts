import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Top 30 Kryptowährungen (Basis-Symbole, lowercase)
const ALLOWED_BASE_SYMBOLS = new Set([
  'btc', 'eth', 'bnb', 'xrp', 'sol', 'ada', 'doge', 'trx', 'link', 'matic',
  'dot', 'ltc', 'bch', 'xlm', 'xmr', 'etc', 'atom', 'near', 'avax', 'shib',
  'uni', 'ton', 'apt', 'arb', 'op', 'ftm', 'algo', 'vet', 'fil', 'sand',
  'aave', 'hbar', 'icp', 'inj', 'ape', 'grt', 'ldo', 'mkr', 'rune', 'snx'
]);

// Stablecoin-Prefixe - alle Varianten automatisch erlauben
const STABLECOIN_PREFIXES = ['usdt', 'usdc', 'dai', 'busd', 'tusd', 'usdp', 'frax'];

// Beliebte Währungen die zuerst angezeigt werden (in dieser Reihenfolge)
const POPULAR_ORDER = ['btc', 'eth', 'sol', 'bnb', 'xrp', 'doge', 'ltc', 'trx', 'ada', 'matic'];

// Netzwerk-Code zu Label Mapping
const NETWORK_LABELS: Record<string, string> = {
  'eth': 'ERC20',
  'erc20': 'ERC20',
  'trx': 'TRC20',
  'trc20': 'TRC20',
  'bsc': 'BEP20',
  'bep20': 'BEP20',
  'matic': 'Polygon',
  'polygon': 'Polygon',
  'sol': 'Solana',
  'solana': 'Solana',
  'arb': 'Arbitrum',
  'arbitrum': 'Arbitrum',
  'op': 'Optimism',
  'optimism': 'Optimism',
  'avaxc': 'Avalanche',
  'avalanche': 'Avalanche',
  'ton': 'TON',
  'algo': 'Algorand',
  'algorand': 'Algorand',
  'base': 'Base',
  'celo': 'CELO',
  'near': 'NEAR',
  'xlm': 'Stellar',
  'stellar': 'Stellar',
  'cosmos': 'Cosmos',
  'osmosis': 'Osmosis',
  'fantom': 'Fantom',
  'ftm': 'Fantom',
  'kcc': 'KCC',
  'heco': 'HECO',
  'zksync': 'zkSync',
  'linea': 'Linea',
  'scroll': 'Scroll',
  'mantle': 'Mantle',
  'moonbeam': 'Moonbeam',
  'moonriver': 'Moonriver',
  'cronos': 'Cronos',
};

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

// Netzwerk-Icons (Chain-spezifische Logos)
const NETWORK_ICONS: Record<string, string> = {
  'eth': 'https://nowpayments.io/images/coins/eth.svg',
  'erc20': 'https://nowpayments.io/images/coins/eth.svg',
  'trx': 'https://nowpayments.io/images/coins/trx.svg',
  'trc20': 'https://nowpayments.io/images/coins/trx.svg',
  'bsc': 'https://nowpayments.io/images/coins/bnb.svg',
  'bep20': 'https://nowpayments.io/images/coins/bnb.svg',
  'matic': 'https://nowpayments.io/images/coins/matic.svg',
  'polygon': 'https://nowpayments.io/images/coins/matic.svg',
  'sol': 'https://nowpayments.io/images/coins/sol.svg',
  'solana': 'https://nowpayments.io/images/coins/sol.svg',
  'arb': 'https://cryptologos.cc/logos/arbitrum-arb-logo.svg',
  'arbitrum': 'https://cryptologos.cc/logos/arbitrum-arb-logo.svg',
  'op': 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.svg',
  'optimism': 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.svg',
  'avaxc': 'https://nowpayments.io/images/coins/avax.svg',
  'avalanche': 'https://nowpayments.io/images/coins/avax.svg',
  'ton': 'https://nowpayments.io/images/coins/ton.svg',
  'algo': 'https://nowpayments.io/images/coins/algo.svg',
  'algorand': 'https://nowpayments.io/images/coins/algo.svg',
  'base': 'https://raw.githubusercontent.com/base-org/brand-kit/main/logo/symbol/Base_Symbol_Blue.svg',
  'fantom': 'https://nowpayments.io/images/coins/ftm.svg',
  'ftm': 'https://nowpayments.io/images/coins/ftm.svg',
  'near': 'https://nowpayments.io/images/coins/near.svg',
  'xlm': 'https://nowpayments.io/images/coins/xlm.svg',
  'stellar': 'https://nowpayments.io/images/coins/xlm.svg',
  'celo': 'https://nowpayments.io/images/coins/celo.svg',
};

export interface CryptoCurrency {
  code: string;          // Original code von NowPayments z.B. "usdttrc20"
  symbol: string;        // Basis-Symbol z.B. "usdt"
  name: string;          // Name von NowPayments z.B. "Tether TRC20"
  icon: string;          // Icon URL von NowPayments
  network?: string;      // Netzwerk z.B. "trx"
  networkLabel?: string; // Anzeige-Label z.B. "TRC20"
  networkIcon?: string;  // Icon URL für das Netzwerk
  uriPrefix: string;
  isPopular: boolean;
  isStablecoin: boolean;
}

interface NowPaymentsCurrency {
  code: string;
  name: string;
  logo_url: string;
  network?: string;
  enable?: boolean;
  available_for_payment?: boolean;
}

function getBaseSymbol(code: string): string {
  const lowerCode = code.toLowerCase();
  
  // Stablecoin-Prefixe extrahieren
  for (const prefix of STABLECOIN_PREFIXES) {
    if (lowerCode.startsWith(prefix)) {
      return prefix;
    }
  }
  
  return lowerCode;
}

function extractNetworkFromCode(code: string, baseSymbol: string): string | undefined {
  const lowerCode = code.toLowerCase();
  
  // Wenn der Code länger als das Basis-Symbol ist, ist der Rest das Netzwerk
  if (lowerCode.length > baseSymbol.length && lowerCode.startsWith(baseSymbol)) {
    return lowerCode.slice(baseSymbol.length);
  }
  
  return undefined;
}

function getNetworkLabel(network: string | undefined, codeNetwork: string | undefined): string | undefined {
  // Zuerst versuchen wir das Netzwerk aus der API
  if (network) {
    const label = NETWORK_LABELS[network.toLowerCase()];
    if (label) return label;
  }
  
  // Dann aus dem Code extrahiertes Netzwerk
  if (codeNetwork) {
    const label = NETWORK_LABELS[codeNetwork.toLowerCase()];
    if (label) return label;
    
    // Fallback: Netzwerk-Code in Großbuchstaben
    return codeNetwork.toUpperCase();
  }
  
  return undefined;
}

function getNetworkIcon(network: string | undefined, codeNetwork: string | undefined): string | undefined {
  // Zuerst versuchen wir das Netzwerk aus der API
  if (network) {
    const icon = NETWORK_ICONS[network.toLowerCase()];
    if (icon) return icon;
  }
  
  // Dann aus dem Code extrahiertes Netzwerk
  if (codeNetwork) {
    const icon = NETWORK_ICONS[codeNetwork.toLowerCase()];
    if (icon) return icon;
  }
  
  return undefined;
}

function isAllowedCurrency(currency: NowPaymentsCurrency): boolean {
  const code = currency.code.toLowerCase();
  
  // Nur Währungen die für Zahlungen verfügbar sind
  if (currency.available_for_payment !== true) {
    return false;
  }
  
  // Exakt in Top-30+ Liste (für normale Kryptos wie btc, eth, sol)
  if (ALLOWED_BASE_SYMBOLS.has(code)) {
    return true;
  }
  
  // Stablecoin-Variante (z.B. usdttrc20, usdcsol, usdterc20)
  for (const prefix of STABLECOIN_PREFIXES) {
    if (code.startsWith(prefix)) {
      return true;
    }
  }
  
  return false;
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

        const currencyList: NowPaymentsCurrency[] = data?.currencies || [];
        
        console.log('Raw currencies from API:', currencyList.length);
        
        // Filtern auf erlaubte Währungen und anreichern
        const enrichedCurrencies: CryptoCurrency[] = currencyList
          .filter(isAllowedCurrency)
          .map((currency) => {
            const lowerCode = currency.code.toLowerCase();
            const baseSymbol = getBaseSymbol(lowerCode);
            const isStablecoin = STABLECOIN_PREFIXES.some(p => lowerCode.startsWith(p));
            const codeNetwork = extractNetworkFromCode(lowerCode, baseSymbol);
            const networkLabel = getNetworkLabel(currency.network, codeNetwork);
            const networkIcon = getNetworkIcon(currency.network, codeNetwork);
            
            return {
              code: lowerCode,
              symbol: baseSymbol,
              name: currency.name || lowerCode.toUpperCase(),
              icon: currency.logo_url 
                ? `https://nowpayments.io${currency.logo_url}`
                : `https://nowpayments.io/images/coins/${lowerCode}.svg`,
              network: currency.network?.toLowerCase() || codeNetwork,
              networkLabel,
              networkIcon,
              uriPrefix: URI_PREFIXES[baseSymbol] || baseSymbol,
              isPopular: POPULAR_ORDER.includes(baseSymbol) && !isStablecoin,
              isStablecoin,
            };
          });

        console.log('Filtered currencies:', enrichedCurrencies.length);
        console.log('Stablecoins:', enrichedCurrencies.filter(c => c.isStablecoin).map(c => `${c.code} (${c.networkLabel})`));

        // Sortierung
        enrichedCurrencies.sort((a, b) => {
          // 1. Beliebte zuerst (nicht Stablecoins)
          if (a.isPopular && !b.isPopular) return -1;
          if (!a.isPopular && b.isPopular) return 1;
          
          // 2. Innerhalb Beliebte: nach definierter Reihenfolge
          if (a.isPopular && b.isPopular) {
            return POPULAR_ORDER.indexOf(a.symbol) - POPULAR_ORDER.indexOf(b.symbol);
          }
          
          // 3. Stablecoins nach Beliebten
          if (a.isStablecoin && !b.isStablecoin) return -1;
          if (!a.isStablecoin && b.isStablecoin) return 1;
          
          // 4. Innerhalb Stablecoins: nach Basis gruppieren (usdt vor usdc vor dai)
          if (a.isStablecoin && b.isStablecoin) {
            const stablecoinOrder = ['usdt', 'usdc', 'dai', 'busd', 'tusd', 'usdp', 'frax'];
            const aIndex = stablecoinOrder.indexOf(a.symbol);
            const bIndex = stablecoinOrder.indexOf(b.symbol);
            if (aIndex !== bIndex) return aIndex - bIndex;
            
            // Gleiche Basis: nach Netzwerk-Label sortieren
            return (a.networkLabel || '').localeCompare(b.networkLabel || '');
          }
          
          // 5. Rest alphabetisch nach Name
          return a.name.localeCompare(b.name);
        });

        setCurrencies(enrichedCurrencies);
      } catch (err) {
        console.error('Error fetching currencies:', err);
        setError(err instanceof Error ? err.message : 'Failed to load currencies');
        
        // Fallback auf Basis-Währungen
        const fallbackCurrencies: CryptoCurrency[] = POPULAR_ORDER.map(symbol => ({
          code: symbol,
          symbol,
          name: symbol.toUpperCase(),
          icon: `https://nowpayments.io/images/coins/${symbol}.svg`,
          uriPrefix: URI_PREFIXES[symbol] || symbol,
          isPopular: true,
          isStablecoin: false,
        }));
        setCurrencies(fallbackCurrencies);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrencies();
  }, []);

  const popularCurrencies = currencies.filter(c => c.isPopular);
  const stablecoinCurrencies = currencies.filter(c => c.isStablecoin);
  const otherCurrencies = currencies.filter(c => !c.isPopular && !c.isStablecoin);
  
  // Stablecoins nach Typ gruppieren
  const usdtCurrencies = stablecoinCurrencies.filter(c => c.symbol === 'usdt');
  const usdcCurrencies = stablecoinCurrencies.filter(c => c.symbol === 'usdc');
  const otherStablecoins = stablecoinCurrencies.filter(c => c.symbol !== 'usdt' && c.symbol !== 'usdc');

  return { 
    currencies, 
    popularCurrencies,
    stablecoinCurrencies,
    usdtCurrencies,
    usdcCurrencies,
    otherStablecoins,
    otherCurrencies, 
    loading, 
    error 
  };
}
