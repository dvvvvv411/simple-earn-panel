import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useRankingTiers } from "@/hooks/useRankingTiers";

interface RankingOverviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance: number;
}

export function RankingOverviewDialog({ 
  open, 
  onOpenChange, 
  currentBalance 
}: RankingOverviewDialogProps) {
  const { tiers, loading } = useRankingTiers();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCurrentRank = () => {
    return tiers.find(tier => 
      currentBalance >= tier.minBalance && currentBalance <= tier.maxBalance
    ) || tiers[0];
  };

  const isRankAchieved = (rank: typeof tiers[0]) => {
    return currentBalance >= rank.minBalance;
  };

  const currentRank = getCurrentRank();

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto rounded-xl">
          <DialogHeader className="text-center pb-6">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Rang-System Übersicht
            </DialogTitle>
            <p className="text-muted-foreground mt-2">Lädt...</p>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto rounded-xl">
        <DialogHeader className="text-center pb-6">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Rang-System Übersicht
          </DialogTitle>
          <p className="text-muted-foreground mt-2">
            Erreichen Sie höhere Ränge und erhalten Sie mehr Trading-Möglichkeiten
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tiers.map((rank, index) => {
            const RankIcon = rank.icon;
            const isAchieved = isRankAchieved(rank);
            const isCurrent = rank.name === currentRank.name;
            
            return (
              <div
                key={rank.name}
                className={`relative p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                  isCurrent 
                    ? "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20" 
                    : isAchieved
                    ? "border-green-200 bg-green-50/50"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                {isCurrent && (
                  <div className="absolute -top-2 -right-2">
                    <Badge className="bg-primary text-primary-foreground text-xs font-semibold">
                      Aktuell
                    </Badge>
                  </div>
                )}
                
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={`p-4 rounded-full bg-gradient-to-br ${rank.color} ${
                    !isAchieved && !isCurrent ? "opacity-50" : ""
                  }`}>
                    <RankIcon className="h-8 w-8 text-white" />
                  </div>
                  
                  <div>
                    <Badge 
                      className={`${rank.bgColor} ${rank.textColor} hover:${rank.bgColor} mb-2 ${
                        !isAchieved && !isCurrent ? "opacity-50" : ""
                      }`}
                    >
                      {rank.name}
                    </Badge>
                    
                    <div className={`space-y-2 ${!isAchieved && !isCurrent ? "opacity-60" : ""}`}>
                      <p className="text-sm font-medium text-foreground">
                        Ab {formatCurrency(rank.minBalance)}
                      </p>
                      {rank.maxBalance < 999999 && (
                        <p className="text-xs text-muted-foreground">
                          Bis {formatCurrency(rank.maxBalance)}
                        </p>
                      )}
                      <div className="pt-2 border-t border-border/50">
                        <p className="text-sm font-medium text-primary">
                          {rank.dailyTrades} Trade{rank.dailyTrades !== 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          pro Tag
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {isAchieved && !isCurrent && (
                    <div className="absolute bottom-2 right-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
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