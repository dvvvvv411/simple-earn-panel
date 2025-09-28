import React from "react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
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
      <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
        <ResponsiveDialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto rounded-xl">
          <ResponsiveDialogHeader className="text-center pb-6">
            <ResponsiveDialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Rang-System Übersicht
            </ResponsiveDialogTitle>
            <p className="text-muted-foreground mt-2">Lädt...</p>
          </ResponsiveDialogHeader>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    );
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-4xl sm:max-h-[80vh] sm:overflow-y-auto rounded-xl">
        <ResponsiveDialogHeader className="text-center pb-8 sm:pb-6 p-8 sm:p-6">
          <ResponsiveDialogTitle className="text-2xl sm:text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Rang-System Übersicht
          </ResponsiveDialogTitle>
          <p className="text-lg sm:text-base text-muted-foreground mt-3 sm:mt-2">
            Erreichen Sie höhere Ränge und erhalten Sie mehr Trading-Möglichkeiten
          </p>
        </ResponsiveDialogHeader>

        <div className="flex-1 px-8 sm:px-6 overflow-y-auto">
          <div className="grid grid-cols-1 gap-8 sm:gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {tiers.map((rank, index) => {
              const RankIcon = rank.icon;
              const isAchieved = isRankAchieved(rank);
              const isCurrent = rank.name === currentRank.name;
              
              return (
                <div
                  key={rank.name}
                  className={`relative p-8 sm:p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                    isCurrent 
                      ? "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20" 
                      : isAchieved
                      ? "border-green-200 bg-green-50/50"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute -top-3 -right-3 sm:-top-2 sm:-right-2">
                      <Badge className="bg-primary text-primary-foreground text-sm sm:text-xs font-semibold">
                        Aktuell
                      </Badge>
                    </div>
                  )}
                  
                  <div className="flex flex-col items-center text-center space-y-6 sm:space-y-4">
                    <div className={`p-6 sm:p-4 rounded-full bg-gradient-to-br ${rank.color} ${
                      !isAchieved && !isCurrent ? "opacity-50" : ""
                    }`}>
                      <RankIcon className="h-12 w-12 sm:h-8 sm:w-8 text-white" />
                    </div>
                    
                    <div>
                      <Badge 
                        className={`${rank.bgColor} ${rank.textColor} hover:${rank.bgColor} mb-3 sm:mb-2 text-sm sm:text-xs ${
                          !isAchieved && !isCurrent ? "opacity-50" : ""
                        }`}
                      >
                        {rank.name}
                      </Badge>
                      
                      <div className={`space-y-3 sm:space-y-2 ${!isAchieved && !isCurrent ? "opacity-60" : ""}`}>
                        <p className="text-base sm:text-sm font-medium text-foreground">
                          Ab {formatCurrency(rank.minBalance)}
                        </p>
                        {rank.maxBalance < 999999 && (
                          <p className="text-sm sm:text-xs text-muted-foreground">
                            Bis {formatCurrency(rank.maxBalance)}
                          </p>
                        )}
                        <div className="pt-3 sm:pt-2 border-t border-border/50">
                          <p className="text-base sm:text-sm font-medium text-primary">
                            {rank.dailyTrades} Trade{rank.dailyTrades !== 1 ? 's' : ''}
                          </p>
                          <p className="text-sm sm:text-xs text-muted-foreground">
                            pro Tag
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {isAchieved && !isCurrent && (
                      <div className="absolute bottom-3 right-3 sm:bottom-2 sm:right-2">
                        <div className="w-4 h-4 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-8 sm:p-6 border-t text-center">
          <p className="text-lg sm:text-sm text-muted-foreground">
            Ihr aktuelles Guthaben: {formatCurrency(currentBalance)}
          </p>
          <p className="text-base sm:text-xs text-muted-foreground mt-2 sm:mt-1">
            Erhöhen Sie Ihr Guthaben, um höhere Ränge zu erreichen
          </p>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}