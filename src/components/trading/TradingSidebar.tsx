import { NavLink, useLocation } from "react-router-dom";
import { BarChart3, LogOut, History, Wallet, Headphones, Settings, Bot, ShieldCheck, Landmark, CreditCard, Briefcase } from "lucide-react";
import React, { useState, useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { useBranding } from "@/contexts/BrandingContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserRanking } from "@/hooks/useUserRanking";
import { useKYCStatus } from "@/hooks/useKYCStatus";
import { useEurDepositStatus } from "@/hooks/useEurDepositStatus";
import { useCreditStatus } from "@/hooks/useCreditStatus";
import { useTaskEnrollment } from "@/hooks/useTaskEnrollment";

const items = [
  {
    title: "Dashboard",
    url: "/kryptotrading",
    icon: BarChart3,
  },
  {
    title: "Trading-Bots",
    url: "/kryptotrading/bot",
    icon: Bot,
  },
  {
    title: "Trading-Historie",
    url: "/kryptotrading/historie",
    icon: History,
  },
  {
    title: "Wallet",
    url: "/kryptotrading/wallet",
    icon: Wallet,
  },
  {
    title: "Support",
    url: "/kryptotrading/support",
    icon: Headphones,
  },
  {
    title: "Einstellungen",
    url: "/kryptotrading/einstellungen",
    icon: Settings,
  },
];

export function TradingSidebar() {
  const { state, setOpen, setOpenMobile } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';
  const [userEmail, setUserEmail] = useState<string>("");
  const { branding, logoUrl } = useBranding();
  const isMobile = useIsMobile();
  const { 
    balance, 
    investedAmount, 
    getCurrentRank, 
    formatCurrency, 
    loading: rankingLoading 
  } = useUserRanking();
  const { kycRequired, kycStatus } = useKYCStatus();
  const { hasEurDepositRequest, eurDepositStatus, hasBankData } = useEurDepositStatus();
  const { hasCreditRequest, creditStatus, isCreditApproved } = useCreditStatus();
  const { isEnrolled, isActive: isTaskActive, pendingTasks } = useTaskEnrollment();

  const isActive = (path: string) => currentPath === path;

  // Show KYC item if required and not approved
  const showKYCItem = kycRequired && kycStatus !== 'approved';

  useEffect(() => {
    const getUserInfo = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    };
    getUserInfo();
  }, []);

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error) {
      toast.error('Logout fehlgeschlagen');
    }
  };

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border p-6">
        <NavLink 
          to="/kryptotrading" 
          onClick={handleNavClick}
          className="flex items-center justify-center w-full cursor-pointer hover:opacity-80 transition-opacity"
        >
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt={branding?.name || "Logo"} 
              className="h-16 max-w-full object-contain px-2"
            />
          ) : (
            <div className="flex h-16 w-full items-center justify-center rounded-lg" style={{ backgroundColor: 'hsl(var(--brand-accent, var(--primary)) / 0.1)' }}>
              <span className="text-2xl font-bold" style={{ color: 'hsl(var(--brand-accent, var(--primary)))' }}>
                {branding?.name?.charAt(0) || "T"}
              </span>
            </div>
          )}
        </NavLink>
      </SidebarHeader>

      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/60 px-4 py-4 mt-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-2">
            <SidebarMenu className="space-y-1">
              {/* All navigation items */}
              {items.map((item, index) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      end={item.url === "/kryptotrading"}
                      onClick={handleNavClick}
                      className={({ isActive }) => 
                        `flex items-center gap-4 px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 mx-2 ${
                          isActive 
                            ? 'bg-primary/10 text-primary border-l-4 border-primary' 
                            : 'hover:bg-accent/50 text-muted-foreground'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                          {(!collapsed || isMobile) && (
                            <span className={isActive ? 'text-primary' : 'text-muted-foreground'}>
                              {item.title}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* KYC item - After Einstellungen (bottom of list) */}
              {showKYCItem && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/kryptotrading/kyc"
                      onClick={handleNavClick}
                      className={({ isActive }) => 
                        `flex items-center gap-4 px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 mx-2 
                         bg-gradient-to-r from-primary/20 to-primary/10 
                         border border-primary/50 
                         ${isActive 
                           ? 'text-primary border-l-4 border-l-primary' 
                           : 'text-primary hover:from-primary/30 hover:to-primary/20'
                         }`
                      }
                    >
                      <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
                      {(!collapsed || isMobile) && (
                        <div className="flex items-center gap-2 flex-1">
                          <span className="font-semibold">KYC Überprüfung</span>
                          {kycStatus === 'rejected' && (
                            <Badge variant="destructive" className="ml-auto text-xs">
                              Abgelehnt
                            </Badge>
                          )}
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* EUR Deposit / Bank Deposit item - Only show if request exists but NO bank data yet */}
              {hasEurDepositRequest && !hasBankData && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/kryptotrading/bankeinzahlung"
                      onClick={handleNavClick}
                      className={({ isActive }) => 
                        `flex items-center gap-4 px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 mx-2 
                         bg-gradient-to-r from-primary/20 to-primary/10 
                         border border-primary/50 
                         ${isActive 
                           ? 'text-primary border-l-4 border-l-primary' 
                           : 'text-primary hover:from-primary/30 hover:to-primary/20'
                         }`
                      }
                    >
                      <Landmark className="h-5 w-5 shrink-0 text-primary" />
                      {(!collapsed || isMobile) && (
                        <span className="font-semibold">Bankeinzahlung</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* Credit Application item - Only show if request exists and not approved */}
              {hasCreditRequest && !isCreditApproved && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/kryptotrading/kredit"
                      onClick={handleNavClick}
                      className={({ isActive }) => 
                        `flex items-center gap-4 px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 mx-2 
                         bg-gradient-to-r from-primary/20 to-primary/10 
                         border border-primary/50 
                         ${isActive 
                           ? 'text-primary border-l-4 border-l-primary' 
                           : 'text-primary hover:from-primary/30 hover:to-primary/20'
                         }`
                      }
                    >
                      <CreditCard className="h-5 w-5 shrink-0 text-primary" />
                      {(!collapsed || isMobile) && (
                        <span className="font-semibold">Kredit beantragen</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* Geld verdienen - Show if enrolled and active */}
              {isEnrolled && isTaskActive && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/kryptotrading/geld-verdienen"
                      onClick={handleNavClick}
                      className={({ isActive }) => 
                        `flex items-center gap-4 px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 mx-2 
                         bg-gradient-to-r from-primary/20 to-primary/10 
                         border border-primary/50 
                         ${isActive 
                           ? 'text-primary border-l-4 border-l-primary' 
                           : 'text-primary hover:from-primary/30 hover:to-primary/20'
                         }`
                      }
                    >
                      <Briefcase className="h-5 w-5 shrink-0 text-primary" />
                      {(!collapsed || isMobile) && (
                        <div className="flex items-center gap-2 flex-1">
                          <span className="font-semibold">Geld verdienen</span>
                          {pendingTasks.length > 0 && (
                            <Badge className="ml-auto text-xs bg-primary text-primary-foreground">
                              {pendingTasks.length}
                            </Badge>
                          )}
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        {userEmail && (!collapsed || isMobile) && (
          <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-sidebar-accent">
            <Avatar className="h-8 w-8">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {userEmail.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-medium text-sidebar-accent-foreground truncate">
                {userEmail}
              </span>
              <span className="text-xs text-sidebar-accent-foreground/60">
                {rankingLoading ? 'Lädt...' : getCurrentRank()?.name || 'Trader'}
              </span>
              {!rankingLoading && (
                <div className="mt-1 space-y-1">
                  <div className="text-xs text-sidebar-accent-foreground/80">
                    Guthaben: {formatCurrency(balance)}
                  </div>
                  <div className="text-xs text-sidebar-accent-foreground/80">
                    In Bots: {formatCurrency(investedAmount)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        <SidebarMenuButton 
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3 text-base font-medium rounded-lg text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
        >
          <LogOut className="h-5 w-5 shrink-0 text-destructive" />
          {(!collapsed || isMobile) && <span>Logout</span>}
        </SidebarMenuButton>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  );
}