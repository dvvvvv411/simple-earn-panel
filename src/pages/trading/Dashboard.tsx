import React, { useState, useEffect } from "react";
import { AccountBalanceCard } from "@/components/trading/AccountBalanceCard";
import { TradesCard } from "@/components/trading/TradesCard";
import { MarketOverviewCard } from "@/components/trading/MarketOverviewCard";
import { WelcomeCard } from "@/components/trading/WelcomeCard";
import { BotCard } from "@/components/trading/BotCard";
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
}

export default function Dashboard() {
  const [userBalance, setUserBalance] = useState<number>(25000.50);
  const { bots, loading: botsLoading, refetch: refetchBots } = useTradingBots();
  const [completedBot, setCompletedBot] = useState<TradingBot | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

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
              timestamp: new Date().toISOString()
            });
            
            // IMMEDIATE refetch on ANY trading_bots change
            refetchBots();
            
            // Special handling for completed bots
            if (payload.eventType === 'UPDATE' && 
                (payload.old as any)?.status === 'active' && 
                (payload.new as any)?.status === 'completed') {
              console.log('🎯 Dashboard: Bot completed! Showing success dialog');
              setCompletedBot(payload.new as TradingBot);
              setShowSuccessDialog(true);
              setTimeout(() => fetchUserBalance(), 500); // Small delay to ensure DB consistency
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

      {/* Trading Bots Section */}
      {bots.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Meine Trading-Bots</h2>
            <span className="text-sm text-muted-foreground">
              {bots.filter(bot => bot.status === 'active').length} aktiv von {bots.length} gesamt
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bots.map((bot) => (
              <BotCard 
                key={bot.id} 
                bot={bot} 
                onUpdate={handleBalanceUpdate}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-12 p-6 bg-muted/30 rounded-xl border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-3">
          Trading-Bot in Entwicklung
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          Unser KI-gestützter Trading-Bot befindet sich derzeit in der Entwicklungsphase. 
          In Kürze können Sie automatisierte Trades basierend auf fortschrittlichen Marktanalysen durchführen.
          Alle aktuell angezeigten Daten sind Platzhalter und werden durch echte Trading-Metriken ersetzt.
        </p>
      </div>

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