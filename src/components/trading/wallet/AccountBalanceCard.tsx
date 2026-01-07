import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Minus, TrendingUp, TrendingDown, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTradingBots } from "@/hooks/useTradingBots";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { DepositDialog } from "./DepositDialog";

interface AccountBalanceCardProps {
  className?: string;
}

export function AccountBalanceCard({ className }: AccountBalanceCardProps) {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const { bots } = useTradingBots();
  const isMobile = useIsMobile();

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
    <>
      <Card className={`${className} bg-gradient-to-br from-primary/5 to-transparent border-primary/20`}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-text-headline">
            Kontostand
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Balance */}
          <div className="text-center">
            <div className="text-2xl sm:text-4xl font-bold text-text-headline mb-2">
              {formatBalance(balance)}
            </div>
            <div className="flex items-center justify-center gap-2">
              {todayPnL >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
              <span className={`text-sm font-medium ${
                todayPnL >= 0 ? 'text-green-500' : 'text-destructive'
              }`}>
                {todayPnL >= 0 ? '+' : ''}{formatBalance(todayPnL)} ({todayPnLPercentage.toFixed(2)}%) heute
              </span>
            </div>
          </div>

          {/* Balance Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="text-center p-3 rounded-lg bg-secondary/50">
              <div className="text-xs text-muted-foreground mb-1">Verfügbar</div>
              <div className="text-base sm:text-lg font-semibold text-foreground">
                {formatBalance(availableBalance)}
              </div>
            </div>
            <div className="text-center p-3 rounded-lg bg-primary/10">
              <div className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                <Bot className="h-3 w-3" />
                Investiert
              </div>
              <div className="text-base sm:text-lg font-semibold text-primary">
                {formatBalance(investedAmount)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              className="flex-1 bg-primary hover:bg-primary/90" 
              size={isMobile ? "mobile" : "sm"}
              onClick={() => setDepositDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Einzahlen
            </Button>
            <Button variant="outline" className="flex-1" size={isMobile ? "mobile" : "sm"}>
              <Minus className="h-4 w-4 mr-2" />
              Auszahlen
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
            <span>Aktive Bots: {bots.filter(bot => bot.status === 'active').length}</span>
            <span>Investitionen: {investedAmount > 0 ? bots.filter(bot => bot.status === 'active').length : 0}</span>
          </div>
        </CardContent>
      </Card>

      <DepositDialog
        userBalance={balance}
        open={depositDialogOpen}
        onOpenChange={setDepositDialogOpen}
        onDepositCreated={loadBalance}
      />
    </>
  );
}
