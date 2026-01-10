import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, User, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface User {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
}

interface TaskEnrollmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TaskEnrollmentDialog({ open, onOpenChange, onSuccess }: TaskEnrollmentDialogProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAvailableUsers();
    }
  }, [open]);

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          (u) =>
            u.email?.toLowerCase().includes(query) ||
            u.first_name?.toLowerCase().includes(query) ||
            u.last_name?.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const fetchAvailableUsers = async () => {
    setLoading(true);
    try {
      // Get users who are NOT already enrolled
      const { data: enrolledUsers } = await supabase
        .from('user_task_enrollments')
        .select('user_id');

      const enrolledIds = enrolledUsers?.map(e => e.user_id) || [];

      let query = supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .order('email');

      if (enrolledIds.length > 0) {
        query = query.not('id', 'in', `(${enrolledIds.join(',')})`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Fehler beim Laden der Nutzer');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedUserId) {
      toast.error('Bitte einen Nutzer auswählen');
      return;
    }

    setSubmitting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      
      const { error } = await supabase
        .from('user_task_enrollments')
        .insert({
          user_id: selectedUserId,
          enrolled_by: session.session?.user.id
        });

      if (error) throw error;

      toast.success('Nutzer wurde für Aufträge freigeschaltet');
      setSelectedUserId(null);
      setSearchQuery("");
      onSuccess();
    } catch (error) {
      console.error('Error enrolling user:', error);
      toast.error('Fehler beim Hinzufügen');
    } finally {
      setSubmitting(false);
    }
  };

  const getUserDisplayName = (user: User) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.email || 'Unbekannt';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nutzer für Aufträge freischalten</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nach Name oder Email suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[300px] border rounded-md">
            {loading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Laden...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Keine verfügbaren Nutzer gefunden
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-md text-left transition-colors ${
                      selectedUserId === user.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent'
                    }`}
                  >
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      {selectedUserId === user.id ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {getUserDisplayName(user)}
                      </div>
                      {user.email && user.first_name && (
                        <div className={`text-sm truncate ${
                          selectedUserId === user.id 
                            ? 'text-primary-foreground/70' 
                            : 'text-muted-foreground'
                        }`}>
                          {user.email}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedUserId || submitting}>
            {submitting ? 'Wird hinzugefügt...' : 'Freischalten'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
