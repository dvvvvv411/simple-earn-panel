import React, { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Bot, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateBotForm } from "@/components/trading/CreateBotForm";
import { OptimizedBotCard } from "@/components/trading/OptimizedBotCard";
import { TradingSuccessDialog } from "@/components/trading/TradingSuccessDialog";
import { useDashboardData } from "@/hooks/useDashboardData";

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

export default function Bots() {
  const [completedBot, setCompletedBot] = useState<TradingBot | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  
  const handleBotCompleted = useCallback((bot: TradingBot) => {
    if (!showSuccessDialog || completedBot?.id !== bot.id) {
      setCompletedBot(bot);
      setShowSuccessDialog(true);
    }
  }, [showSuccessDialog, completedBot?.id]);
  
  const { data, loading, refetch } = useDashboardData(handleBotCompleted);

  const activeBots = data.bots.filter(bot => bot.status === 'active');
  const completedBots = data.bots.filter(bot => bot.status === 'completed');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Trading-Bots</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Erstellen und verwalten Sie Ihre automatisierten Trading-Bots.
        </p>
      </div>

      {/* Bot Creation Form */}
      {loading ? (
        <Skeleton className="h-96 rounded-lg" />
      ) : (
        <CreateBotForm 
          userBalance={data.userBalance} 
          onBotCreated={refetch} 
        />
      )}

      {/* Active Bots Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Aktive Trading-Bots</h2>
          <span className="text-sm text-muted-foreground">
            {activeBots.length} {activeBots.length === 1 ? 'aktiver Bot' : 'aktive Bots'}
          </span>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-80 rounded-lg" />
            <Skeleton className="h-80 rounded-lg" />
            <Skeleton className="h-80 rounded-lg" />
          </div>
        ) : activeBots.length === 0 ? (
          <div className="p-8 text-center rounded-lg border border-dashed border-muted-foreground/30">
            <Bot className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Keine aktiven Bots</h3>
            <p className="text-sm text-muted-foreground">
              Erstellen Sie oben Ihren ersten Trading-Bot, um automatisiert zu handeln.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeBots.map((bot) => (
              <OptimizedBotCard 
                key={bot.id} 
                bot={bot} 
                trades={data.trades}
              />
            ))}
          </div>
        )}
      </div>

      {/* Completed Bots Section */}
      {completedBots.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Abgeschlossene Trades</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/kryptotrading/historie" className="flex items-center gap-2">
                Alle anzeigen
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedBots.slice(0, 6).map((bot) => (
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
