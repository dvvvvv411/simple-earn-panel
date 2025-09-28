import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ReferralData {
  code: string;
  totalReferrals: number;
  bonusEarned: number;
}

export function useReferralData() {
  const [data, setData] = useState<ReferralData>({
    code: "",
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
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Nicht angemeldet');
        return;
      }

      // Get user's referral code
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error loading profile:', profileError);
        setError('Fehler beim Laden der Profildaten');
        return;
      }

      // If no referral code exists, generate one
      if (!profile?.referral_code) {
        console.log('No referral code found, generating one...');
        
        // Generate a new referral code
        const { data: newCode, error: codeError } = await supabase.rpc('generate_referral_code');
        
        if (codeError) {
          console.error('Error generating referral code:', codeError);
          setError('Fehler beim Generieren des Referral-Codes');
          return;
        }
        
        // Update the profile with the new code
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ referral_code: newCode })
          .eq('id', session.user.id);
        
        if (updateError) {
          console.error('Error updating referral code:', updateError);
          setError('Fehler beim Speichern des Referral-Codes');
          return;
        }
        
        // Use the new code
        profile.referral_code = newCode;
      }

      // Get referral statistics
      const { data: referrals, error: referralsError } = await supabase
        .from('user_referrals')
        .select('*')
        .eq('referrer_id', session.user.id);

      if (referralsError) {
        console.error('Error loading referrals:', referralsError);
        // If table doesn't exist yet, just use mock data
        setData({
          code: profile.referral_code,
          totalReferrals: 0,
          bonusEarned: 0,
        });
        return;
      }

      // Get total bonus earned from rewards
      const { data: rewards, error: rewardsError } = await supabase
        .from('referral_rewards')
        .select('reward_amount')
        .eq('referrer_id', session.user.id);

      const totalBonus = rewards?.reduce((sum, reward) => sum + Number(reward.reward_amount), 0) || 0;

      setData({
        code: profile.referral_code,
        totalReferrals: referrals?.length || 0,
        bonusEarned: totalBonus,
      });

    } catch (err) {
      console.error('Error in loadReferralData:', err);
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return {
    data,
    loading,
    error,
    formatCurrency,
    refetch: loadReferralData,
  };
}