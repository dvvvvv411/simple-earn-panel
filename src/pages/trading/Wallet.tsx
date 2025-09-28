import React from "react";
import { AccountBalanceCard } from "@/components/trading/wallet/AccountBalanceCard";
import { RankingSystemCard } from "@/components/trading/wallet/RankingSystemCard";
import { TransactionHistoryCard } from "@/components/trading/wallet/TransactionHistoryCard";
import { ReferralSystemCard } from "@/components/trading/wallet/ReferralSystemCard";

export default function Wallet() {
  return (
    <div className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-headline">Wallet</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihr Guthaben und verfolgen Sie Ihre Transaktionen
          </p>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Top Row - 3 Equal Building Block Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <AccountBalanceCard className="min-h-[240px] sm:min-h-[280px]" />
          <RankingSystemCard className="min-h-[240px] sm:min-h-[280px]" />
          <ReferralSystemCard className="min-h-[240px] sm:min-h-[280px]" />
        </div>
        
        {/* Bottom Row - Transaction History (Full Width) */}
        <TransactionHistoryCard />
      </div>
    </div>
  );
}