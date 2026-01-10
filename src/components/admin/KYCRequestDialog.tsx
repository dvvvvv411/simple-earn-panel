import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Loader2, UserPlus } from "lucide-react";

interface UserForKYC {
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

interface KYCRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUsersUpdated: () => void;
}

export function KYCRequestDialog({ open, onOpenChange, onUsersUpdated }: KYCRequestDialogProps) {
  const [users, setUsers] = useState<UserForKYC[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchEligibleUsers();
      setSelectedUserIds(new Set());
      setSearchTerm("");
    }
  }, [open]);

  const fetchEligibleUsers = async () => {
    setLoading(true);
    try {
      // Get users with approved KYC (to exclude them)
      const { data: approvedKYC } = await supabase
        .from('kyc_submissions')
        .select('user_id')
        .eq('status', 'approved');

      const approvedUserIds = new Set(approvedKYC?.map(k => k.user_id) || []);

      // Get all users with branding
      const { data: allUsers, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          balance,
          branding:brandings(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter out users with approved KYC
      const eligibleUsers = (allUsers || []).filter(
        user => !approvedUserIds.has(user.id)
      );

      setUsers(eligibleUsers);
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

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleToggleAll = () => {
    if (selectedUserIds.size === filteredUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const handleSubmit = async () => {
    if (selectedUserIds.size === 0) {
      toast({
        title: "Keine Auswahl",
        description: "Bitte wählen Sie mindestens einen Benutzer aus.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ kyc_required: true })
        .in('id', Array.from(selectedUserIds));

      if (error) throw error;

      toast({
        title: "Erfolgreich",
        description: `KYC wurde für ${selectedUserIds.size} Benutzer angefordert.`,
      });

      onUsersUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating users:', error);
      toast({
        title: "Fehler",
        description: "KYC-Anforderung fehlgeschlagen.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getDisplayName = (user: UserForKYC) => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            KYC anfordern
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nach Name oder E-Mail suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex-1 overflow-auto border border-border rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Keine Benutzer gefunden.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedUserIds.size === filteredUsers.length && filteredUsers.length > 0}
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
                      className="cursor-pointer"
                      onClick={() => handleToggleUser(user.id)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedUserIds.has(user.id)}
                          onCheckedChange={() => handleToggleUser(user.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {getDisplayName(user)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email || '-'}
                      </TableCell>
                      <TableCell>
                        <span className={user.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatBalance(user.balance)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {user.branding ? (
                          <Badge variant="secondary">{user.branding.name}</Badge>
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

        <DialogFooter className="flex items-center justify-between pt-4">
          <span className="text-sm text-muted-foreground">
            {selectedUserIds.size} Benutzer ausgewählt
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={submitting || selectedUserIds.size === 0}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              {selectedUserIds.size} Benutzer anfordern
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
