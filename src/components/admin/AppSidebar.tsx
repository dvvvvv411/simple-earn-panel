import { NavLink, useLocation } from "react-router-dom";
import { Package, Users, LogOut, Building, Headphones, UserCheck, Wallet, Download, Mail, MessageCircle, ShieldCheck, Landmark, Bot, CreditCard } from "lucide-react";
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

const items = [
  { title: "Brandings", url: "/admin/brandings", icon: Package },
  { title: "Benutzer", url: "/admin/benutzer", icon: Users },
  { title: "KYC", url: "/admin/kyc", icon: ShieldCheck },
  { title: "Berater", url: "/admin/berater", icon: UserCheck },
  { title: "Aktive Bots", url: "/admin/aktive-bots", icon: Bot },
  { title: "Einzahlungen", url: "/admin/einzahlungen", icon: Download },
  { title: "Bank-KYC", url: "/admin/bank-kyc", icon: Landmark },
  { title: "Kredit-KYC", url: "/admin/kredit", icon: CreditCard },
  { title: "Auszahlungen", url: "/admin/auszahlungen", icon: Wallet },
  { title: "Email-Vorlagen", url: "/admin/email-vorlagen", icon: Mail },
  { title: "Support", url: "/admin/support", icon: Headphones },
  { title: "Telegram", url: "/admin/telegram", icon: MessageCircle },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';
  const [userEmail, setUserEmail] = useState<string>("");

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
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building className="h-6 w-6" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-sidebar-foreground">Money Panel</h2>
              <p className="text-xs text-sidebar-foreground/60">Admin System</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/60 px-4 py-4 mt-2">
            Verwaltung
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-2">
            <SidebarMenu className="space-y-1">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
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
                Administrator
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