import React, { useState, useEffect } from "react";
import { AccountBalanceCard } from "@/components/trading/AccountBalanceCard";
import { TradesCard } from "@/components/trading/TradesCard";
import { MarketOverviewCard } from "@/components/trading/MarketOverviewCard";
import { WelcomeCard } from "@/components/trading/WelcomeCard";
import { BotCard } from "@/components/trading/BotCard";
import { CreateBotCard } from "@/components/trading/CreateBotCard";
import { useTradingBots } from "@/hooks/useTradingBots";
import { supabase } from "@/integrations/supabase/client";
import { TradingSuccessDialog } from "@/components/trading/TradingSuccessDialog";

interface TradingBot {
  id: string;
  cryptocurrency: string;
  symbol: string;
  start_amount: number;
  current_balance: number;
  status: 'active' | 'paused' | 'stopped' | 'completed';
  created_at: string;
  updated_at: string;
  buy_price: number | null;
  sell_price: number | null;
  leverage: number;
  position_type: string;
}

export default function Dashboard() {
  const [userBalance, setUserBalance] = useState<number>(25000.50);
  const { bots, loading: botsLoading, refetch: refetchBots } = useTradingBots();
  const [completedBot, setCompletedBot] = useState<TradingBot | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [previousBots, setPreviousBots] = useState<TradingBot[]>([]);

  // Fetch user balance
  const fetchUserBalance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserBalance(profile.balance);
        }
      }
    } catch (error) {
      console.error('Error fetching user balance:', error);
    }
  };

  // Watch for newly completed bots (fallback detection)
  useEffect(() => {
    if (bots.length > 0 && previousBots.length > 0) {
      // Find bots that just changed from active to completed
      const newlyCompleted = bots.filter(bot => {
        const previousBot = previousBots.find(prev => prev.id === bot.id);
        return previousBot && 
               previousBot.status === 'active' && 
               bot.status === 'completed';
      });

      if (newlyCompleted.length > 0) {
        console.log('🔥 Dashboard: Fallback detected newly completed bot:', newlyCompleted[0].id);
        const bot = newlyCompleted[0];
        setCompletedBot({
          ...bot,
          buy_price: bot.buy_price || null,
          sell_price: bot.sell_price || null,
          leverage: bot.leverage || 1,
          position_type: bot.position_type || 'LONG'
        });
        setShowSuccessDialog(true);
        setTimeout(() => fetchUserBalance(), 500);
      }
    }
    
    // Update previous bots for next comparison
    setPreviousBots([...bots]);
  }, [bots]);

  useEffect(() => {
    fetchUserBalance();

    // Set up robust real-time subscription for trading_bots changes
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('🔥 Dashboard: Setting up realtime subscription for user:', user.id);

      const channel = supabase
        .channel('dashboard-trading-bots')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'trading_bots',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('🚀 Dashboard: Trading bot realtime event received:', {
              event: payload.eventType,
              botId: (payload.new as any)?.id || (payload.old as any)?.id,
              oldStatus: (payload.old as any)?.status,
              newStatus: (payload.new as any)?.status,
              oldData: payload.old,
              newData: payload.new,
              timestamp: new Date().toISOString()
            });
            
            // IMMEDIATE refetch on ANY trading_bots change
            refetchBots();
            
            // Enhanced debugging for completion logic
            if (payload.eventType === 'UPDATE') {
              const oldStatus = (payload.old as any)?.status;
              const newStatus = (payload.new as any)?.status;
              
              console.log('🔍 Dashboard: Checking completion condition:', {
                isUpdate: payload.eventType === 'UPDATE',
                oldStatus,
                newStatus,
                oldIsActive: oldStatus === 'active',
                newIsCompleted: newStatus === 'completed',
                conditionMet: oldStatus === 'active' && newStatus === 'completed'
              });
              
              // Special handling for completed bots
              if (oldStatus === 'active' && newStatus === 'completed') {
                console.log('🎯 Dashboard: Bot completed! Showing success dialog');
                const bot = payload.new as any;
                setCompletedBot({
                  ...bot,
                  buy_price: bot.buy_price || null,
                  sell_price: bot.sell_price || null,
                  leverage: bot.leverage || 1,
                  position_type: bot.position_type || 'LONG'
                });
                setShowSuccessDialog(true);
                setTimeout(() => fetchUserBalance(), 500); // Small delay to ensure DB consistency
              } else {
                console.log('❌ Dashboard: Completion condition NOT met for this update');
              }
            }
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
            console.log('💰 Dashboard: Balance updated via realtime:', payload.new?.balance);
            if (payload.new && typeof payload.new.balance === 'number') {
              setUserBalance(payload.new.balance);
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 Dashboard: Realtime subscription status:', status);
        });

      return () => {
        console.log('🧹 Dashboard: Cleaning up subscriptions');
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setupRealtimeSubscription();
    
    return () => {
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, [refetchBots]);

  const handleBalanceUpdate = () => {
    console.log('Triggering balance update');
    fetchUserBalance();
    refetchBots();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-foreground">Trading Dashboard</h1>
        <p className="text-lg text-muted-foreground">
          Willkommen zurück! Hier ist eine Übersicht über Ihr Trading-Portfolio.
        </p>
      </div>

      <WelcomeCard />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AccountBalanceCard 
          balance={userBalance} 
          onBalanceUpdate={handleBalanceUpdate}
        />
        <TradesCard />
        <MarketOverviewCard />
      </div>

      {/* Trading Bots Section - Always visible */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Meine Trading-Bots</h2>
          <span className="text-sm text-muted-foreground">
            {bots.filter(bot => bot.status === 'active').length} aktive Bots
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create Bot Card - Always first */}
          <CreateBotCard 
            userBalance={userBalance}
            onBotCreated={handleBalanceUpdate}
          />
          
          {/* Active Trading Bots */}
          {bots.filter(bot => bot.status === 'active').map((bot) => (
            <BotCard 
              key={bot.id} 
              bot={bot} 
              onUpdate={handleBalanceUpdate}
              onBotCompleted={(completedBot) => {
                console.log('🎯 Dashboard: Bot completed callback triggered:', completedBot.id);
                setCompletedBot({
                  ...completedBot,
                  buy_price: completedBot.buy_price || null,
                  sell_price: completedBot.sell_price || null,
                  leverage: completedBot.leverage || 1,
                  position_type: completedBot.position_type || 'LONG'
                });
                setShowSuccessDialog(true);
                setTimeout(() => fetchUserBalance(), 500);
              }}
            />
          ))}
        </div>
      </div>

      {/* Trading History Section */}
      {bots.filter(bot => bot.status === 'completed').length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Trading-Historie</h2>
            <span className="text-sm text-muted-foreground">
              Letzte 3 abgeschlossene Trades
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bots.filter(bot => bot.status === 'completed').slice(0, 3).map((bot) => (
              <BotCard 
                key={bot.id} 
                bot={bot} 
                onUpdate={handleBalanceUpdate}
                onBotCompleted={(completedBot) => {
                  console.log('🎯 Dashboard: Bot completed callback triggered:', completedBot.id);
                  setCompletedBot({
                    ...completedBot,
                    buy_price: completedBot.buy_price || null,
                    sell_price: completedBot.sell_price || null,
                    leverage: completedBot.leverage || 1,
                    position_type: completedBot.position_type || 'LONG'
                  });
                  setShowSuccessDialog(true);
                  setTimeout(() => fetchUserBalance(), 500);
                }}
              />
            ))}
          </div>
        </div>
      )}


      <TradingSuccessDialog
        open={showSuccessDialog}
        onOpenChange={(open) => {
          setShowSuccessDialog(open);
          if (!open) {
            setCompletedBot(null);
          }
        }}
        completedBot={completedBot}
      />
    </div>
  );
}