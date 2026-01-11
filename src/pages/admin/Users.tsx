import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserCreateDialog } from "@/components/admin/UserCreateDialog";
import { UserEditDialog } from "@/components/admin/UserEditDialog";
import { UserTable, SortField, SortDirection } from "@/components/admin/UserTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, RefreshCw, Loader2 } from "lucide-react";
import type { User } from "@/types/user";

export default function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Filters
  const [brandingFilter, setBrandingFilter] = useState<string>('all');
  const [balanceRange, setBalanceRange] = useState<number[]>([0, 100000]);
  const [brandings, setBrandings] = useState<{ id: string; name: string }[]>([]);
  const [consultants, setConsultants] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchBrandings();
    fetchConsultants();
  }, []);

  const fetchBrandings = async () => {
    try {
      const { data, error } = await supabase
        .from('brandings')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setBrandings(data || []);
    } catch (error) {
      console.error('Error fetching brandings:', error);
    }
  };

  const fetchConsultants = async () => {
    try {
      const { data, error } = await supabase
        .from('consultants')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setConsultants(data || []);
    } catch (error) {
      console.error('Error fetching consultants:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          branding:brandings(id, name),
          consultant:consultants(id, name)
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
    navigate(`/admin/benutzer/${user.id}`);
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

  const handleSortChange = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleConsultantAssign = async (userId: string, consultantId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ consultant_id: consultantId })
        .eq('id', userId);

      if (error) throw error;

      // Lokales Update
      const consultant = consultants.find(c => c.id === consultantId);
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, consultant_id: consultantId, consultant } : u
      ));

      toast({
        title: "Berater zugewiesen",
        description: `Berater wurde erfolgreich zugewiesen.`,
      });
    } catch (error: any) {
      console.error('Error assigning consultant:', error);
      toast({
        title: "Fehler",
        description: "Berater konnte nicht zugewiesen werden.",
        variant: "destructive",
      });
    }
  };

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(balance);
  };

  // Calculate max balance from users for dynamic slider
  const maxBalance = useMemo(() => {
    if (users.length === 0) return 100000;
    const max = Math.max(...users.map(u => u.balance));
    return Math.ceil(max / 1000) * 1000 || 100000;
  }, [users]);

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    // First filter
    const filtered = users.filter((user) => {
      const searchLower = searchTerm.toLowerCase();
      const name = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
      const email = user.email?.toLowerCase() || '';
      const phone = user.phone?.toLowerCase() || '';
      
      const matchesSearch = name.includes(searchLower) || 
             email.includes(searchLower) || 
             phone.includes(searchLower);

      const matchesBranding = brandingFilter === 'all' || user.branding?.id === brandingFilter;

      const matchesBalance = user.balance >= balanceRange[0] && user.balance <= balanceRange[1];
      
      return matchesSearch && matchesBranding && matchesBalance;
    });

    // Then sort
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'balance':
          comparison = a.balance - b.balance;
          break;
        case 'last_activity':
          const dateA = a.lastActivity?.lastActiveAt ? new Date(a.lastActivity.lastActiveAt).getTime() : 0;
          const dateB = b.lastActivity?.lastActiveAt ? new Date(b.lastActivity.lastActiveAt).getTime() : 0;
          comparison = dateA - dateB;
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [users, searchTerm, brandingFilter, balanceRange, sortField, sortDirection]);

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
          {/* Filter Section */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Benutzer suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-input"
              />
            </div>

            {/* Branding Filter */}
            <Select value={brandingFilter} onValueChange={setBrandingFilter}>
              <SelectTrigger className="w-[180px] bg-background border-input">
                <SelectValue placeholder="Alle Brandings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Brandings</SelectItem>
                {brandings.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Balance Filter */}
            <div className="flex items-center gap-3 min-w-[300px] bg-background border border-input rounded-md px-3 py-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Guthaben:</span>
              <span className="text-sm font-medium text-foreground min-w-[60px]">{formatBalance(balanceRange[0])}</span>
              <Slider
                value={balanceRange}
                min={0}
                max={maxBalance}
                step={100}
                onValueChange={setBalanceRange}
                className="flex-1"
              />
              <span className="text-sm font-medium text-foreground min-w-[60px] text-right">{formatBalance(balanceRange[1])}</span>
            </div>

            {/* Refresh Button */}
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
            users={filteredAndSortedUsers} 
            loading={loading}
            onUserDeleted={fetchUsers}
            onUserEdit={handleUserEdit}
            onUserDetail={handleUserDetail}
            onUnluckyStreakToggle={handleUnluckyStreakToggle}
            sortField={sortField}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
            consultants={consultants}
            onConsultantAssign={handleConsultantAssign}
          />
        </CardContent>
      </Card>

      <UserEditDialog 
        user={editingUser}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onUserUpdated={fetchUsers}
      />
    </div>
  );
}
