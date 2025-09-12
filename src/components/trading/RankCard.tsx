import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Target } from "lucide-react";

export function RankCard() {
  // Placeholder data - will be replaced with real ranking system later
  const rankData = {
    currentRank: "Gold Tier",
    position: 247,
    totalUsers: 1847,
    nextRank: "Platinum",
    currentXP: 8450,
    nextRankXP: 10000,
    tradesNeeded: 15
  };

  const progressPercentage = (rankData.currentXP / rankData.nextRankXP) * 100;

  const getRankColor = (rank: string) => {
    switch (rank.toLowerCase()) {
      case "gold tier":
        return "bg-yellow-500";
      case "platinum":
        return "bg-gray-400";
      case "diamond":
        return "bg-blue-500";
      default:
        return "bg-primary";
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          Aktueller Rang
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <Trophy className="h-8 w-8" style={{ color: 'hsl(var(--brand-accent, var(--primary)))' }} />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{rankData.currentRank}</p>
            <p className="text-muted-foreground">
              Rang {rankData.position.toLocaleString('de-DE')} von {rankData.totalUsers.toLocaleString('de-DE')}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fortschritt zu {rankData.nextRank}:</span>
            <span className="font-semibold text-foreground">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
          <p className="text-sm text-muted-foreground">
            Noch {rankData.tradesNeeded} erfolgreiche Trades erforderlich
          </p>
        </div>

        <div className="pt-4 border-t border-border">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-2xl font-bold text-foreground">{rankData.currentXP.toLocaleString('de-DE')}</p>
              <p className="text-sm text-muted-foreground">Aktuelle Erfahrung</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{rankData.nextRankXP.toLocaleString('de-DE')}</p>
              <p className="text-sm text-muted-foreground">Benötigt für Aufstieg</p>
            </div>
          </div>
        </div>

        <div className="pt-4 bg-muted/30 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5" style={{ color: 'hsl(var(--brand-accent, var(--primary)))' }} />
            <span className="font-medium text-foreground">Top 15% Performance</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}