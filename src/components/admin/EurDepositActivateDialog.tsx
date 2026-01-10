import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Landmark, User, Building, Shield, Mail, Phone, Key, Link } from "lucide-react";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
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
  
  // Form fields
  const [selectedUserId, setSelectedUserId] = useState("");
  const [partnerBank, setPartnerBank] = useState("");
  const [verificationType, setVerificationType] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationLink, setVerificationLink] = useState("");

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Get users who don't have an active EUR deposit request
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId || !partnerBank || !verificationType || !contactEmail || !contactPhone || !verificationCode || !verificationLink) {
      toast.error('Bitte füllen Sie alle Felder aus');
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
          verification_code: verificationCode,
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
    setVerificationCode("");
    setVerificationLink("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            EUR-Einzahlung aktivieren
          </DialogTitle>
          <DialogDescription>
            Aktivieren Sie SEPA-Bankeinzahlungen für einen Benutzer
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Benutzer auswählen
            </Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Lädt..." : "Benutzer auswählen..."} />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.first_name} {user.last_name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  Verifizierungscode (SMS)
                </Label>
                <Input
                  placeholder="z.B. A1B2C3"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Dieser Code wird dem Nutzer angezeigt und muss bei der Verifizierung eingegeben werden
                </p>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Link className="h-3 w-3" />
                  Verifizierungslink
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

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Aktiviere..." : "Aktivieren"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
