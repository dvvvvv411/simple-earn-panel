import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RankingOverviewDialog } from "./RankingOverviewDialog";
import { useUserRanking } from "@/hooks/useUserRanking";

interface RankingSystemCardProps {
  className?: string;
}

export function RankingSystemCard({ className }: RankingSystemCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const {
    balance,
    investedAmount,
    totalWealth,
    loading,
    getCurrentRank,
    getNextRank,
    formatCurrency
  } = useUserRanking();

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div>
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  const currentRank = getCurrentRank();
  const nextRank = getNextRank();
  
  if (!currentRank) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-text-headline">
            Rang-System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Keine Rang-Daten verfügbar</p>
        </CardContent>
      </Card>
    );
  }
  
  const CurrentIcon = currentRank.icon;
  
  // Calculate progress to next rank
  const progressPercentage = nextRank 
    ? ((totalWealth - currentRank.minBalance) / (nextRank.minBalance - currentRank.minBalance)) * 100
    : 100;

  const amountToNextRank = nextRank ? nextRank.minBalance - totalWealth : 0;

  return (
    <Card className={`${className} border-primary/20`}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-text-headline">
          Rang-System
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Rank */}
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full bg-gradient-to-br ${currentRank.color}`}>
            <CurrentIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className={`${currentRank.bgColor} ${currentRank.textColor} hover:${currentRank.bgColor}`}>
                {currentRank.name}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {currentRank.dailyTrades} Trade{currentRank.dailyTrades !== 1 ? 's' : ''} pro Tag verfügbar
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Gesamtvermögen: {formatCurrency(balance)} + {formatCurrency(investedAmount)} = {formatCurrency(totalWealth)}
            </p>
          </div>
        </div>

        {/* Progress to Next Rank */}
        {nextRank && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Fortschritt zu {nextRank.name}</span>
              <span className="text-sm text-muted-foreground">
                {Math.min(progressPercentage, 100).toFixed(0)}%
              </span>
            </div>
            <Progress 
              value={Math.min(progressPercentage, 100)} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              Noch {formatCurrency(amountToNextRank)} bis zum nächsten Rang
            </p>
          </div>
        )}

        {/* Compact Next Rank Info */}
        {nextRank && (
          <div className="bg-secondary/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-headline">Nächster Rang</span>
              <span className="text-xs text-muted-foreground">
                {Math.min(progressPercentage, 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <nextRank.icon className="h-4 w-4 text-primary" />
              <span className="font-medium text-primary">{nextRank.name}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{nextRank.dailyTrades} Trades/Tag</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Noch {formatCurrency(amountToNextRank)}
            </p>
          </div>
        )}

        {/* Show All Ranks Button */}
        <Button 
          onClick={() => setDialogOpen(true)}
          className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
        >
          Alle Ränge anzeigen
        </Button>
      </CardContent>

      <RankingOverviewDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        currentBalance={totalWealth}
      />
    </Card>
  );
}