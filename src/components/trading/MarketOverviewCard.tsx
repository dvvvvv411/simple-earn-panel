import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Activity, RefreshCw } from "lucide-react";
import { useCoinGeckoData } from "@/hooks/useCoinGeckoData";
import { Button } from "@/components/ui/button";

export function MarketOverviewCard() {
  const { coins, loading, error, refetch } = useCoinGeckoData();

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
      <Card className="bg-card/50 backdrop-blur-sm border-border/40">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Marktübersicht</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-16 mb-1" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
              <div className="text-right">
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/40 hover:bg-card/60 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Marktübersicht</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={refetch}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
            {error}
          </div>
        )}
        
        <div className="space-y-3">
          {coins.slice(0, 6).map((coin) => {
            const isPositive = coin.price_change_percentage_24h > 0;
            
            return (
              <div key={coin.id} className="flex items-center justify-between hover:bg-accent/20 p-2 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <img 
                    src={coin.image} 
                    alt={coin.name}
                    className="h-6 w-6 rounded-full"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiNmMWYxZjEiLz4KPHN2ZyBzdHJva2U9IiM5ca5hYTUiIGZpbGw9Im5vbmUiIHN0cm9rZS13aWR0aD0iMiIgdmlld0JveD0iMCAwIDI0IDI0Ij4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI0Ii8+Cjwvc3ZnPgo8L3N2Zz4K';
                    }}
                  />
                  <div>
                    <p className="text-sm font-medium">{coin.name}</p>
                    <p className="text-xs text-muted-foreground uppercase">{coin.symbol}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {formatPrice(coin.current_price)}
                  </p>
                  <div className="flex items-center gap-1">
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        isPositive ? 'text-green-600 border-green-200' : 'text-red-600 border-red-200'
                      }`}
                    >
                      {formatPercentage(coin.price_change_percentage_24h)}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="pt-2 border-t border-border/40">
          <p className="text-xs text-muted-foreground text-center">
            Daten von CoinGecko • Aktualisiert alle 2 Min
          </p>
        </div>
      </CardContent>
    </Card>
  );
}