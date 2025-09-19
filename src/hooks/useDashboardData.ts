import { useState, useEffect, useCallback, useRef } from 'react';
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
  todayStartBalance: number;
}

export function useDashboardData(onBotCompleted?: (bot: TradingBot) => void) {
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
    },
    todayStartBalance: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Debouncing refs to prevent race conditions
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const fetchingRef = useRef(false);
  const previousBotsRef = useRef<TradingBot[]>([]);

  const getTodayStartBalance = async (userId: string, currentBalance: number, todayProfit: number): Promise<number> => {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Get the first transaction of today to find the balance before it
      const { data: todayTransactions } = await supabase
        .from('user_transactions')
        .select('previous_balance, created_at')
        .eq('user_id', userId)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`)
        .order('created_at', { ascending: true })
        .limit(1);

      if (todayTransactions && todayTransactions.length > 0) {
        // Return the balance before the first transaction of today
        return todayTransactions[0].previous_balance;
      } else {
        // No transactions today, so start balance = current balance - today's profit
        return currentBalance - todayProfit;
      }
    } catch (error) {
      console.error('Error getting today start balance:', error);
      // Fallback: current balance minus today's profit
      return currentBalance - todayProfit;
    }
  };

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

  // Debounced fetch function to prevent race conditions
  const debouncedFetchAllData = useCallback(async (immediate = false) => {
    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // If already fetching and not immediate, skip
    if (fetchingRef.current && !immediate) {
      console.log('🔄 useDashboardData: Skipping fetch - already in progress');
      return;
    }

    const executeFetch = async () => {
      if (fetchingRef.current) {
        console.log('🔄 useDashboardData: Skipping fetch - already in progress');
        return;
      }

      try {
        fetchingRef.current = true;
        console.log('🔄 useDashboardData: Starting fetch...');
        setError(null);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setData({
            bots: [],
            trades: [],
            userBalance: 0,
            stats: calculateStats([]),
            todayStats: calculateStats([]),
            todayStartBalance: 0
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
        const todayStartBalance = await getTodayStartBalance(user.id, userBalance, todayStats.totalProfit);

        console.log('✅ useDashboardData: Fetch completed successfully');
        
        // Check for newly completed bots (status change detection)
        if (onBotCompleted && previousBotsRef.current.length > 0) {
          const newlyCompleted = bots.filter(bot => {
            const previousBot = previousBotsRef.current.find(prev => prev.id === bot.id);
            return previousBot && 
                   previousBot.status === 'active' && 
                   bot.status === 'completed';
          });
          
          if (newlyCompleted.length > 0) {
            const bot = newlyCompleted[0];
            console.log(`🎯 useDashboardData: CENTRAL detected newly completed bot:`, bot.id);
            setTimeout(() => onBotCompleted(bot), 100); // Small delay to ensure UI is updated
          }
        }
        
        // Store current bots for next comparison
        previousBotsRef.current = [...bots];
        
        setData({
          bots,
          trades,
          userBalance,
          stats,
          todayStats,
          todayStartBalance
        });

      } catch (err) {
        console.error('❌ useDashboardData: Error fetching dashboard data:', err);
        setError('Fehler beim Laden der Dashboard-Daten');
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    };

    if (immediate) {
      await executeFetch();
    } else {
      debounceRef.current = setTimeout(executeFetch, 300); // 300ms debounce
    }
  }, []);

  // Legacy function for backward compatibility
  const fetchAllData = useCallback(() => debouncedFetchAllData(true), [debouncedFetchAllData]);

  useEffect(() => {
    fetchAllData();

    // Single realtime subscription for all dashboard updates with coordination
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('🔄 useDashboardData: Setting up SINGLE CENTRALIZED realtime subscription');

      const channel = supabase
        .channel('dashboard-updates-single')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'trading_bots',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const newBot = payload.new as any;
            const oldBot = payload.old as any;
            
            console.log('🤖 useDashboardData: Bot update received:', payload.eventType, newBot?.id || 'unknown', newBot?.status || 'unknown');
            
            // Check if bot status changed to completed
            if (oldBot?.status !== 'completed' && newBot?.status === 'completed') {
              console.log('🎯 useDashboardData: Bot COMPLETED - triggering hard refresh in 2 seconds:', newBot.id);
              setTimeout(() => {
                window.location.reload();
              }, 2000);
            } else {
              // For other updates, just refresh data
              debouncedFetchAllData(true);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'bot_trades'
          },
          (payload) => {
            const trade = payload.new as BotTrade;
            const oldTrade = payload.old as BotTrade;
            
            // Check if trade status changed to completed
            if (oldTrade?.status !== 'completed' && trade.status === 'completed') {
              console.log('💰 useDashboardData: Trade COMPLETED - triggering hard refresh in 2 seconds:', trade.bot_id);
              setTimeout(() => {
                window.location.reload();
              }, 2000);
            } else {
              console.log('💰 useDashboardData: Trade update received:', payload.eventType, trade?.bot_id || 'unknown');
              debouncedFetchAllData();
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bot_trades'
          },
          (payload) => {
            console.log('💰 useDashboardData: Trade update received:', payload.eventType, (payload.new as any)?.bot_id || 'unknown');
            // Use debounced fetch for other trade updates
            debouncedFetchAllData();
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
          (payload) => {
            console.log('👤 useDashboardData: Profile update received');
            // Profile updates are important, fetch immediately
            debouncedFetchAllData(true);
          }
        )
        .subscribe();

      return () => {
        console.log('🔌 useDashboardData: Cleaning up subscription');
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setupRealtimeSubscription();
    
    return () => {
      // Cleanup debounce timer
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, [debouncedFetchAllData, fetchAllData]);

  return {
    data,
    loading,
    error,
    refetch: fetchAllData
  };
}