import React, { createContext, useContext, useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TradingSidebar } from "./TradingSidebar";
import { TradingGuard } from "./TradingGuard";
import { BrandingProvider, useBranding } from "@/contexts/BrandingContext";
import { CoinMarketCapProvider } from "@/contexts/CoinMarketCapContext";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { useKYCStatus } from "@/hooks/useKYCStatus";
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

export function DashboardLoadingProvider({ children }: { children: React.ReactNode }) {
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
  const { branding, logoUrl } = useBranding();
  const { isBalanceLoading, setIsBalanceLoading, setUserName } = useDashboardLoading();
  const isMobile = useIsMobile();
  const { kycRequired, kycStatus, loading: kycLoading } = useKYCStatus();
  const navigate = useNavigate();
  const location = useLocation();

  // Track user activity
  useActivityTracker();

  // Redirect to KYC page if required and not approved/pending
  useEffect(() => {
    if (!kycLoading && kycRequired && kycStatus !== 'approved' && kycStatus !== 'pending') {
      if (location.pathname !== '/kryptotrading/kyc') {
        navigate('/kryptotrading/kyc');
      }
    }
  }, [kycLoading, kycRequired, kycStatus, location.pathname, navigate]);
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

  // Render the full layout only after branding is loaded
  return (
    <div className="min-h-screen flex w-full bg-background">
      <TradingSidebar />
      
      <div className="flex-1 flex flex-col">
        <header className="h-20 flex items-center border-b border-border bg-background px-4">
          {isMobile ? (
            <>
              <SidebarTrigger className="h-8 w-8 flex-shrink-0" />
              <NavLink 
                to="/kryptotrading" 
                className="flex-1 flex justify-center items-center cursor-pointer hover:opacity-80 transition-opacity"
              >
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt={branding?.name || "Logo"} 
                    className="h-12 max-w-[200px] object-contain"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg" style={{ backgroundColor: 'hsl(var(--brand-accent, var(--primary)) / 0.1)' }}>
                    <span className="text-lg font-bold" style={{ color: 'hsl(var(--brand-accent, var(--primary)))' }}>
                      {branding?.name?.charAt(0) || "T"}
                    </span>
                  </div>
                )}
              </NavLink>
              <div className="w-8 flex-shrink-0" /> {/* Spacer for balance */}
            </>
          ) : (
            <div className="flex items-center gap-6">
              <SidebarTrigger className="h-8 w-8" />
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-foreground">Trading Dashboard</h1>
                <p className="text-sm text-muted-foreground">Professionelles Krypto-Portfolio Management</p>
              </div>
            </div>
          )}
        </header>

        <main className="flex-1 p-8 bg-background">
          <div className="max-w-7xl mx-auto">
            {isBalanceLoading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-muted-foreground">Benutzerdaten werden geladen...</p>
                </div>
              </div>
            ) : (
              <Outlet />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function TradingLayoutContent() {
  const { loading: brandingLoading } = useBranding();

  // Show fixed, perfectly centered loading screen until branding is loaded
  if (brandingLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Trading-Dashboard wird geladen...</p>
        </div>
      </div>
    );
  }

  // Only render providers and content when branding is fully loaded
  return (
    <DashboardLoadingProvider>
      <SidebarProvider defaultOpen={true}>
        <TradingContent />
      </SidebarProvider>
    </DashboardLoadingProvider>
  );
}

export function TradingLayout() {
  return (
    <TradingGuard>
      <BrandingProvider>
        <CoinMarketCapProvider>
          <TradingLayoutContent />
        </CoinMarketCapProvider>
      </BrandingProvider>
    </TradingGuard>
  );
}