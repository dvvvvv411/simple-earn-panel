import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Flame, Trophy, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StreakDayItem } from './StreakDayItem';
import type { StreakDay } from '@/hooks/useWeeklyLoginStreak';
import confetti from 'canvas-confetti';

type AnimationPhase = 
  | 'idle'
  | 'spotlight'
  | 'revealing'
  | 'celebrating'
  | 'holding'
  | 'exiting';

interface LoginStreakAnimationProps {
  streakDays: StreakDay[];
  currentStreak: number;
  currentDayInCycle: number;
  newFreeBotEarned: boolean;
  userName: string;
  onComplete: () => void;
}

export function LoginStreakAnimation({
  streakDays,
  currentStreak,
  currentDayInCycle,
  newFreeBotEarned,
  userName,
  onComplete,
}: LoginStreakAnimationProps) {
  const [phase, setPhase] = useState<AnimationPhase>('idle');
  const [revealedDays, setRevealedDays] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const hasTriggeredConfetti = useRef(false);

  // Start animation sequence
  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase('spotlight');
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Animation phase progression
  useEffect(() => {
    let timer: NodeJS.Timeout;

    switch (phase) {
      case 'spotlight':
        // Wait for spotlight to fade in, then start revealing
        timer = setTimeout(() => setPhase('revealing'), 800);
        break;
      
      case 'revealing':
        // Reveal days one by one
        if (revealedDays < Math.min(currentDayInCycle, 7)) {
          timer = setTimeout(() => {
            setRevealedDays(prev => prev + 1);
          }, 300);
        } else {
          // All days revealed, check for celebration
          timer = setTimeout(() => {
            if (newFreeBotEarned) {
              setPhase('celebrating');
            } else {
              setPhase('holding');
            }
          }, 500);
        }
        break;
      
      case 'celebrating':
        // Fire confetti and show celebration
        if (!hasTriggeredConfetti.current) {
          hasTriggeredConfetti.current = true;
          setShowCelebration(true);
          
          // Fire confetti
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#fbbf24', '#f59e0b', '#d97706', 'hsl(var(--primary))'],
          });
        }
        timer = setTimeout(() => setPhase('holding'), 2000);
        break;
      
      case 'holding':
        // Hold for viewing, then exit
        timer = setTimeout(() => setPhase('exiting'), 2000);
        break;
      
      case 'exiting':
        // Fade out and complete
        timer = setTimeout(() => onComplete(), 600);
        break;
    }

    return () => clearTimeout(timer);
  }, [phase, revealedDays, currentDayInCycle, newFreeBotEarned, onComplete]);

  const handleSkip = useCallback(() => {
    setPhase('exiting');
  }, []);

  const content = (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center transition-all duration-500",
        phase === 'idle' ? "opacity-0" : "opacity-100",
        phase === 'exiting' && "opacity-0"
      )}
    >
      {/* Dark overlay with spotlight effect */}
      <div 
        className={cn(
          "absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-500",
          phase === 'idle' ? "opacity-0" : "opacity-100",
          phase === 'exiting' && "opacity-0"
        )}
        onClick={handleSkip}
      />

      {/* Skip button */}
      <button
        onClick={handleSkip}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      {/* Main animation card */}
      <div
        className={cn(
          "relative z-10 w-[95vw] max-w-lg bg-gradient-to-br from-card via-card to-card/95 rounded-2xl shadow-2xl border border-border/50 overflow-hidden transition-all duration-700",
          phase === 'idle' && "scale-90 opacity-0",
          phase === 'spotlight' && "scale-100 opacity-100",
          phase === 'exiting' && "scale-95 opacity-0"
        )}
      >
        {/* Decorative gradient border */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-amber-500/20 pointer-events-none" />
        
        {/* Header */}
        <div className="relative p-6 pb-4 text-center border-b border-border/30">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Flame className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">
              Login-Streak
            </h2>
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Willkommen zurück, <span className="font-semibold text-foreground">{userName}</span>!
          </p>
        </div>

        {/* Streak days visualization */}
        <div className="p-6 pt-8">
          <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
            {streakDays.slice(0, 7).map((day, index) => (
              <StreakDayItem
                key={day.dayNumber}
                day={day}
                isRevealed={phase !== 'idle' && phase !== 'spotlight' && revealedDays >= index + 1}
                animationDelay={index * 100}
              />
            ))}
          </div>
        </div>

        {/* Streak counter */}
        <div className="px-6 pb-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
            <Flame className="w-4 h-4 text-primary" />
            <span className="text-lg font-bold text-primary">
              {currentStreak} {currentStreak === 1 ? 'Tag' : 'Tage'} Streak
            </span>
          </div>
        </div>

        {/* Free bot celebration */}
        {showCelebration && (
          <div className="px-6 pb-6 animate-fade-in">
            <div className="p-4 bg-gradient-to-r from-amber-500/20 via-amber-400/20 to-orange-500/20 rounded-xl border border-amber-500/30 text-center">
              <p className="text-lg font-bold text-amber-500">
                🎉 +1 Free Bot freigeschaltet!
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Jeden 3. Login-Tag erhältst du einen Free Bot!
              </p>
            </div>
          </div>
        )}

        {/* Progress indicator */}
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Tag {currentDayInCycle} von 7</span>
            <span>Nächster Free Bot: Tag {currentDayInCycle < 3 ? 3 : currentDayInCycle < 6 ? 6 : 'im nächsten Zyklus'}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-amber-500 rounded-full transition-all duration-1000"
              style={{ width: `${(currentDayInCycle / 7) * 100}%` }}
            />
          </div>
        </div>

        {/* Tap to continue hint */}
        <div className="px-6 pb-4 text-center">
          <p className="text-xs text-muted-foreground animate-pulse">
            Tippe zum Überspringen
          </p>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
