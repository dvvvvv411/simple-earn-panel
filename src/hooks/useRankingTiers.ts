import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface RankingTier {
  id: string;
  name: string;
  min_balance: number;
  max_balance: number;
  daily_trades: number;
  icon_name: string;
  gradient_from: string;
  gradient_to: string;
  text_color: string;
  border_color: string;
  sort_order: number;
}

export function useRankingTiers() {
  const [tiers, setTiers] = useState<RankingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTiers() {
      try {
        const { data, error } = await supabase
          .from("ranking_tiers")
          .select("*")
          .order("sort_order", { ascending: true });

        if (error) throw error;
        setTiers(data || []);
      } catch (err) {
        console.error("Error fetching ranking tiers:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch ranking tiers");
      } finally {
        setLoading(false);
      }
    }

    fetchTiers();
  }, []);

  return { tiers, loading, error };
}