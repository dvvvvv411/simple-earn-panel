import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, TrendingDown, Activity, RefreshCw } from "lucide-react";
import { useCoinMarketCap } from "@/contexts/CoinMarketCapContext";
import { Button } from "@/components/ui/button";

export function MarketOverviewCard() {
  const { coins, loading, error, refetch } = useCoinMarketCap();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage > 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

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
          <Button
            variant="ghost"
            size="sm"
            onClick={refetch}
            disabled={loading}
            className="h-9 w-9 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {error && (
          <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
            {error}
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
                      {formatPrice(coin.current_price)}
                    </p>
                    <div className="flex items-center gap-1 justify-end">
                      {isPositive ? (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          <span className="text-xs font-medium text-green-500">
                            {formatPercentage(coin.price_change_percentage_24h)}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <TrendingDown className="h-3 w-3 text-red-500" />
                          <span className="text-xs font-medium text-red-500">
                            {formatPercentage(coin.price_change_percentage_24h)}
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