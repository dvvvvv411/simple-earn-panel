import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Wallet, Trophy, Plus, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { CreateBotDialog } from "./CreateBotDialog";

interface AccountBalanceCardProps {
  balance: number;
  onBalanceUpdate: () => void;
}

export function AccountBalanceCard({ balance: propBalance, onBalanceUpdate }: AccountBalanceCardProps) {
  const [balance, setBalance] = useState<number | null>(propBalance);
  const [loading, setLoading] = useState(true);

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

  // Placeholder trend data
  const trendPercentage = 2.3;
  const isPositive = trendPercentage > 0;

  // Placeholder rank data - will be replaced with real ranking system later
  const rankData = {
    currentRank: "Gold Tier",
    position: 247,
    totalUsers: 1847,
    nextRank: "Platinum",
    currentXP: 8450,
    nextRankXP: 10000,
    tradesNeeded: 15
  };

  const progressPercentage = (rankData.currentXP / rankData.nextRankXP) * 100;

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
              <span className="text-lg font-semibold text-foreground">{rankData.currentRank}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              {isPositive ? (
                <>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="font-semibold text-green-500">
                    +{trendPercentage}%
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="font-semibold text-red-500">
                    {trendPercentage}%
                  </span>
                </>
              )}
            </div>
            <span className="text-muted-foreground">heute</span>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Fortschritt zu {rankData.nextRank}</span>
            <span className="font-medium text-foreground">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{rankData.currentXP.toLocaleString('de-DE')} XP</span>
            <span>{rankData.nextRankXP.toLocaleString('de-DE')} XP benötigt</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border">
          <Button 
            size="default" 
            onClick={() => console.log('Geld einzahlen')}
            className="flex-1 h-12"
          >
            <Plus className="h-4 w-4 mr-2" />
            Geld einzahlen
          </Button>
          <Button 
            variant="outline" 
            size="default" 
            onClick={() => console.log('Geld auszahlen')}
            className="flex-1 h-12"
          >
            <Minus className="h-4 w-4 mr-2" />
            Geld auszahlen
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}