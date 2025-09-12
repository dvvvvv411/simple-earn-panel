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
    <Card className="bg-card/50 backdrop-blur-sm border-border/40 hover:bg-card/60 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Aktueller Rang</CardTitle>
        <Trophy className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-full ${getRankColor(rankData.currentRank)} flex items-center justify-center`}>
            <Star className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-semibold" style={{ color: 'var(--brand-accent, hsl(var(--primary)))' }}>
              {rankData.currentRank}
            </p>
            <p className="text-xs text-muted-foreground">
              Rang {rankData.position.toLocaleString('de-DE')} von {rankData.totalUsers.toLocaleString('de-DE')}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Fortschritt zu {rankData.nextRank}</span>
            <span className="font-medium">
              {rankData.currentXP.toLocaleString('de-DE')} / {rankData.nextRankXP.toLocaleString('de-DE')} XP
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="text-center p-3 bg-accent/20 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Benötigt</p>
            </div>
            <p className="text-sm font-semibold">{rankData.tradesNeeded} Trades</p>
          </div>
          
          <div className="text-center p-3 bg-accent/20 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Nächster Rang</p>
            </div>
            <Badge variant="outline" className="text-xs">
              {rankData.nextRank}
            </Badge>
          </div>
        </div>

        <div className="text-center pt-2 border-t border-border/40">
          <p className="text-xs text-muted-foreground">
            Noch {(rankData.nextRankXP - rankData.currentXP).toLocaleString('de-DE')} XP bis zum Aufstieg
          </p>
        </div>
      </CardContent>
    </Card>
  );
}