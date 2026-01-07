import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Whitelist: Top 30 Kryptos + wichtige Stablecoins (alle Varianten)
const ALLOWED_CURRENCIES = new Set([
  // Top Kryptowährungen
  'btc', 'eth', 'bnb', 'xrp', 'sol', 'ada', 'doge', 'trx', 'link', 'matic',
  'dot', 'ltc', 'bch', 'xlm', 'xmr', 'etc', 'atom', 'near', 'avax', 'shib',
  'uni', 'ton', 'apt', 'arb', 'op', 'ftm', 'algo', 'vet', 'fil', 'sand',
  
  // Stablecoins - alle Varianten werden dynamisch gefiltert
  'usdt', 'usdterc20', 'usdttrc20', 'usdtbsc', 'usdtmatic', 'usdtsol', 'usdtarb', 'usdtop',
  'usdc', 'usdcerc20', 'usdcsol', 'usdcmatic', 'usdcarb', 'usdcop', 'usdcbsc',
  'dai', 'daierc20', 'busd', 'busdbsc', 'tusd', 'usdp', 'frax',
]);

// Beliebte Währungen die zuerst angezeigt werden (in dieser Reihenfolge)
const POPULAR_ORDER = ['btc', 'eth', 'usdt', 'usdc', 'sol', 'bnb', 'xrp', 'doge', 'ltc', 'trx'];

// Stablecoin Basis-Symbole
const STABLECOIN_BASES = ['usdt', 'usdc', 'dai', 'busd', 'tusd', 'usdp', 'frax'];

// Netzwerk Labels für Badge-Anzeige
const NETWORK_LABELS: Record<string, string> = {
  'eth': 'ERC20',
  'trx': 'TRC20',
  'bsc': 'BEP20',
  'matic': 'Polygon',
  'sol': 'Solana',
  'arb': 'Arbitrum',
  'op': 'Optimism',
  'avax': 'Avalanche',
  'ftm': 'Fantom',
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

export interface CryptoCurrency {
  code: string;          // Original code von NowPayments z.B. "usdttrc20"
  symbol: string;        // Basis-Symbol z.B. "usdt"
  name: string;          // Name von NowPayments z.B. "Tether TRC20"
  icon: string;          // Icon URL von NowPayments
  network?: string;      // Netzwerk z.B. "trx"
  networkLabel?: string; // Anzeige-Label z.B. "TRC20"
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
}

function getBaseSymbol(code: string): string {
  const lowerCode = code.toLowerCase();
  // Extrahiere Basis-Symbol aus Codes wie "usdttrc20" -> "usdt"
  for (const base of STABLECOIN_BASES) {
    if (lowerCode.startsWith(base)) {
      return base;
    }
  }
  return lowerCode;
}

function isAllowedCurrency(code: string): boolean {
  const lowerCode = code.toLowerCase();
  
  // Direkt in der Whitelist
  if (ALLOWED_CURRENCIES.has(lowerCode)) {
    return true;
  }
  
  // Stablecoin-Varianten erlauben (z.B. usdttrc20, usdcsol)
  for (const base of STABLECOIN_BASES) {
    if (lowerCode.startsWith(base)) {
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
        
        // Filtern auf erlaubte Währungen und anreichern
        const enrichedCurrencies: CryptoCurrency[] = currencyList
          .filter((c) => c.enable !== false && isAllowedCurrency(c.code))
          .map((currency) => {
            const lowerCode = currency.code.toLowerCase();
            const baseSymbol = getBaseSymbol(lowerCode);
            const isStablecoin = STABLECOIN_BASES.includes(baseSymbol);
            const networkLabel = currency.network ? NETWORK_LABELS[currency.network.toLowerCase()] : undefined;
            
            return {
              code: lowerCode,
              symbol: baseSymbol,
              name: currency.name || lowerCode.toUpperCase(),
              icon: currency.logo_url 
                ? `https://nowpayments.io${currency.logo_url}`
                : `https://nowpayments.io/images/coins/${lowerCode}.svg`,
              network: currency.network?.toLowerCase(),
              networkLabel,
              uriPrefix: URI_PREFIXES[baseSymbol] || baseSymbol,
              isPopular: POPULAR_ORDER.includes(baseSymbol) && !isStablecoin,
              isStablecoin,
            };
          });

        // Sortierung: 
        // 1. Beliebte Kryptos (in definierter Reihenfolge)
        // 2. Stablecoins (gruppiert nach Basis, dann nach Netzwerk)
        // 3. Rest alphabetisch
        enrichedCurrencies.sort((a, b) => {
          // Beliebte zuerst
          if (a.isPopular && !b.isPopular && !b.isStablecoin) return -1;
          if (!a.isPopular && b.isPopular && !a.isStablecoin) return 1;
          
          // Stablecoins nach Beliebt
          if (a.isStablecoin && !b.isStablecoin && !b.isPopular) return -1;
          if (!a.isStablecoin && b.isStablecoin && !a.isPopular) return 1;
          
          // Innerhalb Beliebte: nach definierter Reihenfolge
          if (a.isPopular && b.isPopular) {
            return POPULAR_ORDER.indexOf(a.symbol) - POPULAR_ORDER.indexOf(b.symbol);
          }
          
          // Innerhalb Stablecoins: nach Basis gruppieren, dann nach Netzwerk-Label
          if (a.isStablecoin && b.isStablecoin) {
            const baseCompare = a.symbol.localeCompare(b.symbol);
            if (baseCompare !== 0) return baseCompare;
            // Innerhalb gleicher Basis: nach Netzwerk sortieren
            return (a.networkLabel || '').localeCompare(b.networkLabel || '');
          }
          
          // Rest alphabetisch
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
          isStablecoin: STABLECOIN_BASES.includes(symbol),
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

  return { 
    currencies, 
    popularCurrencies,
    stablecoinCurrencies,
    otherCurrencies, 
    loading, 
    error 
  };
}
