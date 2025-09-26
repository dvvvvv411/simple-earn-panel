import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Minus, TrendingUp, TrendingDown, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTradingBots } from "@/hooks/useTradingBots";
import { Skeleton } from "@/components/ui/skeleton";

interface AccountBalanceCardProps {
  className?: string;
}

export function AccountBalanceCard({ className }: AccountBalanceCardProps) {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const { bots } = useTradingBots();

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setBalance(profile.balance);
      }
    } catch (error) {
      console.error('Error loading balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Calculate invested amount from active bots
  const investedAmount = bots
    .filter(bot => bot.status === 'active')
    .reduce((sum, bot) => sum + bot.start_amount, 0);

  const availableBalance = balance - investedAmount;
  
  // Mock today's P&L (in real app, calculate from bot trades)
  const todayPnL = 45.67;
  const todayPnLPercentage = balance > 0 ? (todayPnL / balance) * 100 : 0;

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} bg-gradient-to-br from-primary/5 to-transparent border-primary/20`}>
      <CardHeader className="p-6 lg:p-8 xl:p-10">
        <CardTitle className="text-lg lg:text-xl xl:text-2xl font-semibold text-text-headline">
          Kontostand
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 lg:space-y-8 xl:space-y-10 p-6 lg:p-8 xl:p-10 pt-0">
        {/* Main Balance */}
        <div className="text-center">
          <div className="text-4xl lg:text-5xl xl:text-6xl font-bold text-text-headline mb-2 lg:mb-4">
            {formatBalance(balance)}
          </div>
          <div className="flex items-center justify-center gap-2 lg:gap-3">
            {todayPnL >= 0 ? (
              <TrendingUp className="h-4 w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6 text-destructive" />
            )}
            <span className={`text-sm lg:text-base xl:text-lg font-medium leading-relaxed ${
              todayPnL >= 0 ? 'text-green-500' : 'text-destructive'
            }`}>
              {todayPnL >= 0 ? '+' : ''}{formatBalance(todayPnL)} ({todayPnLPercentage.toFixed(2)}%) heute
            </span>
          </div>
        </div>

        {/* Balance Breakdown */}
        <div className="grid grid-cols-2 gap-4 lg:gap-6 xl:gap-8">
          <div className="text-center p-3 lg:p-4 xl:p-6 rounded-lg bg-secondary/50">
            <div className="text-xs lg:text-sm xl:text-base text-muted-foreground mb-1 lg:mb-2">Verfügbar</div>
            <div className="text-lg lg:text-xl xl:text-2xl font-semibold text-foreground">
              {formatBalance(availableBalance)}
            </div>
          </div>
          <div className="text-center p-3 lg:p-4 xl:p-6 rounded-lg bg-primary/10">
            <div className="text-xs lg:text-sm xl:text-base text-muted-foreground mb-1 lg:mb-2 flex items-center justify-center gap-1 lg:gap-2">
              <Bot className="h-3 w-3 lg:h-4 lg:w-4 xl:h-5 xl:w-5" />
              Investiert
            </div>
            <div className="text-lg lg:text-xl xl:text-2xl font-semibold text-primary">
              {formatBalance(investedAmount)}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 lg:gap-4 xl:gap-6">
          <Button className="flex-1 bg-primary hover:bg-primary/90 h-10 lg:h-12 xl:h-14 text-sm lg:text-base xl:text-lg">
            <Plus className="h-4 w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6 mr-2" />
            Einzahlen
          </Button>
          <Button variant="outline" className="flex-1 h-10 lg:h-12 xl:h-14 text-sm lg:text-base xl:text-lg">
            <Minus className="h-4 w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6 mr-2" />
            Auszahlen
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="flex justify-between text-xs lg:text-sm xl:text-base text-muted-foreground pt-2 lg:pt-4 border-t">
          <span>Aktive Bots: {bots.filter(bot => bot.status === 'active').length}</span>
          <span>Investitionen: {investedAmount > 0 ? bots.filter(bot => bot.status === 'active').length : 0}</span>
        </div>
      </CardContent>
    </Card>
  );
}