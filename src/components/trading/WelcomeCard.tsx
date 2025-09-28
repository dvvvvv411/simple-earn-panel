import React, { useContext } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, Trophy } from "lucide-react";
import { useDashboardLoading } from "./TradingLayout";
import { useLoginStats } from "@/hooks/useLoginStats";

export function WelcomeCard() {
  // Use the hooks
  const { userName } = useDashboardLoading();
  const { loginStats, loading: loginLoading } = useLoginStats();
  
  // Use real data from login stats, fallback to 0 if loading
  const currentStreak = loginLoading ? 0 : loginStats.currentStreak;
  const weeklyGoal = loginStats.weeklyGoal;

  const animationStyles = {
    floating: {
      animation: '6s ease-in-out infinite floating',
    },
    floatingDelayed: {
      animation: '8s ease-in-out infinite 2s floating-delayed',
    },
    shimmer: {
      animation: '3s linear infinite shimmer',
    },
    pulseGlow: {
      animation: '4s ease-in-out infinite pulse-glow',
    },
    particleFloat: {
      animation: '5s ease-in-out infinite particle-float',
    },
    particleFloatDelayed: {
      animation: '7s ease-in-out infinite 1s particle-float-delayed',
    },
    particleFloatSlow: {
      animation: '9s ease-in-out infinite 3s particle-float-slow',
    },
  };

  return (
    <>
      <style>{`
        @keyframes floating {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes floating-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-3deg); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        @keyframes particle-float {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
          25% { transform: translateY(-10px) translateX(5px); opacity: 0.6; }
          75% { transform: translateY(-5px) translateX(-3px); opacity: 0.4; }
        }
        @keyframes particle-float-delayed {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.4; }
          33% { transform: translateY(-8px) translateX(-4px); opacity: 0.7; }
          66% { transform: translateY(-12px) translateX(6px); opacity: 0.5; }
        }
        @keyframes particle-float-slow {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.2; }
          50% { transform: translateY(-18px) translateX(8px); opacity: 0.6; }
        }
      `}</style>
      
      <Card className="relative w-full overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-primary via-primary/95 to-primary/80">
        {/* Animated Background Layers */}
        <div className="absolute inset-0">
          {/* Floating Bubbles */}
          <div 
            className="absolute top-6 left-12 w-24 h-24 bg-white/10 rounded-full blur-sm"
            style={animationStyles.floating}
          ></div>
          <div 
            className="absolute bottom-8 right-16 w-20 h-20 bg-white/15 rounded-full blur-sm"
            style={animationStyles.floatingDelayed}
          ></div>
          <div 
            className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/8 rounded-full blur-sm"
            style={animationStyles.floating}
          ></div>
          
          {/* Shimmer Overlay */}
          <div className="absolute inset-0 overflow-hidden">
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full skew-x-12"
              style={animationStyles.shimmer}
            ></div>
          </div>
          
          {/* Particle Dots */}
          <div className="absolute inset-0 opacity-40">
            <div 
              className="absolute top-1/4 left-1/6 w-2 h-2 bg-white/60 rounded-full"
              style={animationStyles.particleFloat}
            ></div>
            <div 
              className="absolute top-3/4 left-3/4 w-1.5 h-1.5 bg-white/50 rounded-full"
              style={animationStyles.particleFloatDelayed}
            ></div>
            <div 
              className="absolute top-1/2 right-1/4 w-2.5 h-2.5 bg-white/40 rounded-full"
              style={animationStyles.particleFloatSlow}
            ></div>
            <div 
              className="absolute bottom-1/4 left-1/2 w-1 h-1 bg-white/70 rounded-full"
              style={animationStyles.particleFloat}
            ></div>
            <div 
              className="absolute top-1/6 right-1/3 w-1.5 h-1.5 bg-white/45 rounded-full"
              style={animationStyles.particleFloatDelayed}
            ></div>
          </div>
          
          {/* Gradient Overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        </div>

        <CardContent className="relative z-10 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg"
                style={animationStyles.pulseGlow}
              >
                <Trophy className="w-6 h-6 text-white drop-shadow-sm" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white drop-shadow-sm">
                  Willkommen zurück, {userName}!
                </h2>
                <p className="text-white/80 text-sm drop-shadow-sm">
                  Bereit für einen erfolgreichen Trading-Tag?
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border border-white/20">
              <Flame 
                className="w-5 h-5 text-white drop-shadow-sm"
                style={animationStyles.pulseGlow}
              />
              <div className="text-right">
                <div className="text-lg font-bold text-white drop-shadow-sm">
                  {currentStreak}/{weeklyGoal}
                </div>
                <div className="text-xs text-white/70 drop-shadow-sm">
                  Tage diese Woche
                </div>
              </div>
            </div>
          </div>
          
          {currentStreak >= weeklyGoal && (
            <div className="mt-4 p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 shadow-lg">
              <p className="text-sm text-white/90 text-center drop-shadow-sm">
                🎉 Perfekte Woche! Du warst alle 7 Tage aktiv!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}