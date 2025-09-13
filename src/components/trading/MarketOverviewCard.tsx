import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, TrendingDown, Activity, Wifi } from "lucide-react";
import { useBinanceWebSocket } from "@/hooks/useBinanceWebSocket";
import { Button } from "@/components/ui/button";

export function MarketOverviewCard() {
  // Popular cryptocurrencies with EUR pairs on Binance
  const cryptoSymbols = ['BTC', 'ETH', 'ADA', 'SOL', 'MATIC', 'DOT', 'AVAX', 'LINK'];
  const { data, loading, error, isConnected, formatPrice, formatPercentage } = useBinanceWebSocket(cryptoSymbols);

  // Convert Binance symbols to display data
  const coins = cryptoSymbols.map(symbol => {
    const binanceData = data[`${symbol}EUR`];
    if (!binanceData) return null;
    
    return {
      id: symbol.toLowerCase(),
      symbol: symbol.toLowerCase(),
      name: getCryptoName(symbol),
      current_price: parseFloat(binanceData.lastPrice),
      price_change_percentage_24h: parseFloat(binanceData.priceChangePercent),
      image: getCryptoImage(symbol)
    };
  }).filter(Boolean);

  function getCryptoName(symbol: string): string {
    const names: { [key: string]: string } = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum', 
      'ADA': 'Cardano',
      'SOL': 'Solana',
      'MATIC': 'Polygon',
      'DOT': 'Polkadot',
      'AVAX': 'Avalanche',
      'LINK': 'Chainlink'
    };
    return names[symbol] || symbol;
  }

  function getCryptoImage(symbol: string): string {
    const images: { [key: string]: string } = {
      'BTC': 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
      'ETH': 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
      'ADA': 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
      'SOL': 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
      'MATIC': 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',
      'DOT': 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png',
      'AVAX': 'https://assets.coingecko.com/coins/images/12559/small/coin-round-red.png',
      'LINK': 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png'
    };
    return images[symbol] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiNmMWYxZjEiLz4KPHN2ZyBzdHJva2U9IiM5ca5hYTUiIGZpbGw9Im5vbmUiIHN0cm9rZS13aWR0aD0iMiIgdmlld0JveD0iMCAwIDI0IDI0Ij4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI0Ii8+Cjwvc3ZnPgo8L3N2Zz4K';
  }


  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            Marktübersicht
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
              <div className="text-right">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            Marktübersicht
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 text-xs ${isConnected ? 'text-green-600' : 'text-gray-500'}`}>
              <Wifi className={`h-4 w-4 ${isConnected ? 'animate-pulse' : ''}`} />
              <span>{isConnected ? 'LIVE' : 'OFFLINE'}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {error && (
          <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
            {error} - Verwende Fallback-Daten
          </div>
        )}
        
        <ScrollArea className="h-72">
          <div className="space-y-2 pr-4">
            {coins.map((coin) => {
              const isPositive = coin.price_change_percentage_24h > 0;
              
              return (
                <div key={coin.id} className="flex items-center justify-between hover:bg-accent/20 p-1.5 rounded-lg transition-colors">
                  <div className="flex items-center gap-2">
                    <img 
                      src={coin.image} 
                      alt={coin.name}
                      className="h-5 w-5 rounded-full"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiNmMWYxZjEiLz4KPHN2ZyBzdHJva2U9IiM5ca5hYTUiIGZpbGw9Im5vbmUiIHN0cm9rZS13aWR0aD0iMiIgdmlld0JveD0iMCAwIDI0IDI0Ij4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI0Ii8+Cjwvc3ZnPgo8L3N2Zz4K';
                      }}
                    />
                    <div>
                      <p className="text-sm font-medium truncate max-w-[80px]">{coin.name}</p>
                      <p className="text-xs text-muted-foreground uppercase">{coin.symbol}</p>
                    </div>
                  </div>
                  
                   <div className="text-right">
                     <p className="text-sm font-semibold">
                       {formatPrice(coin.current_price.toString())}
                     </p>
                    <div className="flex items-center gap-1 justify-end">
                      {isPositive ? (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                           <span className="text-xs font-medium text-green-500">
                             {formatPercentage(coin.price_change_percentage_24h.toString())}
                           </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <TrendingDown className="h-3 w-3 text-red-500" />
                           <span className="text-xs font-medium text-red-500">
                             {formatPercentage(coin.price_change_percentage_24h.toString())}
                           </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}