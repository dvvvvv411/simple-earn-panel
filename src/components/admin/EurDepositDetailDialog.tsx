import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { 
  Landmark, 
  User, 
  Building, 
  Mail, 
  Phone, 
  Key, 
  Link, 
  Clock, 
  CheckCircle, 
  XCircle,
  Send,
  Calendar,
  CreditCard,
  Building2
} from "lucide-react";

interface EurDepositRequest {
  id: string;
  user_id: string;
  partner_bank: string;
  verification_type: string;
  contact_email: string;
  contact_phone: string;
  identcode: string;
  sms_code: string | null;
  verification_link: string;
  status: string;
  user_confirmed_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  bank_account_holder?: string | null;
  bank_iban?: string | null;
  bank_bic?: string | null;
  bank_name?: string | null;
  profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
}

interface EurDepositDetailDialogProps {
  request: EurDepositRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EurDepositDetailDialog({ request, open, onOpenChange, onSuccess }: EurDepositDetailDialogProps) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  
  // Bank data fields
  const [bankAccountHolder, setBankAccountHolder] = useState("");
  const [bankIban, setBankIban] = useState("");
  const [bankBic, setBankBic] = useState("");
  const [bankName, setBankName] = useState("");

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', label: 'Ausstehend', icon: Clock };
      case 'submitted':
        return { color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', label: 'Eingereicht', icon: Send };
      case 'approved':
        return { color: 'bg-green-500/10 text-green-600 border-green-500/20', label: 'Genehmigt', icon: CheckCircle };
      case 'rejected':
        return { color: 'bg-red-500/10 text-red-600 border-red-500/20', label: 'Abgelehnt', icon: XCircle };
      default:
        return { color: 'bg-muted text-muted-foreground', label: status, icon: Clock };
    }
  };

  const handleApprove = async () => {
    // Validate bank data
    if (!bankAccountHolder.trim()) {
      toast.error('Bitte den Kontoinhaber eingeben');
      return;
    }
    if (!bankIban.trim()) {
      toast.error('Bitte die IBAN eingeben');
      return;
    }
    if (!bankBic.trim()) {
      toast.error('Bitte den BIC eingeben');
      return;
    }
    if (!bankName.trim()) {
      toast.error('Bitte den Banknamen eingeben');
      return;
    }

    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Nicht authentifiziert');

      const { error } = await supabase
        .from('eur_deposit_requests')
        .update({
          status: 'approved',
          reviewed_by: session.user.id,
          reviewed_at: new Date().toISOString(),
          bank_account_holder: bankAccountHolder.trim(),
          bank_iban: bankIban.trim().toUpperCase(),
          bank_bic: bankBic.trim().toUpperCase(),
          bank_name: bankName.trim(),
        })
        .eq('id', request.id);

      if (error) throw error;

      // Send Bank-KYC confirmation email
      try {
        await supabase.functions.invoke('send-bank-kyc-confirmation', {
          body: {
            user_id: request.user_id,
            bank_account_holder: bankAccountHolder.trim(),
            bank_iban: bankIban.trim().toUpperCase(),
            bank_bic: bankBic.trim().toUpperCase(),
            bank_name: bankName.trim(),
          }
        });
      } catch (emailError) {
        console.error('Email notification error:', emailError);
      }

      toast.success('Anfrage wurde genehmigt mit Bankdaten');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Fehler beim Genehmigen der Anfrage');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Bitte geben Sie einen Ablehnungsgrund an');
      return;
    }

    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Nicht authentifiziert');

      const { error } = await supabase
        .from('eur_deposit_requests')
        .update({
          status: 'rejected',
          reviewed_by: session.user.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq('id', request.id);

      if (error) throw error;

      // Send Bank-KYC rejection email
      try {
        await supabase.functions.invoke('send-bank-kyc-rejection', {
          body: {
            user_id: request.user_id,
            rejection_reason: rejectionReason,
          }
        });
      } catch (emailError) {
        console.error('Email notification error:', emailError);
      }

      toast.success('Anfrage wurde abgelehnt');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Fehler beim Ablehnen der Anfrage');
    } finally {
      setProcessing(false);
    }
  };

  const statusConfig = getStatusConfig(request.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            EUR-Einzahlung Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium">
                {request.profile?.first_name} {request.profile?.last_name}
              </p>
              <p className="text-sm text-muted-foreground">{request.profile?.email}</p>
            </div>
            <Badge className={`ml-auto ${statusConfig.color}`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>

          {/* Verification Details */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2 text-sm border-b pb-2">
              <Building className="h-4 w-4" />
              Verifizierungsdaten
            </h4>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Partnerbank</p>
                <p className="font-medium">{request.partner_bank}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Verifizierung</p>
                <p className="font-medium">{request.verification_type}</p>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{request.contact_email}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-muted-foreground">Telefon</p>
                  <p className="font-medium">{request.contact_phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Key className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-muted-foreground">Identcode</p>
                  <p className="font-medium font-mono">{request.identcode}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Key className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-muted-foreground">SMS-Code</p>
                  <p className="font-medium font-mono">{request.sms_code || 'Nicht gesetzt'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 col-span-2">
                <Link className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="min-w-0">
                  <p className="text-muted-foreground">Link</p>
                  <a 
                    href={request.verification_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline truncate block"
                  >
                    {request.verification_link}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Bank Data - Show if approved */}
          {request.status === 'approved' && request.bank_iban && (
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2 text-sm border-b pb-2">
                <CreditCard className="h-4 w-4 text-green-600" />
                Zugewiesene Bankdaten
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div>
                  <p className="text-muted-foreground">Kontoinhaber</p>
                  <p className="font-medium">{request.bank_account_holder}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Bank</p>
                  <p className="font-medium">{request.bank_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">IBAN</p>
                  <p className="font-medium font-mono">{request.bank_iban}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">BIC</p>
                  <p className="font-medium font-mono">{request.bank_bic}</p>
                </div>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Erstellt am: {new Date(request.created_at).toLocaleString('de-DE')}
            </div>
            {request.user_confirmed_at && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4" />
                Bestätigt am: {new Date(request.user_confirmed_at).toLocaleString('de-DE')}
              </div>
            )}
            {request.reviewed_at && (
              <div className="flex items-center gap-2 text-muted-foreground">
                {request.status === 'approved' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                Geprüft am: {new Date(request.reviewed_at).toLocaleString('de-DE')}
              </div>
            )}
          </div>

          {/* Rejection reason if rejected */}
          {request.status === 'rejected' && request.rejection_reason && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm font-medium text-red-600">Ablehnungsgrund:</p>
              <p className="text-sm mt-1">{request.rejection_reason}</p>
            </div>
          )}

          {/* Admin Actions - Only show for submitted status */}
          {request.status === 'submitted' && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Bankdaten zuweisen
              </h4>
              <p className="text-xs text-muted-foreground">
                Diese Bankdaten werden dem Nutzer für SEPA-Einzahlungen angezeigt.
              </p>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="bankAccountHolder" className="text-xs">
                    Kontoinhaber *
                  </Label>
                  <Input
                    id="bankAccountHolder"
                    placeholder="Max Mustermann"
                    value={bankAccountHolder}
                    onChange={(e) => setBankAccountHolder(e.target.value)}
                    className="h-9"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="bankIban" className="text-xs">
                    IBAN *
                  </Label>
                  <Input
                    id="bankIban"
                    placeholder="DE89 3704 0044 0532 0130 00"
                    value={bankIban}
                    onChange={(e) => setBankIban(e.target.value)}
                    className="h-9 font-mono"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="bankBic" className="text-xs">
                      BIC *
                    </Label>
                    <Input
                      id="bankBic"
                      placeholder="COBADEFFXXX"
                      value={bankBic}
                      onChange={(e) => setBankBic(e.target.value)}
                      className="h-9 font-mono"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="bankName" className="text-xs">
                      Bank *
                    </Label>
                    <Input
                      id="bankName"
                      placeholder="Commerzbank AG"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-xs">Ablehnungsgrund (optional bei Ablehnung)</Label>
                  <Textarea
                    placeholder="Grund für die Ablehnung..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={processing}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Ablehnen
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={processing}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Genehmigen
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
