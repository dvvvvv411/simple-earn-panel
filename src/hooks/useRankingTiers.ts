import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Rocket, TrendingUp, Target, Award, Crown, Gem } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface RankingTier {
  id: string;
  name: string;
  minBalance: number;
  maxBalance: number;
  dailyTrades: number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  textColor: string;
}

// Icon mapping for database icon names
const iconMap: Record<string, LucideIcon> = {
  UserPlus,
  Rocket,
  TrendingUp,
  Target,
  Award,
  Crown,
  Gem
};

// Color mappings for different ranks
const colorMap: Record<string, { color: string; bgColor: string; textColor: string }> = {
  New: {
    color: "from-slate-400 to-slate-500",
    bgColor: "bg-slate-100",
    textColor: "text-slate-700"
  },
  Starter: {
    color: "from-amber-500 to-amber-600",
    bgColor: "bg-amber-100",
    textColor: "text-amber-700"
  },
  Trader: {
    color: "from-gray-400 to-gray-500",
    bgColor: "bg-gray-100",
    textColor: "text-gray-700"
  },
  "Pro-Trader": {
    color: "from-yellow-400 to-yellow-500",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-700"
  },
  Expert: {
    color: "from-blue-400 to-blue-500",
    bgColor: "bg-blue-100",
    textColor: "text-blue-700"
  },
  Elite: {
    color: "from-purple-400 to-purple-500",
    bgColor: "bg-purple-100",
    textColor: "text-purple-700"
  },
  VIP: {
    color: "from-emerald-400 to-emerald-500",
    bgColor: "bg-emerald-100",
    textColor: "text-emerald-700"
  }
};

export function useRankingTiers() {
  const [tiers, setTiers] = useState<RankingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRankingTiers();
  }, []);

  const loadRankingTiers = async () => {
    try {
      // Use supabase directly with any cast to avoid TypeScript issues
      const { data: rawData, error: err } = await (supabase as any)
        .from('ranking_tiers')
        .select('id, name, min_balance, max_balance, daily_trades, icon_name, sort_order')
        .order('sort_order', { ascending: true });

      if (err) throw err;
      
      if (rawData) {
        const formattedTiers: RankingTier[] = rawData.map((tier: any) => ({
          id: tier.id,
          name: tier.name,
          minBalance: Number(tier.min_balance),
          maxBalance: Number(tier.max_balance),
          dailyTrades: tier.daily_trades,
          icon: iconMap[tier.icon_name] || UserPlus,
          color: colorMap[tier.name]?.color || "from-slate-400 to-slate-500",
          bgColor: colorMap[tier.name]?.bgColor || "bg-slate-100",
          textColor: colorMap[tier.name]?.textColor || "text-slate-700"
        }));

        setTiers(formattedTiers);
      }
    } catch (err) {
      console.error('Error loading ranking tiers:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return { tiers, loading, error, refetch: loadRankingTiers };
}