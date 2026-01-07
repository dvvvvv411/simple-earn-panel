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

      // Get user profile with current ranking
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('current_ranking_id')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setError("Profil konnte nicht geladen werden");
        return;
      }

      // Get ranking tier details
      let limit = 0;
      let name: string | null = null;

      if (profile?.current_ranking_id) {
        const { data: tier, error: tierError } = await supabase
          .from('ranking_tiers')
          .select('daily_trades, name')
          .eq('id', profile.current_ranking_id)
          .single();

        if (!tierError && tier) {
          limit = tier.daily_trades;
          name = tier.name;
        }
      } else {
        // If no ranking, get the lowest tier (New) as default
        const { data: defaultTier } = await supabase
          .from('ranking_tiers')
          .select('daily_trades, name')
          .order('min_balance', { ascending: true })
          .limit(1)
          .single();

        if (defaultTier) {
          limit = defaultTier.daily_trades;
          name = defaultTier.name;
        }
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
