import { NavLink, useLocation } from "react-router-dom";
import { Package, Users, LogOut, Building, Headphones, UserCheck, Wallet, Download, Mail, MessageCircle, ShieldCheck, Landmark, Bot, CreditCard, Briefcase, Users2 } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";

const menuGroups = [
  {
    label: "Benutzer & Finanzen",
    items: [
      { title: "Benutzer", url: "/admin/benutzer", icon: Users },
      { title: "Einzahlungen", url: "/admin/einzahlungen", icon: Download },
      { title: "Auszahlungen", url: "/admin/auszahlungen", icon: Wallet },
    ]
  },
  {
    label: "Verifizierung",
    items: [
      { title: "KYC", url: "/admin/kyc", icon: ShieldCheck },
      { title: "Bank-KYC", url: "/admin/bank-kyc", icon: Landmark },
      { title: "Kredit-KYC", url: "/admin/kredit", icon: CreditCard },
      { title: "Aufträge", url: "/admin/auftraege", icon: Briefcase },
    ]
  },
  {
    label: "Support & Trading",
    items: [
      { title: "Support", url: "/admin/support", icon: Headphones },
      { title: "Aktive Bots", url: "/admin/aktive-bots", icon: Bot },
    ]
  },
  {
    label: "Einstellungen",
    items: [
      { title: "Brandings", url: "/admin/brandings", icon: Package },
      { title: "Referrals", url: "/admin/referrals", icon: Users2 },
      { title: "Berater", url: "/admin/berater", icon: UserCheck },
      { title: "Email-Vorlagen", url: "/admin/email-vorlagen", icon: Mail },
      { title: "Telegram", url: "/admin/telegram", icon: MessageCircle },
    ]
  },
];

// Benutzer mit eingeschränkten Sidebar-Rechten
const RESTRICTED_USER_EMAIL = "x852@caller.de";
const ALLOWED_GROUPS_FOR_RESTRICTED_USER = ["Benutzer & Finanzen", "Support & Trading"];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';
  const [userEmail, setUserEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [filteredMenuGroups, setFilteredMenuGroups] = useState<typeof menuGroups>([]);

  const isActive = (path: string) => currentPath === path;

  useEffect(() => {
    const getUserInfo = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setUserEmail(session.user.email);
        
        // Filter für x852@caller.de - nur bestimmte Gruppen anzeigen
        if (session.user.email === RESTRICTED_USER_EMAIL) {
          setFilteredMenuGroups(
            menuGroups.filter(group => 
              ALLOWED_GROUPS_FOR_RESTRICTED_USER.includes(group.label)
            )
          );
        } else {
          // Alle anderen Admins sehen alles
          setFilteredMenuGroups(menuGroups);
        }
      } else {
        setFilteredMenuGroups(menuGroups);
      }
      setIsLoading(false);
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

      <SidebarContent className="bg-sidebar overflow-hidden">
        {isLoading ? null : filteredMenuGroups.map((group, groupIndex) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/60 px-4 py-2 mt-2">
              {!collapsed && group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {group.items.map((item) => (
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
            {groupIndex < filteredMenuGroups.length - 1 && (
              <Separator className="my-3 mx-4 bg-sidebar-border" />
            )}
          </SidebarGroup>
        ))}
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