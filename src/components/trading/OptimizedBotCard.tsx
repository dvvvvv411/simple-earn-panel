import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { useCoinMarketCap } from '@/contexts/CoinMarketCapContext';
import { supabase } from '@/integrations/supabase/client';
import CryptoCandlestickChart from './CryptoCandlestickChart';

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
  leverage: number;
  amount: number;
  profit_amount: number | null;
  profit_percentage: number | null;
  status: 'pending' | 'active' | 'completed' | 'failed';
  started_at: string;
  completed_at: string | null;
}

interface OptimizedBotCardProps {
  bot: TradingBot;
  trades: BotTrade[];
  onBotCompleted?: (bot: TradingBot) => void;
}

export function OptimizedBotCard({ bot, trades, onBotCompleted }: OptimizedBotCardProps) {
  const [runtime, setRuntime] = useState<string>('');
  const [localBot, setLocalBot] = useState<TradingBot>(bot);
  const { coins, getPriceData } = useCoinMarketCap();
  const priceData = getPriceData(bot.symbol);

  // Get bot-specific trades
  const botTrades = useMemo(() => {
    return trades.filter(trade => trade.bot_id === localBot.id)
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
  }, [trades, localBot.id]);

  // Get current coin data
  const currentCoin = useMemo(() => {
    return coins.find(coin => coin.symbol.toUpperCase() === localBot.symbol.toUpperCase());
  }, [coins, localBot.symbol]);

  // Format price to exactly 2 decimal places
  const formatPrice = (price: number) => {
    return price.toLocaleString('de-DE', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Calculate profit/loss
  const totalReturn = localBot.current_balance - localBot.start_amount;
  const returnPercentage = ((totalReturn / localBot.start_amount) * 100);
  const isProfit = totalReturn >= 0;

  // Get latest trade
  const latestTrade = botTrades[0];

  // Calculate runtime
  const calculateRuntime = () => {
    if (localBot.status === 'completed' && latestTrade && latestTrade.completed_at) {
      const startTime = new Date(latestTrade.started_at);
      const endTime = new Date(latestTrade.completed_at);
      const diffMs = endTime.getTime() - startTime.getTime();
      
      const minutes = Math.floor(diffMs / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
      } else {
        return `${seconds}s`;
      }
    } else {
      const now = new Date();
      const startTime = new Date(localBot.created_at);
      const diffMs = now.getTime() - startTime.getTime();
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${minutes}m`;
      }
    }
  };

  // Direct real-time subscription for bot status changes
  useEffect(() => {
    console.log(`🔄 OptimizedBotCard: Setting up real-time subscription for bot ${bot.id}`);
    
    const channel = supabase
      .channel(`bot-${bot.id}-updates`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trading_bots',
          filter: `id=eq.${bot.id}`
        },
        (payload) => {
          console.log(`🤖 OptimizedBotCard: Bot ${bot.id} updated:`, payload);
          const updatedBot = {
            ...payload.new,
            status: payload.new.status as TradingBot['status']
          } as TradingBot;
          
          // Check if bot just completed
          if (localBot.status === 'active' && updatedBot.status === 'completed') {
            console.log(`✅ OptimizedBotCard: Bot ${bot.id} just completed! Triggering success dialog`);
            setLocalBot(updatedBot);
            onBotCompleted?.(updatedBot);
          } else {
            setLocalBot(updatedBot);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bot_trades',
          filter: `bot_id=eq.${bot.id}`
        },
        (payload) => {
          console.log(`💰 OptimizedBotCard: New trade inserted for bot ${bot.id}:`, payload);
          const newTrade = payload.new;
          
          // If this is a completed trade and bot is active, trigger completion
          if (newTrade.status === 'completed' && localBot.status === 'active') {
            console.log(`🎯 OptimizedBotCard: Trade completed for bot ${bot.id}, checking bot status...`);
            
            // Fetch updated bot status to ensure it's marked as completed
            setTimeout(async () => {
              const { data: updatedBot } = await supabase
                .from('trading_bots')
                .select('*')
                .eq('id', bot.id)
                .single();
                
              if (updatedBot && updatedBot.status === 'completed') {
                console.log(`🚀 OptimizedBotCard: Bot ${bot.id} confirmed completed via trade insert`);
                const typedBot = {
                  ...updatedBot,
                  status: updatedBot.status as TradingBot['status']
                } as TradingBot;
                setLocalBot(typedBot);
                onBotCompleted?.(typedBot);
              }
            }, 500); // Small delay to ensure database consistency
          }
        }
      )
      .subscribe();

    return () => {
      console.log(`🔌 OptimizedBotCard: Cleaning up subscription for bot ${bot.id}`);
      supabase.removeChannel(channel);
    };
  }, [bot.id, localBot.status, onBotCompleted]);

  // Sync local bot with prop changes
  useEffect(() => {
    setLocalBot(bot);
  }, [bot]);

  // Update runtime every minute
  useEffect(() => {
    const updateRuntime = () => setRuntime(calculateRuntime());
    updateRuntime();
    
    const interval = setInterval(updateRuntime, 60000);
    
    return () => clearInterval(interval);
  }, [localBot.created_at, latestTrade]);

  return (
    <Card 
      className="relative overflow-hidden transition-all duration-200 hover:shadow-lg" 
      data-bot-id={localBot.id}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">{localBot.cryptocurrency}</CardTitle>
            <Badge variant="outline" className="text-xs">
              {localBot.symbol}
            </Badge>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 status-indicator">
              {localBot.status === 'completed' ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-sm font-medium text-blue-600">Abgeschlossen</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium text-green-600">Aktiv</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{localBot.status === 'completed' ? 'Abgeschlossen nach:' : 'Läuft seit:'} {runtime}</span>
            </div>
          </div>
        </div>
        
        {/* Live Price Display - Only for active bots */}
        {localBot.status !== 'completed' && (
          <div className="flex items-center justify-between mt-2 p-2 rounded-lg bg-muted/20">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${priceData ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-xs font-medium text-green-600">LIVE</span>
              <span className="text-sm font-semibold">{priceData ? formatPrice(priceData.price) : '€0,00'}</span>
            </div>
            <div className={`text-xs font-medium ${(priceData?.change24h || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(priceData?.change24h || 0) >= 0 ? '+' : ''}{(priceData?.change24h || 0).toFixed(2)}%
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Performance Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Startbetrag</p>
            <p className="font-semibold">
              {localBot.start_amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Aktueller Wert</p>
            <p className="font-semibold">
              {localBot.current_balance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </p>
          </div>
        </div>

        {/* Chart - Always visible for active bots */}
        {localBot.status !== 'completed' && (
          <div className="space-y-2">
            <CryptoCandlestickChart symbol={localBot.symbol} />
          </div>
        )}

        {/* Profit/Loss */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            {isProfit ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span className="text-sm font-medium">
              {isProfit ? 'Gewinn' : 'Verlust'}
            </span>
          </div>
          <div className="text-right">
            <p className={`font-semibold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
              {totalReturn >= 0 ? '+' : ''}{totalReturn.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </p>
            <p className={`text-xs ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
              ({returnPercentage >= 0 ? '+' : ''}{returnPercentage.toFixed(2)}%)
            </p>
          </div>
        </div>

        {/* Trade Details - Always visible */}
        {latestTrade && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              {localBot.status === 'completed' ? 'Trade Details' : 'Aktueller Trade'}
            </p>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Badge variant={latestTrade.trade_type === 'long' ? 'default' : 'secondary'} className="text-xs">
                  {latestTrade.trade_type === 'long' ? 'LONG' : 'SHORT'}
                </Badge>
                <span className="text-muted-foreground">
                  {latestTrade.leverage}x Hebel
                </span>
              </div>
              {latestTrade.status === 'completed' && latestTrade.profit_percentage && (
                <span className={`font-medium ${latestTrade.profit_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {latestTrade.profit_percentage >= 0 ? '+' : ''}{latestTrade.profit_percentage.toFixed(2)}%
                </span>
              )}
            </div>
            
            {latestTrade.status === 'completed' && latestTrade.sell_price && (
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Kaufpreis: {formatPrice(latestTrade.buy_price)}</div>
                <div>Verkaufspreis: {formatPrice(latestTrade.sell_price)}</div>
                <div>Gewinn: {latestTrade.profit_amount ? formatPrice(latestTrade.profit_amount) : '€0,00'}</div>
              </div>
            )}
          </div>
        )}

        {/* Status Indicator */}
        {localBot.status === 'completed' ? (
          <div className="flex items-center gap-2 text-xs text-blue-600">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Trade abgeschlossen - Kontostand wurde aktualisiert</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-green-600">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Bot arbeitet aktiv...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}