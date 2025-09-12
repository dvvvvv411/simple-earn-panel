import React from "react";
import { AccountBalanceCard } from "@/components/trading/AccountBalanceCard";
import { TradesCard } from "@/components/trading/TradesCard";
import { MarketOverviewCard } from "@/components/trading/MarketOverviewCard";

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-foreground">Trading Dashboard</h1>
        <p className="text-lg text-muted-foreground">
          Willkommen zurück! Hier ist eine Übersicht über Ihr Trading-Portfolio.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <AccountBalanceCard />
        <TradesCard />
        <MarketOverviewCard />
      </div>

      <div className="mt-12 p-6 bg-muted/30 rounded-xl border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-3">
          Trading-Bot in Entwicklung
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          Unser KI-gestützter Trading-Bot befindet sich derzeit in der Entwicklungsphase. 
          In Kürze können Sie automatisierte Trades basierend auf fortschrittlichen Marktanalysen durchführen.
          Alle aktuell angezeigten Daten sind Platzhalter und werden durch echte Trading-Metriken ersetzt.
        </p>
      </div>
    </div>
  );
}