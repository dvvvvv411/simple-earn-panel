import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Wallet, Trophy, Plus, Minus, Bot } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { DepositDialog } from "./wallet/DepositDialog";
import { WithdrawalDialog } from "./wallet/WithdrawalDialog";
import { useRankingTiers } from "@/hooks/useRankingTiers";

interface TradingStats {
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
  successRate: number;
  totalProfit: number;
  avgTradeDuration: string;
}

interface TradingBot {
  id: string;
  status: string;
  start_amount: number;
}

interface AccountBalanceCardProps {
  balance: number;
  onBalanceUpdate: () => void;
  todayStats: TradingStats;
  todayStartBalance: number;
  bots: TradingBot[];
  loading?: boolean;
}

export function AccountBalanceCard({ balance, onBalanceUpdate, todayStats, todayStartBalance, bots, loading = false }: AccountBalanceCardProps) {
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);
  const { tiers, loading: tiersLoading } = useRankingTiers();

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate total bot investments from active bots
  const botInvestments = bots
    .filter(bot => bot.status === 'active')
    .reduce((total, bot) => total + Number(bot.start_amount), 0);

  // Calculate real daily trend percentage based on today's start balance
  const trendPercentage = todayStartBalance > 0 ? (todayStats.totalProfit / todayStartBalance) * 100 : 0;
  const isPositive = trendPercentage > 0;

  const totalWealth = balance + botInvestments;

  // Ranking system functions using database tiers
  const getCurrentRank = () => {
    return tiers.find(tier => 
      totalWealth >= tier.minBalance && totalWealth <= tier.maxBalance
    ) || tiers[0] || null;
  };

  const getNextRank = () => {
    const currentRank = getCurrentRank();
    if (!currentRank) return null;
    const currentIndex = tiers.findIndex(tier => tier.name === currentRank.name);
    return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
  };

  const currentRank = getCurrentRank();
  const nextRank = getNextRank();
  
  // Calculate progress to next rank (absolute progress towards next rank minimum)
  const progressPercentage = nextRank 
    ? (totalWealth / nextRank.minBalance) * 100
    : 100;

  const handleDepositCreated = () => {
    onBalanceUpdate();
  };

  const handleWithdrawalCreated = () => {
    onBalanceUpdate();
  };

  if (loading || tiersLoading || !currentRank) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            Kontostand
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-40 mb-4" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-3 w-full mt-6" />
          <Skeleton className="h-4 w-32 mt-2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            Kontostand
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-4xl font-bold text-foreground">
                {formatBalance(balance)}
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                <span className="text-lg font-semibold text-foreground">{currentRank.name}</span>
              </div>
            </div>
            {botInvestments > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Bot className="h-4 w-4" />
                <span>{formatBalance(botInvestments)} in Bots aktiv</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1">
                {isPositive ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                     <span className="font-semibold text-green-500">
                       +{trendPercentage.toFixed(1)}%
                     </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-red-500" />
                     <span className="font-semibold text-red-500">
                       {trendPercentage.toFixed(1)}%
                     </span>
                  </>
                )}
              </div>
              <span className="text-muted-foreground">heute</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {nextRank ? `Fortschritt zu ${nextRank.name}` : 'Höchster Rang erreicht!'}
              </span>
              <span className="font-medium text-foreground">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{totalWealth.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</span>
              <span>
                {nextRank 
                  ? `${nextRank.minBalance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })} benötigt`
                  : 'Maximum erreicht'
                }
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border">
            <Button 
              size="default" 
              onClick={() => setDepositDialogOpen(true)}
              className="flex-1 h-12"
            >
              <Plus className="h-4 w-4 mr-2" />
              Geld einzahlen
            </Button>
            <Button 
              variant="outline" 
              size="default" 
              onClick={() => setWithdrawalDialogOpen(true)}
              className="flex-1 h-12"
            >
              <Minus className="h-4 w-4 mr-2" />
              Geld auszahlen
            </Button>
          </div>

        </CardContent>
      </Card>

      <DepositDialog
        userBalance={balance}
        open={depositDialogOpen}
        onOpenChange={setDepositDialogOpen}
        onDepositCreated={handleDepositCreated}
      />

      <WithdrawalDialog
        userBalance={balance}
        open={withdrawalDialogOpen}
        onOpenChange={setWithdrawalDialogOpen}
        onWithdrawalCreated={handleWithdrawalCreated}
      />
    </>
  );
}
