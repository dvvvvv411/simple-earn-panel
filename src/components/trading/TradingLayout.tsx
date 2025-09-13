import React, { createContext, useContext, useState } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TradingSidebar } from "./TradingSidebar";
import { TradingGuard } from "./TradingGuard";
import { BrandingProvider, useBranding } from "@/contexts/BrandingContext";
import { CoinMarketCapProvider } from "@/contexts/CoinMarketCapContext";
import { Loader2 } from "lucide-react";

// Context for managing dashboard-level loading states
interface DashboardLoadingContextType {
  isBalanceLoading: boolean;
  setIsBalanceLoading: (loading: boolean) => void;
}

const DashboardLoadingContext = createContext<DashboardLoadingContextType | undefined>(undefined);

export function useDashboardLoading() {
  const context = useContext(DashboardLoadingContext);
  if (context === undefined) {
    throw new Error('useDashboardLoading must be used within a DashboardLoadingProvider');
  }
  return context;
}

function DashboardLoadingProvider({ children }: { children: React.ReactNode }) {
  const [isBalanceLoading, setIsBalanceLoading] = useState(true);

  return (
    <DashboardLoadingContext.Provider value={{ isBalanceLoading, setIsBalanceLoading }}>
      {children}
    </DashboardLoadingContext.Provider>
  );
}

function TradingContent() {
  const { loading: brandingLoading } = useBranding();
  const { isBalanceLoading } = useDashboardLoading();

  // Show loading spinner until both branding and balance are loaded
  const isLoading = brandingLoading || isBalanceLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Trading-Dashboard wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full bg-background">
      <TradingSidebar />
      
      <div className="flex-1 flex flex-col">
        <header className="h-20 flex items-center justify-between border-b border-border bg-background px-8">
          <div className="flex items-center gap-6">
            <SidebarTrigger className="h-8 w-8" />
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-foreground">Trading Dashboard</h1>
              <p className="text-sm text-muted-foreground">Professionelles Krypto-Portfolio Management</p>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 bg-background">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export function TradingLayout() {
  return (
    <TradingGuard>
      <BrandingProvider>
        <CoinMarketCapProvider>
          <DashboardLoadingProvider>
            <SidebarProvider>
              <TradingContent />
            </SidebarProvider>
          </DashboardLoadingProvider>
        </CoinMarketCapProvider>
      </BrandingProvider>
    </TradingGuard>
  );
}