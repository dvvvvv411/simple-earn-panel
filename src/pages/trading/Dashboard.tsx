import React, { useState, useEffect, useCallback } from "react";
import { AccountBalanceCard } from "@/components/trading/AccountBalanceCard";
import { TradesCard } from "@/components/trading/TradesCard";
import { MarketOverviewCard } from "@/components/trading/MarketOverviewCard";
import { WelcomeCard } from "@/components/trading/WelcomeCard";
import { OptimizedBotCard } from "@/components/trading/OptimizedBotCard";
import { CreateBotCard } from "@/components/trading/CreateBotCard";
import { useDashboardData } from "@/hooks/useDashboardData";
import { TradingSuccessDialog } from "@/components/trading/TradingSuccessDialog";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function Dashboard() {
  const [completedBot, setCompletedBot] = useState<TradingBot | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  
  // Enhanced success dialog handler with duplicate prevention
  const handleBotCompleted = useCallback((bot: TradingBot) => {
    console.log(`🎉 Dashboard: Bot completion triggered from useDashboardData:`, bot.id);
    // Prevent duplicate dialogs
    if (!showSuccessDialog || completedBot?.id !== bot.id) {
      setCompletedBot(bot);
      setShowSuccessDialog(true);
      console.log(`✅ Dashboard: Success dialog opened for bot ${bot.id}`);
    } else {
      console.log(`🔒 Dashboard: Preventing duplicate success dialog for bot ${bot.id}`);
    }
  }, [showSuccessDialog, completedBot?.id]);
  
  const { data, loading, refetch } = useDashboardData(handleBotCompleted);

  // All completion detection now handled centrally in useDashboardData hook

  const handleBalanceUpdate = () => {
    refetch();
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

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AccountBalanceCard 
            balance={data.userBalance} 
            onBalanceUpdate={handleBalanceUpdate}
            todayStats={data.todayStats}
            todayStartBalance={data.todayStartBalance}
            bots={data.bots}
            loading={loading}
          />
          <TradesCard stats={data.stats} todayStats={data.todayStats} loading={loading} />
          <MarketOverviewCard />
        </div>
      )}

      {/* Trading Bots Section - Always visible */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Meine Trading-Bots</h2>
          <span className="text-sm text-muted-foreground">
            {data.bots.filter(bot => bot.status === 'active').length} aktive Bots
          </span>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-80 rounded-lg" />
            <Skeleton className="h-80 rounded-lg" />
            <Skeleton className="h-80 rounded-lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CreateBotCard 
              userBalance={data.userBalance}
              onBotCreated={handleBalanceUpdate}
            />
            
            {data.bots.filter(bot => bot.status === 'active').map((bot) => (
              <OptimizedBotCard 
                key={bot.id} 
                bot={bot} 
                trades={data.trades}
              />
            ))}
          </div>
        )}
      </div>

      {/* Trading History Section */}
      {!loading && data.bots.filter(bot => bot.status === 'completed').length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Trading-Historie</h2>
            <span className="text-sm text-muted-foreground">
              Letzte 3 abgeschlossene Trades
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.bots.filter(bot => bot.status === 'completed').slice(0, 3).map((bot) => (
              <OptimizedBotCard 
                key={bot.id} 
                bot={bot} 
                trades={data.trades}
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