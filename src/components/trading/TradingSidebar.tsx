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
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';
  const [userEmail, setUserEmail] = useState<string>("");
  const { branding, logoUrl } = useBranding();

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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error) {
      toast.error('Logout fehlgeschlagen');
    }
  };

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar lg:w-80 xl:w-96">
      <SidebarHeader className="border-b border-sidebar-border p-6 lg:p-8">
        <div className="flex items-center gap-3 lg:gap-4">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt={branding?.name || "Logo"} 
              className="h-10 lg:h-12 xl:h-14 w-auto max-w-[120px] lg:max-w-[140px] object-contain"
            />
          ) : (
            <div className="flex h-10 lg:h-12 xl:h-14 w-10 lg:w-12 xl:w-14 items-center justify-center rounded-lg" style={{ backgroundColor: 'hsl(var(--brand-accent, var(--primary)) / 0.1)' }}>
              <span className="text-lg lg:text-xl xl:text-2xl font-bold" style={{ color: 'hsl(var(--brand-accent, var(--primary)))' }}>
                {branding?.name?.charAt(0) || "T"}
              </span>
            </div>
          )}
          {!collapsed && (
            <div className="flex flex-col">
              <h2 className="text-lg lg:text-xl xl:text-2xl font-semibold text-sidebar-foreground">
                {branding?.name || "Trading Dashboard"}
              </h2>
              <p className="text-xs lg:text-sm xl:text-base text-sidebar-foreground/60">Krypto Trading</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs lg:text-sm xl:text-base font-medium text-sidebar-foreground/60 px-4 lg:px-6 py-4 lg:py-6 mt-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-2">
            <SidebarMenu className="space-y-1 lg:space-y-2">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      end={item.url === "/kryptotrading"}
                      className={({ isActive }) => 
                        `flex items-center gap-4 lg:gap-6 px-4 lg:px-6 py-3 lg:py-4 xl:py-5 text-base lg:text-lg xl:text-xl font-medium rounded-lg transition-all duration-200 mx-2 lg:mx-3 ${
                          isActive 
                            ? 'bg-primary/10 text-primary border-l-4 border-primary' 
                            : 'hover:bg-accent/50 text-muted-foreground'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon className={`h-5 w-5 lg:h-6 lg:w-6 xl:h-7 xl:w-7 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                          {!collapsed && (
                            <span className={`leading-relaxed ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
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

      <SidebarFooter className="border-t border-sidebar-border p-4 lg:p-6">
        {userEmail && !collapsed && (
          <div className="flex items-center gap-3 lg:gap-4 mb-4 lg:mb-6 p-3 lg:p-4 rounded-lg bg-sidebar-accent">
            <Avatar className="h-8 w-8 lg:h-10 lg:w-10 xl:h-12 xl:w-12">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs lg:text-sm xl:text-base">
                {userEmail.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm lg:text-base xl:text-lg font-medium text-sidebar-accent-foreground truncate">
                {userEmail}
              </span>
              <span className="text-xs lg:text-sm xl:text-base text-sidebar-accent-foreground/60">
                Trader
              </span>
            </div>
          </div>
        )}
        
        <SidebarMenuButton 
          onClick={handleLogout}
          className="w-full flex items-center gap-4 lg:gap-6 px-4 lg:px-6 py-3 lg:py-4 xl:py-5 text-base lg:text-lg xl:text-xl font-medium rounded-lg text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
        >
          <LogOut className="h-5 w-5 lg:h-6 lg:w-6 xl:h-7 xl:w-7 shrink-0 text-destructive" />
          {!collapsed && <span className="leading-relaxed">Logout</span>}
        </SidebarMenuButton>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  );
}