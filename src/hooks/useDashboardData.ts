import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TradingBot {
  id: string;
  cryptocurrency: string;
  symbol: string;
  start_amount: number;
  current_balance: number;
  status: 'active' | 'paused' | 'stopped' | 'completed';
  created_at: string;
  updated_at: string;
  buy_price?: number | null;
  sell_price?: number | null;
  leverage?: number;
  position_type?: string;
}

interface BotTrade {
  id: string;
  bot_id: string;
  trade_type: 'long' | 'short';
  buy_price: number;
  sell_price: number | null;
  amount: number;
  leverage: number;
  profit_amount: number | null;
  profit_percentage: number | null;
  status: 'pending' | 'active' | 'completed' | 'failed';
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

interface DashboardData {
  bots: TradingBot[];
  trades: BotTrade[];
  userBalance: number;
  stats: TradingStats;
  todayStats: TradingStats;
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData>({
    bots: [],
    trades: [],
    userBalance: 0,
    stats: {
      totalTrades: 0,
      successfulTrades: 0,
      failedTrades: 0,
      successRate: 0,
      totalProfit: 0,
      avgTradeDuration: "0s"
    },
    todayStats: {
      totalTrades: 0,
      successfulTrades: 0,
      failedTrades: 0,
      successRate: 0,
      totalProfit: 0,
      avgTradeDuration: "0s"
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateStats = (tradesData: BotTrade[], timeFrame: 'today' | 'all' = 'all'): TradingStats => {
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

    let filteredTrades = tradesData.filter(trade => trade.status === 'completed' && trade.completed_at);
    
    if (timeFrame === 'today') {
      const today = new Date().toDateString();
      filteredTrades = filteredTrades.filter(trade => {
        if (!trade.completed_at) return false;
        const tradeDate = new Date(trade.completed_at).toDateString();
        return tradeDate === today;
      });
    }

    const completedTrades = filteredTrades;
    const totalTrades = completedTrades.length;
    const successfulTrades = completedTrades.filter(trade => trade.profit_amount && trade.profit_amount > 0).length;
    const failedTrades = totalTrades - successfulTrades;
    const successRate = totalTrades > 0 ? Math.round((successfulTrades / totalTrades) * 100) : 0;
    
    const totalProfit = completedTrades.reduce((sum, trade) => {
      return sum + (trade.profit_amount || 0);
    }, 0);

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

  const fetchAllData = useCallback(async () => {
    try {
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setData({
          bots: [],
          trades: [],
          userBalance: 0,
          stats: calculateStats([]),
          todayStats: calculateStats([])
        });
        setLoading(false);
        return;
      }

      // Fetch all data in parallel for better performance
      const [botsResult, tradesResult, profileResult] = await Promise.all([
        // Fetch trading bots
        supabase
          .from('trading_bots')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        
        // Fetch bot trades
        supabase
          .from('bot_trades')
          .select(`
            *,
            trading_bots!inner(user_id)
          `)
          .eq('trading_bots.user_id', user.id)
          .order('created_at', { ascending: false }),
        
        // Fetch user profile/balance
        supabase
          .from('profiles')
          .select('balance')
          .eq('id', user.id)
          .single()
      ]);

      if (botsResult.error || tradesResult.error || profileResult.error) {
        throw new Error('Fehler beim Laden der Daten');
      }

      const bots = (botsResult.data || []).map((bot: any) => ({
        ...bot,
        buy_price: bot.buy_price || null,
        sell_price: bot.sell_price || null,
        leverage: bot.leverage || 1,
        position_type: bot.position_type || 'LONG'
      })) as TradingBot[];

      const trades = (tradesResult.data || []) as BotTrade[];
      const userBalance = profileResult.data?.balance || 0;

      const stats = calculateStats(trades, 'all');
      const todayStats = calculateStats(trades, 'today');

      setData({
        bots,
        trades,
        userBalance,
        stats,
        todayStats
      });

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Fehler beim Laden der Dashboard-Daten');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();

    // Single realtime subscription for all dashboard updates
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('dashboard-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'trading_bots',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchAllData();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bot_trades'
          },
          () => {
            fetchAllData();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`
          },
          () => {
            fetchAllData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setupRealtimeSubscription();
    
    return () => {
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, [fetchAllData]);

  return {
    data,
    loading,
    error,
    refetch: fetchAllData
  };
}