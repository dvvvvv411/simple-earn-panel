import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp, Calendar, Target, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface WalletStats {
  monthlyData: Array<{
    month: string;
    deposits: number;
    withdrawals: number;
  }>;
  totalROI: number;
  avgHoldingTime: number;
  bestTradingDay: {
    date: string;
    profit: number;
  };
  investmentEfficiency: number;
}

interface WalletStatisticsCardProps {
  className?: string;
}

export function WalletStatisticsCard({ className }: WalletStatisticsCardProps) {
  const [stats, setStats] = useState<WalletStats>({
    monthlyData: [],
    totalROI: 0,
    avgHoldingTime: 0,
    bestTradingDay: { date: '', profit: 0 },
    investmentEfficiency: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWalletStatistics();
  }, []);

  const loadWalletStatistics = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Mock data for demonstration - in real app, calculate from transactions and bot trades
      const mockMonthlyData = [
        { month: 'Jan', deposits: 1200, withdrawals: 300 },
        { month: 'Feb', deposits: 800, withdrawals: 150 },
        { month: 'Mär', deposits: 2000, withdrawals: 500 },
        { month: 'Apr', deposits: 1500, withdrawals: 200 },
        { month: 'Mai', deposits: 1800, withdrawals: 400 },
        { month: 'Jun', deposits: 2200, withdrawals: 300 },
      ];

      setStats({
        monthlyData: mockMonthlyData,
        totalROI: 23.5,
        avgHoldingTime: 14.5,
        bestTradingDay: {
          date: '15. Mai 2024',
          profit: 187.50
        },
        investmentEfficiency: 85.2,
      });
    } catch (error) {
      console.error('Error loading wallet statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} border-primary/20`}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-text-headline flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Wallet-Statistiken
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Monthly Overview Chart */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-foreground">Monatsübersicht</div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.monthlyData}>
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis hide />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-lg">
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-xs text-green-600">
                            Einzahlungen: {formatCurrency(payload[0]?.value as number)}
                          </p>
                          <p className="text-xs text-red-600">
                            Auszahlungen: {formatCurrency(payload[1]?.value as number)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="deposits" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="withdrawals" 
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--destructive))', strokeWidth: 2, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <span className="text-muted-foreground">Einzahlungen</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-destructive rounded-full"></div>
              <span className="text-muted-foreground">Auszahlungen</span>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Gesamtrendite</span>
            </div>
            <div className="text-xl font-bold text-green-600">
              +{formatPercentage(stats.totalROI)}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Ø Haltezeit</span>
            </div>
            <div className="text-xl font-bold text-foreground">
              {stats.avgHoldingTime} Tage
            </div>
          </div>
        </div>

        {/* Best Trading Day */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Bester Trading-Tag</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-green-700">{stats.bestTradingDay.date}</span>
            <span className="text-lg font-bold text-green-600">
              +{formatCurrency(stats.bestTradingDay.profit)}
            </span>
          </div>
        </div>

        {/* Investment Efficiency */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-foreground">Investitions-Effizienz</span>
            <span className="text-sm font-semibold text-primary">
              {formatPercentage(stats.investmentEfficiency)}
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${stats.investmentEfficiency}%` }}
            ></div>
          </div>
          <p className="text-xs text-muted-foreground">
            Basierend auf Trading-Performance und Risikomanagement
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t text-center">
          <div>
            <div className="text-lg font-semibold text-foreground">
              {stats.monthlyData.reduce((sum, month) => sum + month.deposits, 0) / 1000}k
            </div>
            <div className="text-xs text-muted-foreground">Total Einzahlungen</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-foreground">
              {stats.monthlyData.reduce((sum, month) => sum + month.withdrawals, 0) / 1000}k
            </div>
            <div className="text-xs text-muted-foreground">Total Auszahlungen</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-primary">
              {((stats.monthlyData.reduce((sum, month) => sum + month.deposits, 0) - 
                 stats.monthlyData.reduce((sum, month) => sum + month.withdrawals, 0)) / 1000).toFixed(1)}k
            </div>
            <div className="text-xs text-muted-foreground">Netto-Einzahlungen</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}