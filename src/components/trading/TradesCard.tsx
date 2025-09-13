import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, BarChart3, Target, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TradingStats {
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
  successRate: number;
  totalProfit: number;
  avgTradeDuration: string;
}

interface TradesCardProps {
  stats: TradingStats;
  loading?: boolean;
}

export function TradesCard({ stats, loading = false }: TradesCardProps) {

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
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
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <Skeleton className="h-9 w-16" />
              <p className="text-sm text-muted-foreground">Gesamt Trades</p>
            </div>
            <div className="space-y-1">
              <Skeleton className="h-9 w-16" />
              <p className="text-sm text-muted-foreground">Erfolgsrate</p>
            </div>
          </div>
          <div className="pt-4 border-t border-border">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <Skeleton className="h-8 w-24" />
                <p className="text-sm text-muted-foreground">Gesamtprofit (Reingewinn)</p>
              </div>
              <div className="space-y-1">
                <Skeleton className="h-8 w-20" />
                <p className="text-sm text-muted-foreground">Durchschnittliche Trade-Dauer</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
        {stats.totalTrades === 0 ? (
          <div className="text-center py-8">
            <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold text-foreground mb-2">Noch keine Trades</p>
            <p className="text-sm text-muted-foreground">
              Starten Sie Ihren ersten Trading-Bot, um Statistiken zu sehen.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-3xl font-bold text-foreground">{stats.totalTrades}</p>
                <p className="text-sm text-muted-foreground">Gesamt Trades</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-3xl font-bold" style={{ color: 'hsl(var(--brand-accent, var(--primary)))' }}>
                  {stats.successRate}%
                </p>
                <p className="text-sm text-muted-foreground">Erfolgsrate</p>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {stats.totalProfit >= 0 ? '+' : ''}{formatCurrency(stats.totalProfit)}
                  </p>
                  <p className="text-sm text-muted-foreground">Gesamtprofit (Reingewinn)</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-foreground">
                    {stats.avgTradeDuration}
                  </p>
                  <p className="text-sm text-muted-foreground">Durchschnittliche Trade-Dauer</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Target className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">{stats.successfulTrades}</p>
                  <p className="text-xs text-muted-foreground">Erfolgreich</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Target className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">{stats.failedTrades}</p>
                  <p className="text-xs text-muted-foreground">Fehlgeschlagen</p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}