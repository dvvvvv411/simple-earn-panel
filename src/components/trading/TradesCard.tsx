import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, BarChart3, Target, DollarSign } from "lucide-react";

export function TradesCard() {
  // Placeholder data - will be replaced with real data later
  const tradeStats = {
    totalTrades: 47,
    successfulTrades: 32,
    failedTrades: 15,
    successRate: 68,
    totalProfit: 1247.50
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/40 hover:bg-card/60 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Trading Statistiken</CardTitle>
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Target className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Gesamt Trades</span>
            </div>
            <p className="text-lg font-semibold">{tradeStats.totalTrades}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Erfolgsrate</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold">{tradeStats.successRate}%</p>
              <Badge variant="secondary" className="text-xs">
                {tradeStats.successfulTrades}/{tradeStats.totalTrades}
              </Badge>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Gesamtprofit</span>
            </div>
            <p className="text-lg font-bold text-green-600">
              +{formatCurrency(tradeStats.totalProfit)}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Nur Gewinn, ohne Einsatz berechnet
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm font-semibold text-green-600">{tradeStats.successfulTrades}</p>
            <p className="text-xs text-muted-foreground">Erfolgreich</p>
          </div>
          <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm font-semibold text-red-600">{tradeStats.failedTrades}</p>
            <p className="text-xs text-muted-foreground">Fehlgeschlagen</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}