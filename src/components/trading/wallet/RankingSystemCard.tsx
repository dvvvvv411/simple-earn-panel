import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { RankingOverviewDialog } from "./RankingOverviewDialog";
import { useRankingTiers, type RankingTier } from "@/hooks/useRankingTiers";
import { useUserRanking } from "@/hooks/useUserRanking";
import * as Icons from "lucide-react";

const getIconComponent = (iconName: string) => {
  const IconComponent = (Icons as any)[iconName];
  return IconComponent || Icons.User;
};

interface RankingSystemCardProps {
  className?: string;
}

export function RankingSystemCard({ className }: RankingSystemCardProps) {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [totalWealth, setTotalWealth] = useState<number>(0);
  const { tiers } = useRankingTiers();
  const { userRanking } = useUserRanking();

  const loadBalance = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("balance")
        .eq("id", user.user.id)
        .single();

      if (profile) {
        setBalance(profile.balance || 0);
        
        // Calculate invested amount from active trading bots
        const { data: bots } = await supabase
          .from("trading_bots")
          .select("start_amount")
          .eq("user_id", user.user.id)
          .eq("status", "active");

        const investedAmount = bots?.reduce((sum, bot) => sum + (bot.start_amount || 0), 0) || 0;
        const totalWealth = (profile.balance || 0) + investedAmount;
        setTotalWealth(totalWealth);
      }
    } catch (error) {
      console.error("Error loading balance:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBalance();
  }, []);

  const getCurrentRank = (wealth: number): RankingTier | null => {
    return tiers.find(tier => 
      wealth >= tier.min_balance && wealth <= tier.max_balance
    ) || tiers[0] || null;
  };

  const getNextRank = (wealth: number): RankingTier | null => {
    return tiers.find(tier => tier.min_balance > wealth) || null;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading || !tiers.length) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="text-lg">
            <Skeleton className="h-6 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-2 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  const currentRank = userRanking || getCurrentRank(totalWealth);
  const nextRank = getNextRank(totalWealth);
  
  if (!currentRank) return null;

  const CurrentIcon = getIconComponent(currentRank.icon_name);

  let progressPercentage = 0;
  if (nextRank) {
    const currentProgress = totalWealth - currentRank.min_balance;
    const totalNeeded = nextRank.min_balance - currentRank.min_balance;
    progressPercentage = Math.min((currentProgress / totalNeeded) * 100, 100);
  } else {
    progressPercentage = 100; // Max rank achieved
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-text-headline">
          Rang-System
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <div 
            className="flex items-center justify-center w-12 h-12 rounded-full"
            style={{
              background: `linear-gradient(135deg, ${currentRank.gradient_from}, ${currentRank.gradient_to})`
            }}
          >
            <CurrentIcon className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={cn("text-xl font-bold", currentRank.text_color)}>
                {currentRank.name}
              </h3>
              <Badge variant="secondary" className={cn("text-xs", currentRank.border_color)}>
                {currentRank.daily_trades} Trades/Tag
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(currentRank.min_balance)} - {
                currentRank.max_balance >= 99999999 
                  ? "∞" 
                  : formatCurrency(currentRank.max_balance)
              }
            </p>
          </div>
        </div>

        {nextRank && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Fortschritt zu {nextRank.name}
              </span>
              <span className="font-medium">
                {formatCurrency(totalWealth)} / {formatCurrency(nextRank.min_balance)}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              Noch {formatCurrency(nextRank.min_balance - totalWealth)} bis zum nächsten Rang
            </p>
          </div>
        )}

        {!nextRank && (
          <div className="text-center py-4">
            <p className="text-sm font-medium text-primary">
              🎉 Höchster Rang erreicht!
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Sie haben den VIP-Rang erreicht
            </p>
          </div>
        )}

        <Button 
          variant="outline" 
          onClick={() => setShowDialog(true)}
          className="w-full"
        >
          Alle Ränge anzeigen
        </Button>
      </CardContent>

      <RankingOverviewDialog 
        open={showDialog}
        onOpenChange={setShowDialog}
        currentBalance={totalWealth}
        tiers={tiers}
      />
    </Card>
  );
}