import React, { createContext, useContext, useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TradingSidebar } from "./TradingSidebar";
import { TradingGuard } from "./TradingGuard";
import { BrandingProvider, useBranding } from "@/contexts/BrandingContext";
import { CoinMarketCapProvider } from "@/contexts/CoinMarketCapContext";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Context for managing dashboard-level loading states
interface DashboardLoadingContextType {
  isBalanceLoading: boolean;
  setIsBalanceLoading: (loading: boolean) => void;
  userName: string;
  setUserName: (name: string) => void;
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
  const [userName, setUserName] = useState("Trader");

  return (
    <DashboardLoadingContext.Provider value={{ 
      isBalanceLoading, 
      setIsBalanceLoading, 
      userName, 
      setUserName 
    }}>
      {children}
    </DashboardLoadingContext.Provider>
  );
}

function TradingContent() {
  const { loading: brandingLoading } = useBranding();
  const { isBalanceLoading, setIsBalanceLoading, setUserName } = useDashboardLoading();

  // Fetch user balance and name in a single request
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('balance, first_name')
            .eq('id', session.user.id)
            .single();
          
          // Set username immediately if available
          if (profile?.first_name) {
            setUserName(profile.first_name);
          }
          
          // Data loaded successfully, set loading to false
          setIsBalanceLoading(false);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Even on error, stop loading to prevent infinite loop
        setIsBalanceLoading(false);
      }
    };

    if (!isBalanceLoading) return; // Prevent multiple calls
    fetchUserData();
  }, [setIsBalanceLoading, setUserName, isBalanceLoading]);

  // Show loading spinner until both branding and balance are loaded
  const isLoading = brandingLoading || isBalanceLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-background fixed inset-0">
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