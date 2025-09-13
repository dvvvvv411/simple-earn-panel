import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TrendingUp, Trophy, DollarSign } from 'lucide-react';

interface TradingBot {
  id: string;
  cryptocurrency: string;
  symbol: string;
  start_amount: number;
  current_balance: number;
  status: string;
  created_at: string;
}

interface TradingSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  completedBot: TradingBot | null;
}

export function TradingSuccessDialog({ open, onOpenChange, completedBot }: TradingSuccessDialogProps) {
  const confettiRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (open && completedBot) {
      // Initial burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#059669', '#34d399', '#6ee7b7', '#fbbf24']
      });

      // Continuous confetti for 3 seconds
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        confetti(Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#10b981', '#059669', '#34d399']
        }));
        
        confetti(Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#fbbf24', '#f59e0b', '#d97706']
        }));
      }, 250);

      // Auto close after 10 seconds
      const autoCloseTimer = setTimeout(() => {
        onOpenChange(false);
      }, 10000);

      return () => {
        clearInterval(interval);
        clearTimeout(autoCloseTimer);
      };
    }
  }, [open, completedBot, onOpenChange]);

  if (!completedBot) return null;

  const profit = completedBot.current_balance - completedBot.start_amount;
  const profitPercentage = ((profit / completedBot.start_amount) * 100).toFixed(2);
  const isProfit = profit > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-lg border border-primary/20">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">
            🎉 Glückwunsch! 🎉
          </DialogTitle>
          
          <div className="space-y-2">
            <p className="text-lg text-muted-foreground">
              Dein <span className="font-semibold text-foreground">{completedBot.cryptocurrency}</span> Trading-Bot ist erfolgreich abgeschlossen!
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Profit Display */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-500" />
              <span className="text-sm text-muted-foreground">Gewinn</span>
            </div>
            <div className="space-y-1">
              <div className={`text-4xl font-bold ${isProfit ? 'text-emerald-500' : 'text-red-500'} drop-shadow-lg`}>
                {isProfit ? '+' : ''}{profit.toFixed(2)} €
              </div>
              <div className={`text-lg ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                ({isProfit ? '+' : ''}{profitPercentage}%)
              </div>
            </div>
          </div>

          {/* Trade Details */}
          <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 space-y-3 border border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="font-semibold">Trade Details</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Cryptocurrency:</span>
                <div className="font-semibold">{completedBot.cryptocurrency} ({completedBot.symbol})</div>
              </div>
              <div>
                <span className="text-muted-foreground">Startsumme:</span>
                <div className="font-semibold">{completedBot.start_amount.toFixed(2)} €</div>
              </div>
              <div>
                <span className="text-muted-foreground">Endsumme:</span>
                <div className="font-semibold">{completedBot.current_balance.toFixed(2)} €</div>
              </div>
              <div>
                <span className="text-muted-foreground">Laufzeit:</span>
                <div className="font-semibold">
                  {Math.ceil((Date.now() - new Date(completedBot.created_at).getTime()) / (1000 * 60))} Min
                </div>
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
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold py-3"
            size="lg"
          >
            Wow! Weiter traden 🎯
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}