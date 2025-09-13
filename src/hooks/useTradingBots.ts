import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TradingBot {
  id: string;
  cryptocurrency: string;
  symbol: string;
  start_amount: number;
  current_balance: number;
  status: 'active' | 'paused' | 'stopped';
  created_at: string;
  updated_at: string;
}

export function useTradingBots() {
  const [bots, setBots] = useState<TradingBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBots = async () => {
    try {
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setBots([]);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('trading_bots')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching trading bots:', fetchError);
        setError('Fehler beim Laden der Trading-Bots');
        setBots([]);
      } else {
        setBots((data || []) as TradingBot[]);
      }
    } catch (err) {
      console.error('Unexpected error fetching bots:', err);
      setError('Ein unerwarteter Fehler ist aufgetreten');
      setBots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBots();

    // Set up realtime subscription for bot updates
    const channel = supabase
      .channel('trading-bots-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trading_bots'
        },
        () => {
          fetchBots();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { 
    bots, 
    loading, 
    error, 
    refetch: fetchBots 
  };
}