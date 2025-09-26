import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, TrendingDown, Activity, RefreshCw } from "lucide-react";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { Button } from "@/components/ui/button";

export function MarketOverviewCard() {
  const { coins, loading, error, refetch } = useCryptoPrices();

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
      <CardHeader className="pb-4 lg:pb-6 xl:pb-8 p-6 lg:p-8 xl:p-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl lg:text-2xl xl:text-3xl font-semibold text-foreground flex items-center gap-3 lg:gap-4">
            <div className="h-10 w-10 lg:h-12 lg:w-12 xl:h-14 xl:w-14 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="h-5 w-5 lg:h-6 lg:w-6 xl:h-7 xl:w-7 text-primary" />
            </div>
            Marktübersicht
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={refetch}
            disabled={loading}
            className="h-9 w-9 lg:h-11 lg:w-11 xl:h-13 xl:w-13 p-0"
          >
            <RefreshCw className={`h-4 w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 lg:space-y-3 xl:space-y-4 p-6 lg:p-8 xl:p-10 pt-0">
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
                <div key={coin.id} className="flex items-center justify-between hover:bg-accent/20 p-1.5 lg:p-2.5 xl:p-3.5 rounded-lg transition-colors">
                  <div className="flex items-center gap-2 lg:gap-3 xl:gap-4">
                    <img 
                      src={coin.image} 
                      alt={coin.name}
                      className="h-5 w-5 lg:h-6 lg:w-6 xl:h-8 xl:w-8 rounded-full"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiNmMWYxZjEiLz4KPHN2ZyBzdHJva2U9IiM5ca5hYTUiIGZpbGw9Im5vbmUiIHN0cm9rZS13aWR0aD0iMiIgdmlld0JveD0iMCAwIDI0IDI0Ij4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI0Ii8+Cjwvc3ZnPgo8L3N2Zz4K';
                      }}
                    />
                    <div>
                      <p className="text-sm lg:text-base xl:text-lg font-medium truncate max-w-[80px] lg:max-w-[100px] xl:max-w-[120px]">{coin.name}</p>
                      <p className="text-xs lg:text-sm xl:text-base text-muted-foreground uppercase">{coin.symbol}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm lg:text-base xl:text-lg font-semibold">
                      {formatPrice(coin.current_price)}
                    </p>
                    <div className="flex items-center gap-1 lg:gap-2 justify-end">
                      {isPositive ? (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 lg:h-4 lg:w-4 xl:h-5 xl:w-5 text-green-500" />
                          <span className="text-xs lg:text-sm xl:text-base font-medium text-green-500">
                            {formatPercentage(coin.price_change_percentage_24h)}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <TrendingDown className="h-3 w-3 lg:h-4 lg:w-4 xl:h-5 xl:w-5 text-red-500" />
                          <span className="text-xs lg:text-sm xl:text-base font-medium text-red-500">
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