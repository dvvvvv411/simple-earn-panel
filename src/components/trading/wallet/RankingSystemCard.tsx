import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { User, TrendingUp, Target, Award, Crown, Gem } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

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

  const getCurrentRank = () => {
    return rankingTiers.find(tier => 
      balance >= tier.minBalance && balance <= tier.maxBalance
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

  if (loading) {
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
    ? ((balance - currentRank.minBalance) / (nextRank.minBalance - currentRank.minBalance)) * 100
    : 100;

  const amountToNextRank = nextRank ? nextRank.minBalance - balance : 0;

  return (
    <Card className={`${className} border-primary/20`}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-text-headline">
          Rang-System
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Rank */}
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full bg-gradient-to-br ${currentRank.color}`}>
            <CurrentIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className={`${currentRank.bgColor} ${currentRank.textColor} hover:${currentRank.bgColor}`}>
                {currentRank.name}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {currentRank.dailyTrades} Trade{currentRank.dailyTrades !== 1 ? 's' : ''} pro Tag verfügbar
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

        {/* Rank Benefits Preview */}
        <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-semibold text-text-headline">Rang-Vorteile</h4>
          <div className="grid grid-cols-1 gap-2">
            {nextRank && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Nächster Rang ({nextRank.name}):</span>
                <span className="font-medium text-primary">
                  {nextRank.dailyTrades} Trades/Tag
                </span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Aktuell ({currentRank.name}):</span>
              <span className="font-medium">
                {currentRank.dailyTrades} Trade{currentRank.dailyTrades !== 1 ? 's' : ''}/Tag
              </span>
            </div>
          </div>
        </div>

        {/* All Ranks Overview */}
        <details className="group">
          <summary className="text-xs text-primary cursor-pointer hover:text-primary/80 transition-colors">
            Alle Ränge anzeigen
          </summary>
          <div className="mt-3 space-y-2">
            {rankingTiers.map((tier) => {
              const TierIcon = tier.icon;
              const isCurrentTier = tier.name === currentRank.name;
              return (
                <div 
                  key={tier.name}
                  className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                    isCurrentTier ? 'bg-primary/10 border border-primary/20' : 'hover:bg-secondary/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <TierIcon className={`h-4 w-4 ${isCurrentTier ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-xs font-medium ${isCurrentTier ? 'text-primary' : 'text-foreground'}`}>
                      {tier.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{formatCurrency(tier.minBalance)}+</span>
                    <span className="font-medium">{tier.dailyTrades} Trades</span>
                  </div>
                </div>
              );
            })}
          </div>
        </details>
      </CardContent>
    </Card>
  );
}