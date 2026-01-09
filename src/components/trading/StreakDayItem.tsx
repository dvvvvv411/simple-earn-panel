import React from 'react';
import { Check, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StreakDay } from '@/hooks/useWeeklyLoginStreak';

interface StreakDayItemProps {
  day: StreakDay;
  isRevealed: boolean;
  animationDelay: number;
}

export function StreakDayItem({ day, isRevealed, animationDelay }: StreakDayItemProps) {
  const isFreeBotDay = day.grantsFreeBot;
  const isActive = day.isLoggedIn && isRevealed;
  const isFuture = day.isFuture || (!day.isLoggedIn && !day.isToday);
  
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 transition-all duration-500",
        isRevealed ? "opacity-100 scale-100" : "opacity-60 scale-90"
      )}
      style={{
        transitionDelay: `${animationDelay}ms`,
      }}
    >
      {/* Day circle */}
      <div
        className={cn(
          "relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-500 border-2",
          // Active logged in day
          isActive && !isFreeBotDay && "bg-primary/20 border-primary text-primary",
          // Free bot day (active)
          isActive && isFreeBotDay && "bg-gradient-to-br from-amber-400 to-orange-500 border-amber-400 text-white animate-free-bot-glow",
          // Today (current, not yet revealed or pending)
          day.isToday && !isActive && "border-primary/50 border-dashed bg-primary/5",
          // Future/not logged in
          isFuture && !day.isToday && "border-muted-foreground/50 border-dashed bg-muted/40 text-muted-foreground/70",
          // Free bot indicator for future days
          isFuture && isFreeBotDay && "border-amber-400/50"
        )}
      >
        {/* Inner content */}
        {isActive ? (
          isFreeBotDay ? (
            <Bot className="w-5 h-5 sm:w-6 sm:h-6" />
          ) : (
            <Check className="w-5 h-5 sm:w-6 sm:h-6" />
          )
        ) : isFreeBotDay ? (
          <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400/50" />
        ) : (
          <span className="text-sm font-medium">{day.dayNumber}</span>
        )}

        {/* Today indicator ring */}
        {day.isToday && (
          <div className="absolute inset-0 rounded-full border-2 border-primary animate-pulse-ring" />
        )}
        
        {/* Free bot glow effect - subtle pulse instead of ping */}
        {isActive && isFreeBotDay && (
          <div className="absolute inset-0 rounded-full bg-amber-400/10 animate-pulse" />
        )}
      </div>

      {/* Day name */}
      <span
        className={cn(
          "text-xs font-medium transition-colors duration-300",
          isActive ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {day.dayName}
      </span>

      {/* Free Bot label */}
      {isFreeBotDay && (
        <span
          className={cn(
            "text-[10px] font-bold uppercase tracking-wide transition-all duration-300",
            isActive 
              ? "text-amber-500" 
              : "text-amber-400/40"
          )}
        >
          +1 Bot
        </span>
      )}
    </div>
  );
}
