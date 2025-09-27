import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRankingTiers, type RankingTier } from "./useRankingTiers";

export function useUserRanking() {
  const [userRanking, setUserRanking] = useState<RankingTier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tiers } = useRankingTiers();

  useEffect(() => {
    async function fetchUserRanking() {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) {
          setLoading(false);
          return;
        }

        // Get user profile with ranking
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select(`
            *,
            ranking_tiers:current_ranking_id (*)
          `)
          .eq("id", user.user.id)
          .single();

        if (profileError) throw profileError;

        // If user has no ranking, calculate it based on total wealth
        if (!profile.ranking_tiers && tiers.length > 0) {
          // Get user's bot investments
          const { data: bots } = await supabase
            .from("trading_bots")
            .select("start_amount")
            .eq("user_id", user.user.id)
            .eq("status", "active");

          const totalInvestments = bots?.reduce((sum, bot) => sum + (bot.start_amount || 0), 0) || 0;
          const totalWealth = (profile.balance || 0) + totalInvestments;

          // Find appropriate tier
          const appropriateTier = tiers.find(tier => 
            totalWealth >= tier.min_balance && totalWealth <= tier.max_balance
          );

          if (appropriateTier) {
            // Update user's ranking in database
            await supabase
              .from("profiles")
              .update({ current_ranking_id: appropriateTier.id })
              .eq("id", user.user.id);

            setUserRanking(appropriateTier);
          }
        } else if (profile.ranking_tiers) {
          setUserRanking(profile.ranking_tiers as RankingTier);
        }
      } catch (err) {
        console.error("Error fetching user ranking:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch user ranking");
      } finally {
        setLoading(false);
      }
    }

    if (tiers.length > 0) {
      fetchUserRanking();
    }
  }, [tiers]);

  return { userRanking, loading, error };
}