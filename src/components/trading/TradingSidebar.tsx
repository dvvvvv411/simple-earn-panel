import { NavLink, useLocation } from "react-router-dom";
import { BarChart3, LogOut, History, Wallet, Headphones } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { useBranding } from "@/contexts/BrandingContext";
import { useIsMobile } from "@/hooks/use-mobile";

const items = [
  {
    title: "Dashboard",
    url: "/kryptotrading",
    icon: BarChart3,
  },
  {
    title: "Wallet",
    url: "/kryptotrading/wallet",
    icon: Wallet,
  },
  {
    title: "Trading-Historie",
    url: "/kryptotrading/historie",
    icon: History,
  },
  {
    title: "Support",
    url: "/kryptotrading/support",
    icon: Headphones,
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

  const isActive = (path: string) => currentPath === path;

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
        <div className="flex items-center justify-center w-full">
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
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/60 px-4 py-4 mt-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-2">
            <SidebarMenu className="space-y-1">
              {items.map((item) => (
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
                          {!collapsed && (
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        {userEmail && !collapsed && (
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
                Trader
              </span>
            </div>
          </div>
        )}
        
        <SidebarMenuButton 
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3 text-base font-medium rounded-lg text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
        >
          <LogOut className="h-5 w-5 shrink-0 text-destructive" />
          {!collapsed && <span>Logout</span>}
        </SidebarMenuButton>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  );
}