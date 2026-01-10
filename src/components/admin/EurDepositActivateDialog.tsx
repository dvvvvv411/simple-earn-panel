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
import { Label } from "@/components/ui/label";
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
import { Landmark, Building, Shield, Mail, Phone, Key, Link, Search, Loader2 } from "lucide-react";

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

interface EurDepositActivateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EurDepositActivateDialog({ open, onOpenChange, onSuccess }: EurDepositActivateDialogProps) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form fields
  const [selectedUserId, setSelectedUserId] = useState("");
  const [partnerBank, setPartnerBank] = useState("");
  const [verificationType, setVerificationType] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [identcode, setIdentcode] = useState("");
  const [verificationLink, setVerificationLink] = useState("");

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

      const { data: existingRequests, error: requestsError } = await supabase
        .from('eur_deposit_requests')
        .select('user_id')
        .in('status', ['pending', 'submitted', 'approved']);

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
    
    if (!selectedUserId || !partnerBank || !verificationType || !contactEmail || !contactPhone || !verificationLink || !identcode) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('eur_deposit_requests')
        .insert({
          user_id: selectedUserId,
          partner_bank: partnerBank,
          verification_type: verificationType,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          identcode: identcode,
          verification_link: verificationLink,
          status: 'pending',
        });

      if (error) throw error;

      toast.success('EUR-Einzahlung wurde aktiviert');
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error activating EUR deposit:', error);
      toast.error('Fehler beim Aktivieren der EUR-Einzahlung');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedUserId("");
    setPartnerBank("");
    setVerificationType("");
    setContactEmail("");
    setContactPhone("");
    setIdentcode("");
    setVerificationLink("");
    setSearchTerm("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            EUR-Einzahlung aktivieren
          </DialogTitle>
          <DialogDescription>
            Aktivieren Sie SEPA-Bankeinzahlungen für einen Benutzer
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* User Selection with Search Table */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              Benutzer auswählen
              <span className="text-xs text-red-500">*</span>
            </Label>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nach Name oder E-Mail suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="h-48 overflow-auto border border-border rounded-lg">
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

          {/* Partner Bank Details */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium flex items-center gap-2 text-sm">
              <Building className="h-4 w-4" />
              Partnerbank-Details
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Partnerbank</Label>
                <Input
                  placeholder="z.B. Solarisbank"
                  value={partnerBank}
                  onChange={(e) => setPartnerBank(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Verifizierungsart</Label>
                <Input
                  placeholder="z.B. WebID"
                  value={verificationType}
                  onChange={(e) => setVerificationType(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4" />
              Kontaktdaten
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Email
                </Label>
                <Input
                  type="email"
                  placeholder="service@bank.de"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  Telefonnummer
                </Label>
                <Input
                  placeholder="+49 30 12345678"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Verification Details */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4" />
              Verifizierung
            </h4>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Key className="h-3 w-3" />
                  Identcode
                  <span className="text-xs text-red-500 ml-1">*</span>
                </Label>
                <Input
                  placeholder="z.B. ABC123"
                  value={identcode}
                  onChange={(e) => setIdentcode(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Der Code zum Starten der WebID-Verifizierung (im Identlink enthalten)
                </p>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Link className="h-3 w-3" />
                  Verifizierungslink (Identlink)
                  <span className="text-xs text-red-500 ml-1">*</span>
                </Label>
                <Input
                  type="url"
                  placeholder="https://webid.com/verify/..."
                  value={verificationLink}
                  onChange={(e) => setVerificationLink(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={submitting || !selectedUserId}>
              {submitting ? "Aktiviere..." : "Aktivieren"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
