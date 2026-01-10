import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Loader2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface User {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  balance: number;
  branding?: {
    id: string;
    name: string;
  } | null;
}

interface TaskEnrollmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TaskEnrollmentDialog({ open, onOpenChange, onSuccess }: TaskEnrollmentDialogProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAvailableUsers();
      setSelectedUserIds([]);
      setSearchTerm("");
    }
  }, [open]);

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
        .select(`
          id, 
          email, 
          first_name, 
          last_name, 
          balance,
          branding:brandings(id, name)
        `)
        .order('email');

      if (enrolledIds.length > 0) {
        query = query.not('id', 'in', `(${enrolledIds.join(',')})`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setUsers(data as User[] || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Fehler beim Laden der Nutzer');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (selectedUserIds.length === 0) {
      toast.error('Bitte mindestens einen Nutzer auswählen');
      return;
    }

    setSubmitting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      
      for (const userId of selectedUserIds) {
        const { error } = await supabase
          .from('user_task_enrollments')
          .insert({
            user_id: userId,
            enrolled_by: session.session?.user.id
          });

        if (error) throw error;

        // Send email notification
        await supabase.functions.invoke('send-task-enrolled', {
          body: { user_id: userId }
        });

        // Send telegram notification
        await supabase.functions.invoke('send-telegram-notification', {
          body: { event_type: 'task_enrolled', data: { user_id: userId } }
        });
      }

      toast.success(`${selectedUserIds.length} Nutzer wurde(n) für Aufträge freigeschaltet`);
      setSelectedUserIds([]);
      setSearchTerm("");
      onSuccess();
    } catch (error) {
      console.error('Error enrolling user:', error);
      toast.error('Fehler beim Hinzufügen');
    } finally {
      setSubmitting(false);
    }
  };

  const getDisplayName = (user: User) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) return user.first_name;
    if (user.last_name) return user.last_name;
    return 'Unbekannt';
  };

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(balance);
  };

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleToggleAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map(u => u.id));
    }
  };

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(term) ||
      user.first_name?.toLowerCase().includes(term) ||
      user.last_name?.toLowerCase().includes(term)
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Nutzer für Aufträge freischalten
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nach Name oder E-Mail suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex-1 overflow-auto border rounded-md">
            {loading ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Laden...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Keine verfügbaren Nutzer gefunden
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0}
                        onCheckedChange={handleToggleAll}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Guthaben</TableHead>
                    <TableHead>Branding</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow 
                      key={user.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleToggleUser(user.id)}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedUserIds.includes(user.id)}
                          onCheckedChange={() => handleToggleUser(user.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {getDisplayName(user)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email || '-'}
                      </TableCell>
                      <TableCell>
                        {formatBalance(user.balance)}
                      </TableCell>
                      <TableCell>
                        {user.branding ? (
                          <Badge variant="secondary">
                            {user.branding.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedUserIds.length} von {filteredUsers.length} ausgewählt
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSubmit} disabled={selectedUserIds.length === 0 || submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Wird hinzugefügt...
                </>
              ) : (
                'Freischalten'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
