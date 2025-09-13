import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TrendingUp, Trophy, BarChart3, Activity } from 'lucide-react';
import { useBranding } from '@/contexts/BrandingContext';
import { supabase } from '@/integrations/supabase/client';

interface TradingBot {
  id: string;
  cryptocurrency: string;
  symbol: string;
  start_amount: number;
  current_balance: number;
  status: string;
  created_at: string;
  buy_price: number | null;
  sell_price: number | null;
  leverage: number;
  position_type: string;
}

interface BotTradeDetails {
  buy_price: number;
  sell_price: number;
  leverage: number;
  trade_type: string;
  profit_amount: number;
  profit_percentage: number;
}

interface TradingSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  completedBot: TradingBot | null;
}

export function TradingSuccessDialog({ open, onOpenChange, completedBot }: TradingSuccessDialogProps) {
  const { branding } = useBranding();
  const accentColor = branding?.accent_color || '#10b981';
  const [tradeDetails, setTradeDetails] = useState<BotTradeDetails | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch trade details from bot_trades table
  useEffect(() => {
    if (open && completedBot) {
      setLoading(true);
      const fetchTradeDetails = async () => {
        try {
          const { data, error } = await supabase
            .from('bot_trades')
            .select('buy_price, sell_price, leverage, trade_type, profit_amount, profit_percentage')
            .eq('bot_id', completedBot.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (error) {
            console.error('Error fetching trade details:', error);
          } else {
            setTradeDetails(data);
          }
        } catch (error) {
          console.error('Error fetching trade details:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchTradeDetails();
    }
  }, [open, completedBot]);

  // Confetti animation
  useEffect(() => {
    if (open && completedBot && branding?.accent_color) {
      // Convert hex to RGB for confetti colors
      const hexToRgb = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `${r}, ${g}, ${b}`;
      };
      
      const baseRgb = hexToRgb(accentColor);
      
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.7 },
        colors: [
          `rgb(${baseRgb})`,
          `rgba(${baseRgb}, 0.8)`,
          `rgba(${baseRgb}, 0.6)`
        ],
        ticks: 80,
        gravity: 0.8,
        scalar: 0.8
      });
    }
  }, [open, completedBot, branding?.accent_color, accentColor]);

  if (!completedBot) return null;

  const profit = tradeDetails?.profit_amount ?? (completedBot.current_balance - completedBot.start_amount);
  const profitPercentage = tradeDetails?.profit_percentage?.toFixed(2) ?? ((profit / completedBot.start_amount) * 100).toFixed(2);
  const isProfit = profit > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-background/95 backdrop-blur-lg border border-primary/20">
        <DialogHeader className="text-center space-y-4">
          <div 
            className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ 
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`
            }}
          >
            <Trophy className="w-8 h-8 text-white" />
          </div>
          
          <div className="text-center mb-2">
            <span className="text-2xl">🎉 🎉</span>
          </div>
          
          <DialogTitle 
            className="text-2xl font-bold bg-clip-text text-transparent text-center"
            style={{ 
              background: `linear-gradient(to right, ${accentColor}, ${accentColor}dd)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Glückwunsch!
          </DialogTitle>
          
          <div className="text-center space-y-2">
            <p className="text-lg text-muted-foreground">
              Dein <span className="font-semibold text-foreground">{completedBot.cryptocurrency}</span> Trading-Bot ist erfolgreich abgeschlossen!
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Profit Display */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Activity className="w-6 h-6" style={{ color: accentColor }} />
              <span className="text-sm text-muted-foreground">Gewinn/Verlust</span>
            </div>
            <div className="space-y-1">
              <div className={`text-4xl font-bold drop-shadow-lg ${isProfit ? '' : 'text-red-500'}`}
                   style={isProfit ? { color: accentColor } : {}}>
                {isProfit ? '+' : ''}{profit.toFixed(2)} €
              </div>
              <div className={`text-lg ${isProfit ? '' : 'text-red-400'}`}
                   style={isProfit ? { color: `${accentColor}cc` } : {}}>
                ({isProfit ? '+' : ''}{profitPercentage}%)
              </div>
            </div>
          </div>

          {/* Trade Details */}
          <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 space-y-4 border border-border/50">
            <div className="flex items-center justify-center gap-2 mb-3">
              <BarChart3 className="w-5 h-5 text-primary" />
              <span className="font-semibold text-center">Trade Details</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <span className="text-muted-foreground block">Cryptocurrency</span>
                <div className="font-semibold">{completedBot.cryptocurrency} ({completedBot.symbol})</div>
              </div>
              <div className="text-center">
                <span className="text-muted-foreground block">Position</span>
                <div className="font-semibold">{tradeDetails?.trade_type || completedBot.position_type || 'LONG'}</div>
              </div>
              <div className="text-center">
                <span className="text-muted-foreground block">Hebel</span>
                <div className="font-semibold">{tradeDetails?.leverage || completedBot.leverage || 1}x</div>
              </div>
              <div className="text-center">
                <span className="text-muted-foreground block">Laufzeit</span>
                <div className="font-semibold">
                  {Math.ceil((Date.now() - new Date(completedBot.created_at).getTime()) / (1000 * 60))} Min
                </div>
              </div>
              <div className="text-center">
                <span className="text-muted-foreground block">Einkaufspreis</span>
                <div className="font-semibold">{tradeDetails?.buy_price?.toFixed(4) || completedBot.buy_price?.toFixed(4) || 'N/A'} $</div>
              </div>
              <div className="text-center">
                <span className="text-muted-foreground block">Verkaufspreis</span>
                <div className="font-semibold">{tradeDetails?.sell_price?.toFixed(4) || completedBot.sell_price?.toFixed(4) || 'N/A'} $</div>
              </div>
              <div className="text-center">
                <span className="text-muted-foreground block">Startsumme</span>
                <div className="font-semibold">{completedBot.start_amount.toFixed(2)} €</div>
              </div>
              <div className="text-center">
                <span className="text-muted-foreground block">Endsumme</span>
                <div className="font-semibold">{completedBot.current_balance.toFixed(2)} €</div>
              </div>
            </div>
          </div>

          {/* Success Message */}
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold text-primary">
              {isProfit ? "Fantastischer Trade! 🚀" : "Trade abgeschlossen! 📊"}
            </p>
            <p className="text-sm text-muted-foreground">
              {isProfit 
                ? "Du hast erfolgreich Gewinn erzielt!" 
                : "Nicht jeder Trade ist ein Gewinn - das gehört dazu!"
              }
            </p>
          </div>

          <Button 
            onClick={() => onOpenChange(false)}
            className="w-full text-white font-semibold py-3"
            style={{ 
              background: `linear-gradient(to right, ${accentColor}, ${accentColor}dd)`,
            }}
            size="lg"
          >
            Verstanden
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}