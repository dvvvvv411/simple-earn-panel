import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const INACTIVITY_TIMEOUT = 3 * 60 * 1000; // 3 minutes
const HEARTBEAT_INTERVAL = 60 * 1000; // 60 seconds
const ACTIVITY_DEBOUNCE = 1000; // 1 second

export const useActivityTracker = () => {
  const sessionId = useRef<string | null>(null);
  const lastActivity = useRef<number>(Date.now());
  const tabHiddenAt = useRef<number | null>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimeout = useRef<NodeJS.Timeout | null>(null);
  const isSessionActive = useRef<boolean>(false);
  const userId = useRef<string | null>(null);

  // Debounce helper
  const debounce = <T extends (...args: unknown[]) => void>(fn: T, ms: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), ms);
    };
  };

  // Start a new session
  const startSession = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      userId.current = user.id;
      
      const { data, error } = await supabase
        .from('user_activity_sessions')
        .insert({
          user_id: user.id,
          started_at: new Date().toISOString(),
          last_active_at: new Date().toISOString(),
          is_active: true,
          user_agent: navigator.userAgent,
        })
        .select('id')
        .single();

      if (error) throw error;

      sessionId.current = data.id;
      isSessionActive.current = true;
      lastActivity.current = Date.now();
    } catch (error) {
      // Silent fail - don't spam console
    }
  }, []);

  // Update session heartbeat
  const updateSession = useCallback(async () => {
    if (!sessionId.current || !isSessionActive.current) return;

    try {
      const now = new Date();
      const { data: session } = await supabase
        .from('user_activity_sessions')
        .select('started_at')
        .eq('id', sessionId.current)
        .single();

      if (!session) return;

      const startedAt = new Date(session.started_at);
      const durationSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);

      await supabase
        .from('user_activity_sessions')
        .update({
          last_active_at: now.toISOString(),
          duration_seconds: durationSeconds,
        })
        .eq('id', sessionId.current);
    } catch (error) {
      // Silent fail
    }
  }, []);

  // End the current session
  const endSession = useCallback(async () => {
    if (!sessionId.current) return;

    try {
      const now = new Date();
      const { data: session } = await supabase
        .from('user_activity_sessions')
        .select('started_at')
        .eq('id', sessionId.current)
        .single();

      if (session) {
        const startedAt = new Date(session.started_at);
        const durationSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);

        await supabase
          .from('user_activity_sessions')
          .update({
            ended_at: now.toISOString(),
            is_active: false,
            duration_seconds: durationSeconds,
          })
          .eq('id', sessionId.current);
      }
    } catch (error) {
      // Silent fail
    } finally {
      sessionId.current = null;
      isSessionActive.current = false;
    }
  }, []);

  // Handle activity events
  const handleActivity = useCallback(() => {
    lastActivity.current = Date.now();

    // Reset inactivity timeout
    if (inactivityTimeout.current) {
      clearTimeout(inactivityTimeout.current);
    }

    // If session was ended due to inactivity, start a new one
    if (!isSessionActive.current && userId.current) {
      startSession();
    }

    // Set new inactivity timeout
    inactivityTimeout.current = setTimeout(async () => {
      if (isSessionActive.current) {
        await endSession();
      }
    }, INACTIVITY_TIMEOUT);
  }, [startSession, endSession]);

  // Debounced activity handler
  const debouncedHandleActivity = useCallback(
    debounce(handleActivity, ACTIVITY_DEBOUNCE),
    [handleActivity]
  );

  // Handle visibility change (tab switch)
  const handleVisibilityChange = useCallback(async () => {
    if (document.hidden) {
      // Tab is now hidden - record the time
      tabHiddenAt.current = Date.now();
      
      // Stop heartbeat while hidden
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
        heartbeatInterval.current = null;
      }
    } else {
      // Tab is now visible
      const awayDuration = tabHiddenAt.current 
        ? Date.now() - tabHiddenAt.current 
        : 0;
      
      tabHiddenAt.current = null;

      if (awayDuration >= INACTIVITY_TIMEOUT) {
        // Was away too long - end current session and start new one
        await endSession();
        await startSession();
      } else {
        // Was away briefly - just update activity
        lastActivity.current = Date.now();
      }

      // Restart heartbeat
      if (!heartbeatInterval.current && isSessionActive.current) {
        heartbeatInterval.current = setInterval(async () => {
          const timeSinceActivity = Date.now() - lastActivity.current;
          if (timeSinceActivity < INACTIVITY_TIMEOUT && isSessionActive.current) {
            await updateSession();
          }
        }, HEARTBEAT_INTERVAL);
      }
    }
  }, [endSession, startSession, updateSession]);

  // Handle page unload
  const handleBeforeUnload = useCallback(() => {
    if (sessionId.current && isSessionActive.current) {
      // Use sendBeacon for reliable session end on page close
      const payload = JSON.stringify({
        ended_at: new Date().toISOString(),
        is_active: false,
      });
      
      // Try to end session synchronously as fallback
      navigator.sendBeacon?.(
        `https://fyloldkiuxtcdiazbtwn.supabase.co/rest/v1/user_activity_sessions?id=eq.${sessionId.current}`,
        payload
      );
    }
  }, []);

  // Initialize tracking
  useEffect(() => {
    // Check if user is authenticated
    const initializeTracking = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Start initial session
      await startSession();

      // Start heartbeat
      heartbeatInterval.current = setInterval(async () => {
        const timeSinceActivity = Date.now() - lastActivity.current;
        if (timeSinceActivity < INACTIVITY_TIMEOUT && isSessionActive.current && !document.hidden) {
          await updateSession();
        } else if (timeSinceActivity >= INACTIVITY_TIMEOUT && isSessionActive.current) {
          await endSession();
        }
      }, HEARTBEAT_INTERVAL);

      // Set initial inactivity timeout
      inactivityTimeout.current = setTimeout(async () => {
        if (isSessionActive.current) {
          await endSession();
        }
      }, INACTIVITY_TIMEOUT);
    };

    initializeTracking();

    // Add event listeners
    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, debouncedHandleActivity, { passive: true });
    });

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, debouncedHandleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('beforeunload', handleBeforeUnload);

      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
      if (inactivityTimeout.current) {
        clearTimeout(inactivityTimeout.current);
      }

      // End session on unmount
      if (sessionId.current && isSessionActive.current) {
        endSession();
      }
    };
  }, [startSession, updateSession, endSession, debouncedHandleActivity, handleVisibilityChange, handleBeforeUnload]);

  return null;
};
