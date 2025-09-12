import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, Trophy } from "lucide-react";

export function WelcomeCard() {
  // Simulated streak data - in real app this would come from user data
  const currentStreak = 5;
  const weeklyGoal = 7;
  const userName = "Trader"; // This would come from user context

  return (
    <Card className="w-full bg-primary text-primary-foreground shadow-lg border-0">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Willkommen zurück, {userName}!
              </h2>
              <p className="text-white/80 text-sm">
                Bereit für einen erfolgreichen Trading-Tag?
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-white/10 rounded-lg px-4 py-2">
            <Flame className="w-5 h-5 text-orange-300" />
            <div className="text-right">
              <div className="text-lg font-bold text-white">
                {currentStreak}/{weeklyGoal}
              </div>
              <div className="text-xs text-white/70">
                Tage diese Woche
              </div>
            </div>
          </div>
        </div>
        
        {currentStreak >= weeklyGoal && (
          <div className="mt-4 p-3 bg-white/10 rounded-lg">
            <p className="text-sm text-white/90 text-center">
              🎉 Perfekte Woche! Du warst alle 7 Tage aktiv!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}