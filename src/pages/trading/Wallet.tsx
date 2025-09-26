import React from "react";
import { AccountBalanceCard } from "@/components/trading/wallet/AccountBalanceCard";
import { RankingSystemCard } from "@/components/trading/wallet/RankingSystemCard";
import { TransactionHistoryCard } from "@/components/trading/wallet/TransactionHistoryCard";
import { ReferralSystemCard } from "@/components/trading/wallet/ReferralSystemCard";

export default function Wallet() {
  return (
    <div className="flex-1 space-y-6 lg:space-y-8 xl:space-y-10 p-6 lg:p-8 xl:p-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight text-text-headline">Wallet</h1>
          <p className="text-muted-foreground text-base lg:text-lg xl:text-xl mt-2">
            Verwalten Sie Ihr Guthaben und verfolgen Sie Ihre Transaktionen
          </p>
        </div>
      </div>

      <div className="space-y-6 lg:space-y-8 xl:space-y-10">
        {/* Top Row - 3 Equal Building Block Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 xl:gap-10">
          <AccountBalanceCard className="min-h-[320px] lg:min-h-[360px] xl:min-h-[400px]" />
          <RankingSystemCard className="min-h-[320px] lg:min-h-[360px] xl:min-h-[400px]" />
          <ReferralSystemCard className="min-h-[320px] lg:min-h-[360px] xl:min-h-[400px]" />
        </div>
        
        {/* Bottom Row - Transaction History (Full Width) */}
        <TransactionHistoryCard />
      </div>
    </div>
  );
}