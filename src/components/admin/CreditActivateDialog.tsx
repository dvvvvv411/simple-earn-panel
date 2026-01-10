import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { CreditCard, Search, Loader2 } from "lucide-react";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  balance: number;
  branding?: {
    id: string;
    name: string;
  } | null;
}

interface CreditActivateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreditActivateDialog({ open, onOpenChange, onSuccess }: CreditActivateDialogProps) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");

  useEffect(() => {
    if (open) {
      loadUsers();
      setSearchTerm("");
      setSelectedUserId("");
    }
  }, [open]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          balance,
          branding:brandings(id, name)
        `)
        .order('email');

      if (profilesError) throw profilesError;

      // Exclude users who already have an active credit request
      const { data: existingRequests, error: requestsError } = await supabase
        .from('credit_requests')
        .select('user_id')
        .not('status', 'in', '("rejected")');

      if (requestsError) throw requestsError;

      const existingUserIds = new Set((existingRequests || []).map(r => r.user_id));
      const availableUsers = (allProfiles || []).filter(p => !existingUserIds.has(p.id));
      
      setUsers(availableUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Fehler beim Laden der Benutzer');
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (user: Profile) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) return user.first_name;
    if (user.last_name) return user.last_name;
    return user.email || 'Unbekannt';
  };

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(balance);
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const name = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
    const email = user.email?.toLowerCase() || '';
    return name.includes(searchLower) || email.includes(searchLower);
  });

  const selectedUser = users.find(u => u.id === selectedUserId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId) {
      toast.error('Bitte wählen Sie einen Benutzer aus');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('credit_requests')
        .insert({
          user_id: selectedUserId,
          status: 'documents_pending',
        });

      if (error) throw error;

      toast.success('Kreditantrag wurde für den Nutzer aktiviert');
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error activating credit request:', error);
      toast.error('Fehler beim Aktivieren des Kreditantrags');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedUserId("");
    setSearchTerm("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Kredit-Antrag aktivieren
          </DialogTitle>
          <DialogDescription>
            Aktivieren Sie den Kreditantrag für einen Benutzer. Der Nutzer kann dann seine Unterlagen einreichen.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* User Selection with Search Table */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nach Name oder E-Mail suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="h-64 overflow-auto border border-border rounded-lg">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Keine Benutzer gefunden.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
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
                        className={`cursor-pointer transition-colors ${selectedUserId === user.id ? 'bg-primary/10' : 'hover:bg-muted/50'}`}
                        onClick={() => setSelectedUserId(user.id)}
                      >
                        <TableCell className="font-medium">
                          {getDisplayName(user)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {user.email || '-'}
                        </TableCell>
                        <TableCell>
                          <span className={user.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatBalance(user.balance)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {user.branding ? (
                            <Badge variant="secondary" className="text-xs">{user.branding.name}</Badge>
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
            
            {selectedUser && (
              <div className="text-sm text-primary flex items-center gap-2">
                <span>Ausgewählt:</span>
                <span className="font-medium">{getDisplayName(selectedUser)} ({selectedUser.email})</span>
              </div>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={submitting || !selectedUserId}>
              {submitting ? "Aktiviere..." : "Kredit aktivieren"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
