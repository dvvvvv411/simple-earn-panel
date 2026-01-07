import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DailyTradeLimitResult {
  dailyLimit: number;
  usedToday: number;
  canCreateBot: boolean;
  remainingTrades: number;
  rankName: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDailyTradeLimit(): DailyTradeLimitResult {
  const [dailyLimit, setDailyLimit] = useState<number>(0);
  const [usedToday, setUsedToday] = useState<number>(0);
  const [rankName, setRankName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLimitData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Nicht eingeloggt");
        return;
      }

      // Get user balance
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setError("Profil konnte nicht geladen werden");
        return;
      }

      // Get active trading bots to calculate invested amount
      const { data: activeBots, error: botsError } = await supabase
        .from('trading_bots')
        .select('start_amount')
        .eq('user_id', session.user.id)
        .eq('status', 'active');

      if (botsError) {
        console.error('Error fetching bots:', botsError);
      }

      // Calculate total wealth (balance + invested in bots)
      const balance = profile?.balance || 0;
      const investedAmount = (activeBots || []).reduce((sum, bot) => sum + (bot.start_amount || 0), 0);
      const totalWealth = balance + investedAmount;

      // Get all ranking tiers to find the matching one
      const { data: tiers, error: tiersError } = await supabase
        .from('ranking_tiers')
        .select('id, name, daily_trades, min_balance, max_balance')
        .order('min_balance', { ascending: true });

      if (tiersError) {
        console.error('Error fetching tiers:', tiersError);
        setError("Ränge konnten nicht geladen werden");
        return;
      }

      // Find the matching tier based on total wealth
      let limit = 0;
      let name: string | null = null;

      const currentTier = tiers?.find(tier => 
        totalWealth >= tier.min_balance && totalWealth <= tier.max_balance
      );

      if (currentTier) {
        limit = currentTier.daily_trades;
        name = currentTier.name;
      } else if (tiers && tiers.length > 0) {
        // Fallback to lowest tier
        limit = tiers[0].daily_trades;
        name = tiers[0].name;
      }

      setDailyLimit(limit);
      setRankName(name);

      // Count bots created today (using UTC date boundaries)
      const today = new Date();
      const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      const { count, error: countError } = await supabase
        .from('trading_bots')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .gte('created_at', startOfDay.toISOString())
        .lt('created_at', endOfDay.toISOString());

      if (countError) {
        console.error('Error counting bots:', countError);
        setError("Bots konnten nicht gezählt werden");
        return;
      }

      setUsedToday(count || 0);

    } catch (err) {
      console.error('Error in useDailyTradeLimit:', err);
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLimitData();
  }, []);

  const canCreateBot = usedToday < dailyLimit;
  const remainingTrades = Math.max(0, dailyLimit - usedToday);

  return {
    dailyLimit,
    usedToday,
    canCreateBot,
    remainingTrades,
    rankName,
    loading,
    error,
    refetch: fetchLimitData
  };
}
