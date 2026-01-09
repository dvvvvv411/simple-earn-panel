import React, { useRef, useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, Trophy, X } from "lucide-react";
import { useDashboardLoading } from "./TradingLayout";
import { useWeeklyLoginStreak } from "@/hooks/useWeeklyLoginStreak";
import { StreakDayItem } from "./StreakDayItem";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

type AnimationPhase = 'idle' | 'moving' | 'expanded' | 'returning';

export function WelcomeCard() {
  const { userName } = useDashboardLoading();
  const cardRef = useRef<HTMLDivElement>(null);
  const placeholderRef = useRef<HTMLDivElement>(null);
  
  const {
    currentStreak,
    streakDays,
    currentDayInCycle,
    newFreeBotEarned,
    loading,
    shouldShowAnimation,
    markAnimationShown,
  } = useWeeklyLoginStreak();

  const [isAnimating, setIsAnimating] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('idle');
  const [revealedDays, setRevealedDays] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [originalRect, setOriginalRect] = useState<DOMRect | null>(null);

  // Start animation when shouldShowAnimation becomes true
  useEffect(() => {
    if (shouldShowAnimation && !isAnimating && cardRef.current && streakDays.length > 0) {
      const rect = cardRef.current.getBoundingClientRect();
      setOriginalRect(rect);
      setIsAnimating(true);
      
      // Small delay then start moving
      setTimeout(() => {
        setAnimationPhase('moving');
      }, 100);
      
      // After moving, expand
      setTimeout(() => {
        setAnimationPhase('expanded');
      }, 800);
    }
  }, [shouldShowAnimation, isAnimating, streakDays.length]);

  // Reveal days one by one
  useEffect(() => {
    if (animationPhase === 'expanded' && revealedDays < Math.min(currentDayInCycle, 7)) {
      const timer = setTimeout(() => {
        const nextDay = revealedDays + 1;
        setRevealedDays(nextDay);
        
        // Check if this revealed day is a free bot day and it's today
        const revealedStreakDay = streakDays[nextDay - 1];
        if (revealedStreakDay?.grantsFreeBot && revealedStreakDay?.isToday && newFreeBotEarned) {
          setTimeout(() => {
            confetti({
              particleCount: 150,
              spread: 80,
              origin: { y: 0.5 },
              colors: ['#fbbf24', '#f59e0b', '#d97706', '#ffffff'],
            });
            setShowCelebration(true);
          }, 200);
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [animationPhase, revealedDays, currentDayInCycle, streakDays, newFreeBotEarned]);

  const handleClose = useCallback(() => {
    setAnimationPhase('returning');
    
    setTimeout(() => {
      setIsAnimating(false);
      setAnimationPhase('idle');
      setRevealedDays(0);
      setShowCelebration(false);
      markAnimationShown();
    }, 600);
  }, [markAnimationShown]);

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

  // Calculate styles based on animation phase
  const getCardStyle = (): React.CSSProperties => {
    if (!isAnimating || animationPhase === 'idle') {
      return {};
    }

    if (animationPhase === 'returning' && originalRect) {
      return {
        position: 'fixed',
        top: originalRect.top,
        left: originalRect.left,
        width: originalRect.width,
        height: originalRect.height,
        zIndex: 100,
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
      };
    }

    if (animationPhase === 'moving' || animationPhase === 'expanded') {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(90vw, 550px)',
        zIndex: 100,
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
      };
    }

    return {};
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

      {/* Dark Overlay - only during animation */}
      {isAnimating && animationPhase !== 'idle' && animationPhase !== 'returning' && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99] transition-opacity duration-500"
          onClick={handleClose}
        />
      )}

      {/* Placeholder to maintain layout when card is fixed positioned */}
      {isAnimating && originalRect && (
        <div 
          ref={placeholderRef}
          style={{ 
            width: originalRect.width, 
            height: originalRect.height,
          }} 
        />
      )}
      
      <Card 
        ref={cardRef}
        className="relative w-full overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-primary via-primary/95 to-primary/80"
        style={getCardStyle()}
      >
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
          {/* Close button during animation */}
          {isAnimating && animationPhase === 'expanded' && (
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          )}

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
                  {animationPhase === 'expanded' 
                    ? 'Deine Login-Streak Übersicht'
                    : 'Bereit für einen erfolgreichen Trading-Tag?'
                  }
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
                  {loading ? '...' : `${currentStreak} ${currentStreak === 1 ? 'Tag' : 'Tage'}`}
                </div>
                <div className="text-xs text-white/70 drop-shadow-sm">
                  Login-Streak
                </div>
              </div>
            </div>
          </div>
          
          {/* Expanded Streak View - only during animation */}
          {animationPhase === 'expanded' && streakDays.length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/20 animate-fade-in">
              {/* Streak Days */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap mb-6">
                {streakDays.slice(0, 7).map((day, index) => (
                  <StreakDayItem
                    key={day.dayNumber}
                    day={day}
                    isRevealed={revealedDays >= index + 1}
                    animationDelay={index * 50}
                  />
                ))}
              </div>

              {/* Free Bot Info */}
              <div className="text-center mb-4">
                <p className="text-white/70 text-sm">
                  🤖 Free Bot an Tag 3 und 6 jeder Streak-Woche
                </p>
              </div>
              
              {/* Free Bot Celebration */}
              {showCelebration && (
                <div className="p-4 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-xl border border-amber-500/40 text-center mb-4 animate-fade-in">
                  <p className="text-lg font-bold text-white flex items-center justify-center gap-2">
                    🎉 +1 Free Bot freigeschaltet!
                  </p>
                  <p className="text-amber-200/80 text-sm mt-1">
                    Du hast jetzt einen kostenlosen Bot zur Verfügung
                  </p>
                </div>
              )}
              
              {/* Continue Button */}
              <Button
                onClick={handleClose}
                className="w-full py-3 bg-white/20 hover:bg-white/30 border border-white/30 text-white font-semibold transition-all"
                variant="ghost"
              >
                ✓ Weiter zum Dashboard
              </Button>
            </div>
          )}
          
          {/* Normal streak message - only when not animating and streak >= 7 */}
          {!isAnimating && currentStreak >= 7 && (
            <div className="mt-4 p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 shadow-lg">
              <p className="text-sm text-white/90 text-center drop-shadow-sm">
                🔥 Unglaublich! {currentStreak} Tage in Folge!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
