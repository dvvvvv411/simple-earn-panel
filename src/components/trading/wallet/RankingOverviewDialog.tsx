import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type RankingTier } from "@/hooks/useRankingTiers";
import * as Icons from "lucide-react";

const getIconComponent = (iconName: string) => {
  const IconComponent = (Icons as any)[iconName];
  return IconComponent || Icons.User;
};

interface RankingOverviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance: number;
  tiers: RankingTier[];
}

export function RankingOverviewDialog({ 
  open, 
  onOpenChange, 
  currentBalance,
  tiers 
}: RankingOverviewDialogProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getCurrentRank = () => {
    return tiers.find(tier => 
      currentBalance >= tier.min_balance && currentBalance <= tier.max_balance
    );
  };

  const isRankAchieved = (rank: RankingTier) => {
    return currentBalance >= rank.min_balance;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Rang-System Übersicht
          </DialogTitle>
          <p className="text-muted-foreground text-center">
            Erreichen Sie höhere Ränge und erhalten Sie mehr Trading-Möglichkeiten
          </p>
        </DialogHeader>

        <div className="grid gap-4 max-h-96 overflow-y-auto">
          {tiers.map((rank, index) => {
            const IconComponent = getIconComponent(rank.icon_name);
            const isCurrent = getCurrentRank()?.name === rank.name;
            const isAchieved = isRankAchieved(rank);
            
            return (
              <Card
                key={rank.name}
                className={cn(
                  "p-4 transition-all duration-200",
                  isCurrent && "ring-2 ring-primary",
                  isAchieved ? "opacity-100" : "opacity-60",
                  !isAchieved && "grayscale"
                )}
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="flex items-center justify-center w-10 h-10 rounded-full"
                    style={{
                      background: `linear-gradient(135deg, ${rank.gradient_from}, ${rank.gradient_to})`
                    }}
                  >
                    <IconComponent className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={cn("font-semibold", rank.text_color)}>
                        {rank.name}
                      </h4>
                      {isCurrent && (
                        <Badge variant="default" className="text-xs">
                          Aktuell
                        </Badge>
                      )}
                      {isAchieved && !isCurrent && (
                        <Badge variant="secondary" className="text-xs">
                          ✓ Erreicht
                        </Badge>
                      )}
                      {!isAchieved && (
                        <Badge variant="outline" className="text-xs">
                          🔒 Gesperrt
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {formatCurrency(rank.min_balance)} - {
                          rank.max_balance >= 99999999 
                            ? "∞" 
                            : formatCurrency(rank.max_balance)
                        }
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {rank.daily_trades} Trades/Tag
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-secondary/30 rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            Ihr aktuelles Guthaben: {formatCurrency(currentBalance)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Erhöhen Sie Ihr Guthaben, um höhere Ränge zu erreichen
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}