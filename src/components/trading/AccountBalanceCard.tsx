import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Wallet, Trophy, Plus, Minus, Bot, User, Target, Award, Crown, Gem } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { CreateBotDialog } from "./CreateBotDialog";
import { useTradingBots } from "@/hooks/useTradingBots";
import { DepositDialog } from "./wallet/DepositDialog";
import { WithdrawalDialog } from "./wallet/WithdrawalDialog";

// Ranking tiers definition
const rankingTiers = [
  {
    name: "Starter",
    minBalance: 0,
    maxBalance: 999,
    dailyTrades: 1,
    icon: User,
    color: "from-amber-500 to-amber-600",
    bgColor: "bg-amber-100",
    textColor: "text-amber-700"
  },
  {
    name: "Trader",
    minBalance: 1000,
    maxBalance: 4999,
    dailyTrades: 2,
    icon: TrendingUp,
    color: "from-gray-400 to-gray-500",
    bgColor: "bg-gray-100",
    textColor: "text-gray-700"
  },
  {
    name: "Pro-Trader",
    minBalance: 5000,
    maxBalance: 9999,
    dailyTrades: 4,
    icon: Target,
    color: "from-yellow-400 to-yellow-500",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-700"
  },
  {
    name: "Expert",
    minBalance: 10000,
    maxBalance: 49999,
    dailyTrades: 6,
    icon: Award,
    color: "from-blue-400 to-blue-500",
    bgColor: "bg-blue-100",
    textColor: "text-blue-700"
  },
  {
    name: "Elite",
    minBalance: 50000,
    maxBalance: 99999,
    dailyTrades: 8,
    icon: Crown,
    color: "from-purple-400 to-purple-500",
    bgColor: "bg-purple-100",
    textColor: "text-purple-700"
  },
  {
    name: "VIP",
    minBalance: 100000,
    maxBalance: 999999,
    dailyTrades: 10,
    icon: Gem,
    color: "from-emerald-400 to-emerald-500",
    bgColor: "bg-emerald-100",
    textColor: "text-emerald-700"
  }
];

interface TradingStats {
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
  successRate: number;
  totalProfit: number;
  avgTradeDuration: string;
}

interface AccountBalanceCardProps {
  balance: number;
  onBalanceUpdate: () => void;
  todayStats: TradingStats;
  todayStartBalance: number;
}

export function AccountBalanceCard({ balance: propBalance, onBalanceUpdate, todayStats, todayStartBalance }: AccountBalanceCardProps) {
  const [balance, setBalance] = useState<number | null>(propBalance);
  const [loading, setLoading] = useState(true);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);
  const { bots } = useTradingBots();

  // Sync local state with prop balance immediately
  useEffect(() => {
    setBalance(propBalance);
    if (propBalance > 0) {
      setLoading(false);
    }
  }, [propBalance]);

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

  // Calculate total wealth (available balance + invested amount)
  const totalWealth = (balance || 0) + botInvestments;

  // Ranking system functions
  const getCurrentRank = () => {
    return rankingTiers.find(tier => 
      totalWealth >= tier.minBalance && totalWealth <= tier.maxBalance
    ) || rankingTiers[0];
  };

  const getNextRank = () => {
    const currentRank = getCurrentRank();
    const currentIndex = rankingTiers.findIndex(tier => tier.name === currentRank.name);
    return currentIndex < rankingTiers.length - 1 ? rankingTiers[currentIndex + 1] : null;
  };

  const currentRank = getCurrentRank();
  const nextRank = getNextRank();
  
  // Calculate progress to next rank
  const progressPercentage = nextRank 
    ? ((totalWealth - currentRank.minBalance) / (nextRank.minBalance - currentRank.minBalance)) * 100
    : 100;

  const handleDepositCreated = () => {
    loadBalance();
    onBalanceUpdate();
  };

  const handleWithdrawalCreated = () => {
    loadBalance();
    onBalanceUpdate();
  };

  if (loading) {
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
                {balance !== null ? formatBalance(balance) : '€0.00'}
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
        userBalance={balance || 0}
        open={depositDialogOpen}
        onOpenChange={setDepositDialogOpen}
        onDepositCreated={handleDepositCreated}
      />

      <WithdrawalDialog
        userBalance={balance || 0}
        open={withdrawalDialogOpen}
        onOpenChange={setWithdrawalDialogOpen}
        onWithdrawalCreated={handleWithdrawalCreated}
      />
    </>
  );
}
