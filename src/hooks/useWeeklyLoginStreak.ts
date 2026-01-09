import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StreakDay {
  dayNumber: number;
  date: string | null;
  dayName: string;
  isLoggedIn: boolean;
  isToday: boolean;
  isFuture?: boolean;
  grantsFreeBot: boolean;
  loginDayNumber: number;
}

export interface WeeklyLoginData {
  currentStreak: number;
  streakDays: StreakDay[];
  currentDayInCycle: number;
  newFreeBotEarned: boolean;
  isNewLogin: boolean;
  loading: boolean;
  error: string | null;
  shouldShowAnimation: boolean;
}

const SESSION_STORAGE_KEY = 'streak-animation-shown';

export function useWeeklyLoginStreak() {
  const [data, setData] = useState<Omit<WeeklyLoginData, 'shouldShowAnimation'>>({
    currentStreak: 0,
    streakDays: [],
    currentDayInCycle: 0,
    newFreeBotEarned: false,
    isNewLogin: false,
    loading: true,
    error: null,
  });
  
  const [shouldShowAnimation, setShouldShowAnimation] = useState(false);

  const trackAndFetchStreak = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      // First track the login
      const { data: trackResult, error: trackError } = await supabase.functions.invoke('track-login');
      
      if (trackError) {
        console.error('Error tracking login:', trackError);
      }

      // Then fetch the streak data
      const { data: streakData, error: streakError } = await supabase.functions.invoke('get-login-streak');

      if (streakError) throw streakError;

      if (streakData) {
        const isNewLogin = trackResult?.isNewLogin ?? false;
        const newFreeBotEarned = trackResult?.newFreeBotEarned ?? streakData.newFreeBotEarned ?? false;
        
        setData({
          currentStreak: streakData.currentStreak || 0,
          streakDays: streakData.streakDays || [],
          currentDayInCycle: streakData.currentDayInCycle || 0,
          newFreeBotEarned,
          isNewLogin,
          loading: false,
          error: null,
        });

        // Check if we should show animation (only once per session)
        const hasShownAnimation = sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true';
        
        if (!hasShownAnimation && streakData.currentStreak > 0) {
          setShouldShowAnimation(true);
        }
      }
    } catch (err) {
      console.error('Error fetching streak data:', err);
      setData(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch streak data',
      }));
    }
  }, []);

  useEffect(() => {
    trackAndFetchStreak();
  }, [trackAndFetchStreak]);

  const markAnimationShown = useCallback(() => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
    setShouldShowAnimation(false);
  }, []);

  return {
    ...data,
    shouldShowAnimation,
    markAnimationShown,
    refetch: trackAndFetchStreak,
  };
}
