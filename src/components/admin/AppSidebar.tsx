import { NavLink, useLocation } from "react-router-dom";
import { Package, Users, LogOut } from "lucide-react";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";

const items = [
  { title: "Brandings", url: "/admin/brandings", icon: Package },
  { title: "Benutzer", url: "/admin/benutzer", icon: Users },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => currentPath === path;

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error) {
      toast.error('Logout fehlgeschlagen');
    }
  };

  return (
    <Sidebar className="border-r border-border/40 bg-background">
      <SidebarContent className="bg-background">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-4 py-4 mt-6">
            Admin Panel
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-2">
            <SidebarMenu className="space-y-2">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) => 
                        `flex items-center gap-4 px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 ${
                          isActive 
                            ? 'bg-primary/5 text-primary border-l-3 border-primary shadow-sm' 
                            : 'text-muted-foreground hover:bg-muted/30 hover:text-muted-foreground'
                        }`
                      }
                    >
                      <item.icon className={`h-5 w-5 shrink-0 ${
                        isActive ? 'text-primary' : 'text-primary'
                      }`} />
                      {!collapsed && (
                        <span className={isActive ? 'text-primary' : 'text-muted-foreground'}>
                          {item.title}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <div className="mt-auto p-4">
          <SidebarMenuButton 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 text-base font-medium rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
          >
            <LogOut className="h-5 w-5 shrink-0 text-destructive" />
            {!collapsed && <span>Logout</span>}
          </SidebarMenuButton>
        </div>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}