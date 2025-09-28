import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ReferralData {
  referralCode: string;
  totalReferrals: number;
  bonusEarned: number;
}

export function useReferralData() {
  const [data, setData] = useState<ReferralData>({
    referralCode: "",
    totalReferrals: 0,
    bonusEarned: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      // Get user's referral code
      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', session.user.id)
        .single();

      if (!profile?.referral_code) {
        setLoading(false);
        return;
      }

      // Count total referrals made by this user
      const { count: totalReferrals } = await supabase
        .from('user_referrals')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', session.user.id);

      // Calculate total bonus earned from referrals
      const { data: rewards } = await supabase
        .from('referral_rewards')
        .select('reward_amount')
        .eq('referrer_id', session.user.id);

      const bonusEarned = rewards?.reduce((sum, reward) => sum + Number(reward.reward_amount), 0) || 0;

      setData({
        referralCode: profile.referral_code,
        totalReferrals: totalReferrals || 0,
        bonusEarned,
      });
    } catch (err) {
      console.error('Error loading referral data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    refetch: loadReferralData,
  };
}