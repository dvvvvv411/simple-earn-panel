import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { User, TrendingUp, Target, Award, Crown, Gem } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { RankingOverviewDialog } from "./RankingOverviewDialog";
import { useTradingBots } from "@/hooks/useTradingBots";

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

interface RankingSystemCardProps {
  className?: string;
}

export function RankingSystemCard({ className }: RankingSystemCardProps) {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { bots, loading: botsLoading } = useTradingBots();

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

  // Calculate invested amount from active bots
  const investedAmount = bots
    .filter(bot => bot.status === 'active')
    .reduce((sum, bot) => sum + (bot.start_amount || 0), 0);

  // Calculate total wealth (available balance + invested amount)
  const totalWealth = balance + investedAmount;

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading || botsLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div>
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  const currentRank = getCurrentRank();
  const nextRank = getNextRank();
  const CurrentIcon = currentRank.icon;
  
  // Calculate progress to next rank
  const progressPercentage = nextRank 
    ? ((totalWealth - currentRank.minBalance) / (nextRank.minBalance - currentRank.minBalance)) * 100
    : 100;

  const amountToNextRank = nextRank ? nextRank.minBalance - totalWealth : 0;

  return (
    <Card className={`${className} border-primary/20`}>
      <CardHeader className="p-6 lg:p-8 xl:p-10">
        <CardTitle className="text-lg lg:text-xl xl:text-2xl font-semibold text-text-headline">
          Rang-System
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 lg:space-y-8 xl:space-y-10 p-6 lg:p-8 xl:p-10 pt-0">
        {/* Current Rank */}
        <div className="flex items-center gap-4 lg:gap-6 xl:gap-8">
          <div className={`p-3 lg:p-4 xl:p-5 rounded-full bg-gradient-to-br ${currentRank.color}`}>
            <CurrentIcon className="h-6 w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 lg:gap-3 mb-1 lg:mb-2">
              <Badge className={`${currentRank.bgColor} ${currentRank.textColor} hover:${currentRank.bgColor} text-sm lg:text-base xl:text-lg px-2 lg:px-3 xl:px-4 py-1 lg:py-1.5 xl:py-2`}>
                {currentRank.name}
              </Badge>
            </div>
            <p className="text-sm lg:text-base xl:text-lg text-muted-foreground leading-relaxed">
              {currentRank.dailyTrades} Trade{currentRank.dailyTrades !== 1 ? 's' : ''} pro Tag verfügbar
            </p>
            <p className="text-xs lg:text-sm xl:text-base text-muted-foreground mt-1 lg:mt-2 leading-relaxed">
              Gesamtvermögen: {formatCurrency(balance)} + {formatCurrency(investedAmount)} = {formatCurrency(totalWealth)}
            </p>
          </div>
        </div>

        {/* Progress to Next Rank */}
        {nextRank && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Fortschritt zu {nextRank.name}</span>
              <span className="text-sm text-muted-foreground">
                {Math.min(progressPercentage, 100).toFixed(0)}%
              </span>
            </div>
            <Progress 
              value={Math.min(progressPercentage, 100)} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              Noch {formatCurrency(amountToNextRank)} bis zum nächsten Rang
            </p>
          </div>
        )}

        {/* Compact Next Rank Info */}
        {nextRank && (
          <div className="bg-secondary/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-headline">Nächster Rang</span>
              <span className="text-xs text-muted-foreground">
                {Math.min(progressPercentage, 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <nextRank.icon className="h-4 w-4 text-primary" />
              <span className="font-medium text-primary">{nextRank.name}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{nextRank.dailyTrades} Trades/Tag</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Noch {formatCurrency(amountToNextRank)}
            </p>
          </div>
        )}

        {/* Show All Ranks Button */}
        <Button 
          onClick={() => setDialogOpen(true)}
          className="w-full mt-4 lg:mt-6 xl:mt-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg h-10 lg:h-12 xl:h-14 text-sm lg:text-base xl:text-lg"
        >
          Alle Ränge anzeigen
        </Button>
      </CardContent>

      <RankingOverviewDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        currentBalance={totalWealth}
      />
    </Card>
  );
}