import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LoginStats {
  currentStreak: number;
  weeklyGoal: number;
  weekStart: string;
  weekEnd: string;
}

export function useLoginStats() {
  const [loginStats, setLoginStats] = useState<LoginStats>({
    currentStreak: 0,
    weeklyGoal: 7,
    weekStart: '',
    weekEnd: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLoginStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase.functions.invoke('get-weekly-login-stats');

        if (error) throw error;

        if (data) {
          setLoginStats(data);
        }
      } catch (err) {
        console.error('Error fetching login stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch login stats');
      } finally {
        setLoading(false);
      }
    };

    fetchLoginStats();
  }, []);

  const trackLogin = async () => {
    try {
      const { error } = await supabase.functions.invoke('track-login');
      if (error) throw error;
      
      // Refresh stats after tracking login
      const { data } = await supabase.functions.invoke('get-weekly-login-stats');
      if (data) {
        setLoginStats(data);
      }
    } catch (err) {
      console.error('Error tracking login:', err);
    }
  };

  return {
    loginStats,
    loading,
    error,
    trackLogin
  };
}