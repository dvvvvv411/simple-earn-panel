import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { BarChart3, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBranding } from "@/contexts/BrandingContext";
import { Button } from "@/components/ui/button";

const menuItems = [
  {
    title: "Dashboard",
    url: "/kryptotrading",
    icon: BarChart3,
  },
];

export function TradingSidebar() {
  const location = useLocation();
  const { branding, logoUrl } = useBranding();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <Sidebar variant="inset" className="border-r border-border/40">
      <SidebarHeader className="h-20 flex items-center px-6 border-b border-border">
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt={branding?.name || "Logo"} 
              className="h-12 w-auto max-w-[120px] object-contain"
            />
          ) : (
            <div className="h-12 w-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--brand-accent, var(--primary)) / 0.1)' }}>
              <span className="text-lg font-bold" style={{ color: 'hsl(var(--brand-accent, var(--primary)))' }}>
                {branding?.name?.charAt(0) || "T"}
              </span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground">
              {branding?.name || "Trading Dashboard"}
            </span>
            <span className="text-sm text-muted-foreground">
              Krypto Trading
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === item.url}
                    className={`h-12 transition-colors hover:bg-accent/50 ${
                      location.pathname === item.url 
                        ? 'font-semibold border-r-2' 
                        : ''
                    }`}
                    style={location.pathname === item.url ? {
                      backgroundColor: 'hsl(var(--brand-accent, var(--primary)) / 0.1)',
                      color: 'hsl(var(--brand-accent, var(--primary)))',
                      borderRightColor: 'hsl(var(--brand-accent, var(--primary)))'
                    } : {}}
                  >
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start gap-2"
          >
            <LogOut className="h-4 w-4" />
            Abmelden
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}