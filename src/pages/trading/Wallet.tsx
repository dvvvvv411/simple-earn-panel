import React from "react";
import { AccountBalanceCard } from "@/components/trading/wallet/AccountBalanceCard";
import { RankingSystemCard } from "@/components/trading/wallet/RankingSystemCard";
import { TransactionHistoryCard } from "@/components/trading/wallet/TransactionHistoryCard";
import { ReferralSystemCard } from "@/components/trading/wallet/ReferralSystemCard";
import { WalletStatisticsCard } from "@/components/trading/wallet/WalletStatisticsCard";

export default function Wallet() {
  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-headline">Wallet</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihr Guthaben und verfolgen Sie Ihre Transaktionen
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Row - Account Balance & Ranking */}
        <AccountBalanceCard />
        <RankingSystemCard />
        
        {/* Middle Row - Referral & Statistics */}
        <ReferralSystemCard />
        <WalletStatisticsCard />
        
        {/* Bottom Row - Transaction History (Full Width) */}
        <div className="lg:col-span-2">
          <TransactionHistoryCard />
        </div>
      </div>
    </div>
  );
}