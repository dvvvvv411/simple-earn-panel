import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BotTrade {
  id: string;
  bot_id: string;
  trade_type: string;
  buy_price: number;
  sell_price: number | null;
  amount: number;
  leverage: number;
  profit_amount: number | null;
  profit_percentage: number | null;
  status: string;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

interface TradingStats {
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
  successRate: number;
  totalProfit: number;
  avgTradeDuration: string;
}

export function useTradingStats() {
  const [trades, setTrades] = useState<BotTrade[]>([]);
  const [stats, setStats] = useState<TradingStats>({
    totalTrades: 0,
    successfulTrades: 0,
    failedTrades: 0,
    successRate: 0,
    totalProfit: 0,
    avgTradeDuration: "0s"
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateStats = (tradesData: BotTrade[]): TradingStats => {
    if (tradesData.length === 0) {
      return {
        totalTrades: 0,
        successfulTrades: 0,
        failedTrades: 0,
        successRate: 0,
        totalProfit: 0,
        avgTradeDuration: "0s"
      };
    }

    const completedTrades = tradesData.filter(trade => trade.status === 'completed' && trade.completed_at);
    const totalTrades = completedTrades.length;
    const successfulTrades = completedTrades.filter(trade => trade.profit_amount && trade.profit_amount > 0).length;
    const failedTrades = totalTrades - successfulTrades;
    const successRate = totalTrades > 0 ? Math.round((successfulTrades / totalTrades) * 100) : 0;
    
    // Calculate total profit
    const totalProfit = completedTrades.reduce((sum, trade) => {
      return sum + (trade.profit_amount || 0);
    }, 0);

    // Calculate average trade duration
    let avgTradeDuration = "0s";
    if (completedTrades.length > 0) {
      const totalDurationMs = completedTrades.reduce((sum, trade) => {
        if (trade.completed_at && trade.started_at) {
          const startTime = new Date(trade.started_at);
          const endTime = new Date(trade.completed_at);
          return sum + (endTime.getTime() - startTime.getTime());
        }
        return sum;
      }, 0);
      
      const avgDurationMs = totalDurationMs / completedTrades.length;
      const avgMinutes = Math.floor(avgDurationMs / (1000 * 60));
      const avgSeconds = Math.floor((avgDurationMs % (1000 * 60)) / 1000);
      
      if (avgMinutes > 0) {
        avgTradeDuration = `${avgMinutes}m ${avgSeconds}s`;
      } else {
        avgTradeDuration = `${avgSeconds}s`;
      }
    }

    return {
      totalTrades,
      successfulTrades,
      failedTrades,
      successRate,
      totalProfit,
      avgTradeDuration
    };
  };

  const fetchTrades = async () => {
    try {
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTrades([]);
        setStats(calculateStats([]));
        setLoading(false);
        return;
      }

      // Fetch all bot trades for the user's bots
      const { data, error: fetchError } = await supabase
        .from('bot_trades')
        .select(`
          *,
          trading_bots!inner(user_id)
        `)
        .eq('trading_bots.user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching bot trades:', fetchError);
        setError('Fehler beim Laden der Trading-Statistiken');
        setTrades([]);
        setStats(calculateStats([]));
      } else {
        const tradesData = (data || []) as BotTrade[];
        setTrades(tradesData);
        setStats(calculateStats(tradesData));
      }
    } catch (err) {
      console.error('Unexpected error fetching trades:', err);
      setError('Ein unerwarteter Fehler ist aufgetreten');
      setTrades([]);
      setStats(calculateStats([]));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();

    // Set up realtime subscription for bot_trades changes
    const channel = supabase
      .channel('bot-trades-stats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bot_trades'
        },
        () => {
          fetchTrades();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { 
    trades,
    stats, 
    loading, 
    error, 
    refetch: fetchTrades 
  };
}