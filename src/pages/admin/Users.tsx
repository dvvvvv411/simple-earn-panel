import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserCreateDialog } from "@/components/admin/UserCreateDialog";
import { UserEditDialog } from "@/components/admin/UserEditDialog";
import { UserDetailDialog } from "@/components/admin/UserDetailDialog";
import { UserTable } from "@/components/admin/UserTable";
import { Search, RefreshCw, Loader2 } from "lucide-react";
import type { User } from "@/types/user";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          branding:brandings(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user roles separately
      const userIds = data?.map(user => user.id) || [];
      
      const [rolesResult, kycResult, activityResult] = await Promise.all([
        supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds),
        supabase
          .from('kyc_submissions')
          .select('user_id, status')
          .in('user_id', userIds),
        supabase
          .from('user_activity_sessions')
          .select('user_id, last_active_at, is_active')
          .in('user_id', userIds)
          .order('last_active_at', { ascending: false })
      ]);

      const rolesData = rolesResult.data || [];
      const kycData = kycResult.data || [];
      const activityData = activityResult.data || [];

      // Create maps for quick lookup
      const kycMap = new Map<string, string>();
      kycData.forEach(k => {
        // Keep the most relevant status (approved > rejected > pending)
        const existing = kycMap.get(k.user_id);
        if (!existing || k.status === 'approved' || (k.status === 'rejected' && existing === 'pending')) {
          kycMap.set(k.user_id, k.status);
        }
      });

      const activityMap = new Map<string, { last_active_at: string; is_active: boolean }>();
      activityData.forEach(a => {
        if (!activityMap.has(a.user_id)) {
          activityMap.set(a.user_id, { last_active_at: a.last_active_at, is_active: a.is_active || false });
        }
      });

      // Combine data with roles, KYC status, and activity
      const usersWithExtendedData = data?.map(user => {
        const kycSubmissionStatus = kycMap.get(user.id);
        let kycStatus: User['kycStatus'] = 'nicht_angefordert';
        
        if (kycSubmissionStatus === 'approved') {
          kycStatus = 'verifiziert';
        } else if (kycSubmissionStatus === 'rejected') {
          kycStatus = 'abgelehnt';
        } else if (kycSubmissionStatus === 'pending') {
          kycStatus = 'in_pruefung';
        } else if (user.kyc_required) {
          kycStatus = 'offen';
        }

        const activity = activityMap.get(user.id);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const isOnline = activity && new Date(activity.last_active_at) > fiveMinutesAgo;

        return {
          ...user,
          roles: rolesData.filter(role => role.user_id === user.id).map(role => ({ role: role.role })),
          kycStatus,
          lastActivity: {
            isOnline: isOnline || false,
            lastActiveAt: activity?.last_active_at || null
          }
        };
      }) || [];

      setUsers(usersWithExtendedData);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Fehler",
        description: "Benutzer konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserEdit = (user: User) => {
    setEditingUser(user);
    setEditDialogOpen(true);
  };

  const handleUserDetail = (user: User) => {
    setDetailUser(user);
    setDetailDialogOpen(true);
  };

  const handleUnluckyStreakToggle = async (userId: string, value: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ unlucky_streak: value })
        .eq('id', userId);

      if (error) throw error;

      // Lokales Update für sofortige UI-Reaktion
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, unlucky_streak: value } : user
      ));

      toast({
        title: value ? "Pechsträhne aktiviert" : "Pechsträhne deaktiviert",
        description: "Einstellung wurde erfolgreich geändert.",
      });
    } catch (error: any) {
      console.error('Error updating unlucky streak:', error);
      toast({
        title: "Fehler",
        description: "Einstellung konnte nicht geändert werden.",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    const name = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
    const email = user.email?.toLowerCase() || '';
    const phone = user.phone?.toLowerCase() || '';
    
    return name.includes(searchLower) || 
           email.includes(searchLower) || 
           phone.includes(searchLower);
  });

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Benutzer</h2>
        <p className="text-muted-foreground">
          Benutzerverwaltung und Rollenzuweisungen.
        </p>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground">Benutzer verwalten</CardTitle>
            <UserCreateDialog onUserCreated={fetchUsers} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Benutzer suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-input"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={fetchUsers}
              disabled={loading}
              className="border-input hover:bg-accent/50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>

            <UserTable 
              users={filteredUsers} 
              loading={loading}
              onUserDeleted={fetchUsers}
              onUserEdit={handleUserEdit}
              onUserDetail={handleUserDetail}
              onUnluckyStreakToggle={handleUnluckyStreakToggle}
            />
        </CardContent>
      </Card>

      <UserEditDialog 
        user={editingUser}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onUserUpdated={fetchUsers}
      />

      <UserDetailDialog 
        user={detailUser}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onUserUpdated={fetchUsers}
      />
    </div>
  );
}