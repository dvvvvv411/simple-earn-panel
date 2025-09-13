import { useState, useEffect, useRef, useCallback } from 'react';

export interface BinanceTickerData {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  lastPrice: string;
  volume: string;
  count: number;
}

interface BinanceStreamData {
  [symbol: string]: BinanceTickerData;
}

export function useBinanceWebSocket(symbols: string[] = ['BTC']) {
  const [data, setData] = useState<BinanceStreamData>({});
  const [usdtToEurRate, setUsdtToEurRate] = useState<number>(0.92); // Default fallback rate
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const formatSymbolForBinance = useCallback((symbol: string) => {
    // Convert symbols like 'BTC' to 'BTCUSDT' for Binance
    if (symbol.length === 3) {
      return `${symbol}USDT`.toLowerCase();
    }
    return symbol.toLowerCase();
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    // Format symbols for Binance stream and add EURUSDT for conversion
    const binanceSymbols = symbols.map(formatSymbolForBinance);
    const allSymbols = [...binanceSymbols, 'eurusdt'];
    const streams = allSymbols.map(symbol => `${symbol}@ticker`).join('/');
    
    // Use combined stream for multiple symbols
    const wsUrl = allSymbols.length === 1 
      ? `wss://stream.binance.com:9443/ws/${streams}`
      : `wss://stream.binance.com:9443/stream?streams=${streams}`;

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        if (mountedRef.current) {
          setIsConnected(true);
          setError(null);
          setLoading(false);
          console.log('Binance WebSocket connected');
        }
      };

      wsRef.current.onmessage = (event) => {
        if (!mountedRef.current) return;

        try {
          const response = JSON.parse(event.data);
          
          if (allSymbols.length === 1) {
            // Single stream response
            const tickerData: BinanceTickerData = {
              symbol: response.s,
              priceChange: response.p,
              priceChangePercent: response.P,
              lastPrice: response.c,
              volume: response.v,
              count: response.n
            };
            
            if (response.s === 'EURUSDT') {
              setUsdtToEurRate(parseFloat(response.c));
            } else {
              setData(prev => ({
                ...prev,
                [response.s]: tickerData
              }));
            }
          } else {
            // Combined stream response
            if (response.stream && response.data) {
              const tickerData: BinanceTickerData = {
                symbol: response.data.s,
                priceChange: response.data.p,
                priceChangePercent: response.data.P,
                lastPrice: response.data.c,
                volume: response.data.v,
                count: response.data.n
              };
              
              if (response.data.s === 'EURUSDT') {
                setUsdtToEurRate(parseFloat(response.data.c));
              } else {
                setData(prev => ({
                  ...prev,
                  [response.data.s]: tickerData
                }));
              }
            }
          }
        } catch (err) {
          console.error('Error parsing Binance WebSocket message:', err);
        }
      };

      wsRef.current.onclose = () => {
        if (mountedRef.current) {
          setIsConnected(false);
          console.log('Binance WebSocket disconnected');
          
          // Attempt to reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              connect();
            }
          }, 3000);
        }
      };

      wsRef.current.onerror = (err) => {
        if (mountedRef.current) {
          console.error('Binance WebSocket error:', err);
          setError('WebSocket-Verbindung fehlgeschlagen');
        }
      };

    } catch (err) {
      if (mountedRef.current) {
        console.error('Error creating WebSocket:', err);
        setError('Fehler beim Aufbau der WebSocket-Verbindung');
        setLoading(false);
      }
    }
  }, [symbols, formatSymbolForBinance]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const getSymbolData = useCallback((symbol: string) => {
    const binanceSymbol = formatSymbolForBinance(symbol).toUpperCase();
    const usdtData = data[binanceSymbol];
    
    if (!usdtData || !usdtToEurRate) return null;
    
    // Convert USDT prices to EUR
    const eurPrice = (parseFloat(usdtData.lastPrice) * usdtToEurRate).toString();
    const eurPriceChange = (parseFloat(usdtData.priceChange) * usdtToEurRate).toString();
    
    return {
      ...usdtData,
      lastPrice: eurPrice,
      priceChange: eurPriceChange,
      symbol: symbol.toUpperCase() + 'EUR' // Display as BTCEUR etc.
    };
  }, [data, formatSymbolForBinance, usdtToEurRate]);

  const formatPrice = useCallback((price: string) => {
    const numPrice = parseFloat(price);
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numPrice);
  }, []);

  const formatPercentage = useCallback((percentage: string) => {
    const numPercentage = parseFloat(percentage);
    return `${numPercentage > 0 ? '+' : ''}${numPercentage.toFixed(2)}%`;
  }, []);

  return {
    data,
    loading,
    error,
    isConnected,
    getSymbolData,
    formatPrice,
    formatPercentage
  };
}