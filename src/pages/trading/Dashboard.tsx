import React from "react";
import { AccountBalanceCard } from "@/components/trading/AccountBalanceCard";
import { TradesCard } from "@/components/trading/TradesCard";
import { RankCard } from "@/components/trading/RankCard";
import { MarketOverviewCard } from "@/components/trading/MarketOverviewCard";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Willkommen zurück! Hier ist eine Übersicht über Ihr Trading-Portfolio.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
        <AccountBalanceCard />
        <TradesCard />
        <RankCard />
        <MarketOverviewCard />
      </div>

      <div className="mt-8 p-4 bg-accent/10 rounded-lg border border-border/40">
        <h3 className="text-sm font-medium text-foreground mb-2">
          📊 Trading-Bot in Entwicklung
        </h3>
        <p className="text-xs text-muted-foreground">
          Unser KI-gestützter Trading-Bot befindet sich noch in der Entwicklung. 
          Bald können Sie automatisierte Trades basierend auf Marktanalysen durchführen.
          Alle aktuellen Daten sind Platzhalter und werden durch echte Trading-Metriken ersetzt.
        </p>
      </div>
    </div>
  );
}