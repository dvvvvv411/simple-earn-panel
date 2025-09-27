import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTradingBots } from "./useTradingBots";
import { useRankingTiers, type RankingTier } from "./useRankingTiers";

export function useUserRanking() {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { bots, loading: botsLoading } = useTradingBots();
  const { tiers, loading: tiersLoading } = useRankingTiers();

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
    } catch (err) {
      console.error('Error loading balance:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
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

  const getCurrentRank = (): RankingTier | null => {
    return tiers.find(tier => 
      totalWealth >= tier.minBalance && totalWealth <= tier.maxBalance
    ) || tiers[0] || null;
  };

  const getNextRank = (): RankingTier | null => {
    const currentRank = getCurrentRank();
    if (!currentRank) return null;
    
    const currentIndex = tiers.findIndex(tier => tier.name === currentRank.name);
    return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
  };

  const isRankAchieved = (rank: RankingTier): boolean => {
    return totalWealth >= rank.minBalance;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return {
    balance,
    investedAmount,
    totalWealth,
    tiers,
    loading: loading || botsLoading || tiersLoading,
    error,
    getCurrentRank,
    getNextRank,
    isRankAchieved,
    formatCurrency,
    refetch: loadBalance
  };
}