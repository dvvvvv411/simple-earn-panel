import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserCreateDialog } from "@/components/admin/UserCreateDialog";
import { UserEditDialog } from "@/components/admin/UserEditDialog";
import { UserTable } from "@/components/admin/UserTable";
import { Search, RefreshCw, Loader2 } from "lucide-react";
import type { User } from "@/types/user";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

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
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      // Combine data with roles
      const usersWithRoles = data?.map(user => ({
        ...user,
        roles: rolesData?.filter(role => role.user_id === user.id).map(role => ({ role: role.role })) || []
      })) || [];

      setUsers(usersWithRoles);
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