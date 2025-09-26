import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { User, TrendingUp, Target, Award, Crown, Gem } from "lucide-react";

const rankingTiers = [
  {
    name: "Starter",
    minBalance: 0,
    maxBalance: 999,
    dailyTrades: 1,
    icon: User,
    color: "from-amber-500 to-amber-600",
    bgColor: "bg-amber-100",
    textColor: "text-amber-700"
  },
  {
    name: "Trader",
    minBalance: 1000,
    maxBalance: 4999,
    dailyTrades: 2,
    icon: TrendingUp,
    color: "from-gray-400 to-gray-500",
    bgColor: "bg-gray-100",
    textColor: "text-gray-700"
  },
  {
    name: "Pro-Trader",
    minBalance: 5000,
    maxBalance: 9999,
    dailyTrades: 4,
    icon: Target,
    color: "from-yellow-400 to-yellow-500",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-700"
  },
  {
    name: "Expert",
    minBalance: 10000,
    maxBalance: 49999,
    dailyTrades: 6,
    icon: Award,
    color: "from-blue-400 to-blue-500",
    bgColor: "bg-blue-100",
    textColor: "text-blue-700"
  },
  {
    name: "Elite",
    minBalance: 50000,
    maxBalance: 99999,
    dailyTrades: 8,
    icon: Crown,
    color: "from-purple-400 to-purple-500",
    bgColor: "bg-purple-100",
    textColor: "text-purple-700"
  },
  {
    name: "VIP",
    minBalance: 100000,
    maxBalance: 999999,
    dailyTrades: 10,
    icon: Gem,
    color: "from-emerald-400 to-emerald-500",
    bgColor: "bg-emerald-100",
    textColor: "text-emerald-700"
  }
];

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
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCurrentRank = () => {
    return rankingTiers.find(tier => 
      currentBalance >= tier.minBalance && currentBalance <= tier.maxBalance
    ) || rankingTiers[0];
  };

  const isRankAchieved = (rank: typeof rankingTiers[0]) => {
    return currentBalance >= rank.minBalance;
  };

  const currentRank = getCurrentRank();

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

        <div className="space-y-4">
          {rankingTiers.map((rank, index) => {
            const RankIcon = rank.icon;
            const isAchieved = isRankAchieved(rank);
            const isCurrent = rank.name === currentRank.name;
            
            return (
              <div
                key={rank.name}
                className={`relative p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
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
                
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-full bg-gradient-to-br ${rank.color} ${
                    !isAchieved && !isCurrent ? "opacity-50" : ""
                  }`}>
                    <RankIcon className="h-6 w-6 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge 
                        className={`${rank.bgColor} ${rank.textColor} hover:${rank.bgColor} ${
                          !isAchieved && !isCurrent ? "opacity-50" : ""
                        }`}
                      >
                        {rank.name}
                      </Badge>
                      {isAchieved && !isCurrent && (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </div>
                    
                    <div className={`grid grid-cols-2 gap-4 ${!isAchieved && !isCurrent ? "opacity-60" : ""}`}>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Ab {formatCurrency(rank.minBalance)}
                        </p>
                        {rank.maxBalance < 999999 && (
                          <p className="text-xs text-muted-foreground">
                            Bis {formatCurrency(rank.maxBalance)}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-primary">
                          {rank.dailyTrades} Trade{rank.dailyTrades !== 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          pro Tag
                        </p>
                      </div>
                    </div>
                  </div>
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