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
      <SidebarHeader className="h-16 flex items-center px-6 border-b border-border/40">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt={branding?.name || "Logo"} 
              className="h-8 w-8 object-contain"
            />
          ) : (
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-bold">
                {branding?.name?.charAt(0) || "T"}
              </span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">
              {branding?.name || "Trading Dashboard"}
            </span>
            <span className="text-xs text-muted-foreground">
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
                    className="transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
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