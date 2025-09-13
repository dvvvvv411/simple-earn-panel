import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TrendingUp, Trophy, Zap, Target, BarChart3 } from 'lucide-react';
import { useBranding } from '@/contexts/BrandingContext';

interface TradingBot {
  id: string;
  cryptocurrency: string;
  symbol: string;
  start_amount: number;
  current_balance: number;
  status: string;
  buy_price?: number;
  sell_price?: number;
  leverage?: number;
  position_type?: 'LONG' | 'SHORT';
  created_at: string;
}

interface TradingSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  completedBot: TradingBot | null;
}

export function TradingSuccessDialog({ open, onOpenChange, completedBot }: TradingSuccessDialogProps) {
  const { branding } = useBranding();

  useEffect(() => {
    if (open && completedBot) {
      // Single elegant confetti burst
      confetti({
        particleCount: 30,
        spread: 45,
        origin: { y: 0.7 },
        colors: branding?.accent_color ? [branding.accent_color] : ['#10b981'],
        ticks: 60,
        gravity: 0.9,
        scalar: 0.7
      });
    }
  }, [open, completedBot, branding?.accent_color]);

  if (!completedBot) return null;

  const profit = completedBot.current_balance - completedBot.start_amount;
  const profitPercentage = ((profit / completedBot.start_amount) * 100).toFixed(2);
  const isProfit = profit > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-background/95 backdrop-blur-lg border border-border/50">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-primary-foreground" />
          </div>
          
          <DialogTitle className="text-2xl font-bold text-center">
            <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Trading erfolgreich abgeschlossen!
            </span>
          </DialogTitle>
          
          <div className="space-y-2">
            <p className="text-lg text-muted-foreground text-center">
              Dein <span className="font-semibold text-foreground">{completedBot.cryptocurrency}</span> Bot hat den Trade beendet
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Profit Display */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Target className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground font-medium">Ergebnis</span>
            </div>
            <div className="space-y-1">
              <div className={`text-4xl font-bold ${isProfit ? 'text-emerald-500' : 'text-red-500'} drop-shadow-lg text-center`}>
                {isProfit ? '+' : ''}{profit.toFixed(2)} €
              </div>
              <div className={`text-lg font-medium ${isProfit ? 'text-emerald-400' : 'text-red-400'} text-center`}>
                ({isProfit ? '+' : ''}{profitPercentage}%)
              </div>
            </div>
          </div>

          {/* Trading Data */}
          <div className="bg-card/50 backdrop-blur-sm rounded-lg p-5 space-y-4 border border-border/50">
            <div className="flex items-center gap-2 mb-4 justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
              <span className="font-semibold text-center">Trading Details</span>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {/* Basic Info Row */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <span className="text-muted-foreground block">Kryptowährung</span>
                  <div className="font-semibold text-foreground">{completedBot.cryptocurrency}</div>
                  <div className="text-xs text-muted-foreground">({completedBot.symbol})</div>
                </div>
                <div className="text-center">
                  <span className="text-muted-foreground block">Position</span>
                  <div className="font-semibold text-foreground">{completedBot.position_type || 'LONG'}</div>
                  <div className="text-xs text-muted-foreground">{completedBot.leverage || 1}x Hebel</div>
                </div>
              </div>

              {/* Price Info Row */}
              {(completedBot.buy_price || completedBot.sell_price) && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <span className="text-muted-foreground block">Einkaufspreis</span>
                    <div className="font-semibold text-foreground">
                      {completedBot.buy_price ? `${completedBot.buy_price.toFixed(4)} $` : 'N/A'}
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-muted-foreground block">Verkaufspreis</span>
                    <div className="font-semibold text-foreground">
                      {completedBot.sell_price ? `${completedBot.sell_price.toFixed(4)} $` : 'N/A'}
                    </div>
                  </div>
                </div>
              )}

              {/* Amount Info Row */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <span className="text-muted-foreground block">Startsumme</span>
                  <div className="font-semibold text-foreground">{completedBot.start_amount.toFixed(2)} €</div>
                </div>
                <div className="text-center">
                  <span className="text-muted-foreground block">Endsumme</span>
                  <div className="font-semibold text-foreground">{completedBot.current_balance.toFixed(2)} €</div>
                </div>
              </div>

              {/* Runtime */}
              <div className="text-center pt-2 border-t border-border/30">
                <span className="text-muted-foreground block text-sm">Laufzeit</span>
                <div className="font-semibold text-foreground">
                  {Math.ceil((Date.now() - new Date(completedBot.created_at).getTime()) / (1000 * 60))} Minuten
                </div>
              </div>
            </div>
          </div>

          {/* Success Message */}
          <div className="text-center space-y-3">
            <p className="text-lg font-semibold text-primary">
              {isProfit ? "Erfolgreicher Trade!" : "Trade abgeschlossen"}
            </p>
            <p className="text-sm text-muted-foreground">
              {isProfit 
                ? "Gewinn wurde deinem Konto gutgeschrieben." 
                : "Der Betrag wurde deinem Konto zurückerstattet."
              }
            </p>
          </div>

          <Button 
            onClick={() => onOpenChange(false)}
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold py-3"
            size="lg"
          >
            Verstanden
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}