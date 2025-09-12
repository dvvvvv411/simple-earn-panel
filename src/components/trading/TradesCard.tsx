import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, BarChart3, Target, DollarSign, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TradesCard() {
  // Placeholder data - will be replaced with real data later
  const tradeStats = {
    totalTrades: 47,
    successfulTrades: 32,
    failedTrades: 15,
    successRate: 68,
    totalProfit: 1247.50,
    averageTradeDuration: "2h 15min"
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          Trading Statistiken
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Button 
          className="w-full"
          onClick={() => console.log('Trading starten')}
        >
          <Play className="h-4 w-4" />
          Trading starten
        </Button>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <p className="text-3xl font-bold text-foreground">{tradeStats.totalTrades}</p>
            <p className="text-sm text-muted-foreground">Gesamt Trades</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-3xl font-bold" style={{ color: 'hsl(var(--brand-accent, var(--primary)))' }}>
              {tradeStats.successRate}%
            </p>
            <p className="text-sm text-muted-foreground">Erfolgsrate</p>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <div className="space-y-1">
            <p className="text-2xl font-bold" style={{ color: 'hsl(var(--brand-accent, var(--primary)))' }}>
              +{formatCurrency(tradeStats.totalProfit)}
            </p>
            <p className="text-sm text-muted-foreground">Gesamtprofit (Reingewinn)</p>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <Target className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{tradeStats.successfulTrades}</p>
                <p className="text-xs text-muted-foreground">Erfolgreich</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <Target className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{tradeStats.failedTrades}</p>
                <p className="text-xs text-muted-foreground">Fehlgeschlagen</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 pt-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">{tradeStats.averageTradeDuration}</p>
              <p className="text-xs text-muted-foreground">Durchschnittliche Trade-Dauer</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}