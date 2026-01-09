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

const LOCAL_STORAGE_KEY = 'streak-animation-shown-date';

const hasShownAnimationToday = (): boolean => {
  const storedDate = localStorage.getItem(LOCAL_STORAGE_KEY);
  const today = new Date().toISOString().split('T')[0];
  return storedDate === today;
};

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

        // Nur beim ersten Besuch des Tages automatisch anzeigen
        if (streakData.currentStreak > 0 && !hasShownAnimationToday()) {
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
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(LOCAL_STORAGE_KEY, today);
    setShouldShowAnimation(false);
  }, []);

  const openAnimationManually = useCallback(() => {
    if (data.currentStreak > 0 && data.streakDays.length > 0) {
      setShouldShowAnimation(true);
    }
  }, [data.currentStreak, data.streakDays.length]);

  return {
    ...data,
    shouldShowAnimation,
    markAnimationShown,
    openAnimationManually,
    refetch: trackAndFetchStreak,
  };
}
