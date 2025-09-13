import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import CryptoCandlestickChart from './CryptoCandlestickChart';

interface TradingBot {
  id: string;
  cryptocurrency: string;
  symbol: string;
  start_amount: number;
  current_balance: number;
  status: 'active' | 'paused' | 'stopped';
  created_at: string;
}

interface BotTrade {
  id: string;
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

interface BotCardProps {
  bot: TradingBot;
  onUpdate: () => void;
}

export function BotCard({ bot, onUpdate }: BotCardProps) {
  const [trades, setTrades] = useState<BotTrade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Calculate profit/loss
  const totalReturn = bot.current_balance - bot.start_amount;
  const returnPercentage = ((totalReturn / bot.start_amount) * 100);
  const isProfit = totalReturn >= 0;

  // Get latest trade
  const latestTrade = trades.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())[0];

  useEffect(() => {
    fetchTrades();
    
    // Set up realtime subscription for trades
    const channel = supabase
      .channel('bot-trades-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bot_trades',
          filter: `bot_id=eq.${bot.id}`
        },
        () => {
          fetchTrades();
          onUpdate(); // Refresh bot data
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bot.id]);

  const fetchTrades = async () => {
    const { data, error } = await supabase
      .from('bot_trades')
      .select('*')
      .eq('bot_id', bot.id)
      .order('started_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching trades:', error);
    } else {
      setTrades((data || []) as BotTrade[]);
    }
  };

  // Removed pause/stop functionality - bots are always active

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">{bot.cryptocurrency}</CardTitle>
            <Badge variant="outline" className="text-xs">
              {bot.symbol}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-green-600">Aktiv</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Performance Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Startbetrag</p>
            <p className="font-semibold">
              {bot.start_amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Aktueller Wert</p>
            <p className="font-semibold">
              {bot.current_balance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </p>
          </div>
        </div>

        {/* Live Chart */}
        <div className="space-y-2">
          <CryptoCandlestickChart 
            symbol={bot.symbol} 
            currentPrice={50000 + Math.random() * 10000} 
          />
        </div>

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

        {/* Latest Trade Info */}
        {latestTrade && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Aktueller Trade</p>
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
            
            {latestTrade.status === 'active' && (
              <div className="text-xs text-muted-foreground">
                Einstiegspreis: {latestTrade.buy_price.toFixed(4)} EUR
              </div>
            )}
            
            {latestTrade.status === 'completed' && latestTrade.sell_price && (
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Einstieg: {latestTrade.buy_price.toFixed(4)} EUR</div>
                <div>Ausstieg: {latestTrade.sell_price.toFixed(4)} EUR</div>
              </div>
            )}
          </div>
        )}

        {/* Active Indicator */}
        <div className="flex items-center gap-2 text-xs text-green-600">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>Bot arbeitet aktiv...</span>
        </div>
      </CardContent>
    </Card>
  );
}