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
  CreditCard, 
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
  FileText,
  Download,
  Euro,
  Shield,
  Hash
} from "lucide-react";

interface CreditRequest {
  id: string;
  user_id: string;
  status: string;
  bank_statements_paths: string[] | null;
  salary_slips_paths: string[] | null;
  health_insurance: string | null;
  tax_number: string | null;
  tax_id: string | null;
  documents_submitted_at: string | null;
  partner_bank: string | null;
  credit_amount: number | null;
  contact_email: string | null;
  contact_phone: string | null;
  identcode: string | null;
  verification_link: string | null;
  sms_code: string | null;
  user_confirmed_at: string | null;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
}

interface CreditDetailDialogProps {
  request: CreditRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreditDetailDialog({ request, open, onOpenChange, onSuccess }: CreditDetailDialogProps) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  
  // Ident data fields (for documents_submitted -> ident_pending transition)
  const [partnerBank, setPartnerBank] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [identcode, setIdentcode] = useState("");
  const [verificationLink, setVerificationLink] = useState("");

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'documents_pending':
        return { color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', label: 'Dokumente ausstehend', icon: Clock };
      case 'documents_submitted':
        return { color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', label: 'Dokumente eingereicht', icon: FileText };
      case 'ident_pending':
        return { color: 'bg-purple-500/10 text-purple-600 border-purple-500/20', label: 'Ident ausstehend', icon: Key };
      case 'ident_submitted':
        return { color: 'bg-orange-500/10 text-orange-600 border-orange-500/20', label: 'Ident eingereicht', icon: Send };
      case 'approved':
        return { color: 'bg-green-500/10 text-green-600 border-green-500/20', label: 'Genehmigt', icon: CheckCircle };
      case 'rejected':
        return { color: 'bg-red-500/10 text-red-600 border-red-500/20', label: 'Abgelehnt', icon: XCircle };
      default:
        return { color: 'bg-muted text-muted-foreground', label: status, icon: Clock };
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-';
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const getDocumentUrl = async (path: string) => {
    const { data } = await supabase.storage
      .from('credit-documents')
      .createSignedUrl(path, 3600);
    return data?.signedUrl;
  };

  const handleDocumentDownload = async (path: string, fileName: string) => {
    try {
      const url = await getDocumentUrl(path);
      if (url) {
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Fehler beim Herunterladen des Dokuments');
    }
  };

  // Approve documents and add ident data
  const handleApproveDocuments = async () => {
    if (!partnerBank.trim() || !creditAmount || !contactEmail.trim() || !contactPhone.trim() || !identcode.trim() || !verificationLink.trim()) {
      toast.error('Bitte füllen Sie alle Identdaten aus');
      return;
    }

    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Nicht authentifiziert');

      const { error } = await supabase
        .from('credit_requests')
        .update({
          status: 'ident_pending',
          partner_bank: partnerBank.trim(),
          credit_amount: parseFloat(creditAmount),
          contact_email: contactEmail.trim(),
          contact_phone: contactPhone.trim(),
          identcode: identcode.trim(),
          verification_link: verificationLink.trim(),
          reviewed_by: session.user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      if (error) throw error;

      toast.success('Dokumente genehmigt - Identdaten wurden hinzugefügt');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error approving documents:', error);
      toast.error('Fehler beim Genehmigen der Dokumente');
    } finally {
      setProcessing(false);
    }
  };

  // Final approval of credit
  const handleApproveCredit = async () => {
    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Nicht authentifiziert');

      const { error } = await supabase
        .from('credit_requests')
        .update({
          status: 'approved',
          reviewed_by: session.user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      if (error) throw error;

      toast.success('Kredit wurde genehmigt');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error approving credit:', error);
      toast.error('Fehler beim Genehmigen des Kredits');
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
        .from('credit_requests')
        .update({
          status: 'rejected',
          reviewed_by: session.user.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq('id', request.id);

      if (error) throw error;

      toast.success('Antrag wurde abgelehnt');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Fehler beim Ablehnen des Antrags');
    } finally {
      setProcessing(false);
    }
  };

  const statusConfig = getStatusConfig(request.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Kredit-Antrag Details
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

          {/* Credit Amount if set */}
          {request.credit_amount && (
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Euro className="h-5 w-5 text-primary" />
                <span className="font-medium">Kreditbetrag</span>
              </div>
              <p className="text-2xl font-bold text-primary">{formatCurrency(request.credit_amount)}</p>
              {request.partner_bank && (
                <p className="text-sm text-muted-foreground mt-1">über {request.partner_bank}</p>
              )}
            </div>
          )}

          {/* Documents Section */}
          {(request.bank_statements_paths?.length || request.salary_slips_paths?.length || request.health_insurance || request.tax_number || request.tax_id) && (
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2 text-sm border-b pb-2">
                <FileText className="h-4 w-4" />
                Eingereichte Unterlagen
              </h4>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                {request.health_insurance && (
                  <div>
                    <p className="text-muted-foreground">Krankenkasse</p>
                    <p className="font-medium">{request.health_insurance}</p>
                  </div>
                )}
                {request.tax_number && (
                  <div>
                    <p className="text-muted-foreground">Steuernummer</p>
                    <p className="font-medium font-mono">{request.tax_number}</p>
                  </div>
                )}
                {request.tax_id && (
                  <div>
                    <p className="text-muted-foreground">Steuer-ID</p>
                    <p className="font-medium font-mono">{request.tax_id}</p>
                  </div>
                )}
              </div>

              {/* Document Downloads */}
              <div className="space-y-2">
                {request.bank_statements_paths && request.bank_statements_paths.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Kontoauszüge ({request.bank_statements_paths.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {request.bank_statements_paths.map((path, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          onClick={() => handleDocumentDownload(path, `Kontoauszug_${idx + 1}`)}
                          className="gap-1"
                        >
                          <Download className="h-3 w-3" />
                          Kontoauszug {idx + 1}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {request.salary_slips_paths && request.salary_slips_paths.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Lohnabrechnungen ({request.salary_slips_paths.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {request.salary_slips_paths.map((path, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          onClick={() => handleDocumentDownload(path, `Lohnabrechnung_${idx + 1}`)}
                          className="gap-1"
                        >
                          <Download className="h-3 w-3" />
                          Lohnabrechnung {idx + 1}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ident Details (if set) */}
          {request.identcode && (
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2 text-sm border-b pb-2">
                <Shield className="h-4 w-4" />
                Verifizierungsdaten
              </h4>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground mt-0.5" />
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
                <div className="flex items-start gap-2 col-span-2">
                  <Link className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-muted-foreground">Link</p>
                    <a 
                      href={request.verification_link || '#'} 
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
          )}

          {/* Dates */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Erstellt am: {new Date(request.created_at).toLocaleString('de-DE')}
            </div>
            {request.documents_submitted_at && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
                Dokumente eingereicht: {new Date(request.documents_submitted_at).toLocaleString('de-DE')}
              </div>
            )}
            {request.user_confirmed_at && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4" />
                Ident bestätigt: {new Date(request.user_confirmed_at).toLocaleString('de-DE')}
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

          {/* Admin Actions - Documents Submitted */}
          {request.status === 'documents_submitted' && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Identdaten eingeben (bei Genehmigung)
              </h4>
              <p className="text-xs text-muted-foreground">
                Nach Genehmigung der Dokumente werden diese Identdaten dem Nutzer angezeigt.
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="partnerBank" className="text-xs">Partnerbank *</Label>
                  <Input
                    id="partnerBank"
                    placeholder="z.B. Solarisbank"
                    value={partnerBank}
                    onChange={(e) => setPartnerBank(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="creditAmount" className="text-xs">Kreditbetrag (€) *</Label>
                  <Input
                    id="creditAmount"
                    type="number"
                    placeholder="10000"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contactEmail" className="text-xs">Email *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="service@bank.de"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contactPhone" className="text-xs">Telefon *</Label>
                  <Input
                    id="contactPhone"
                    placeholder="+49 30 12345678"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="identcode" className="text-xs">Identcode *</Label>
                  <Input
                    id="identcode"
                    placeholder="ABC123"
                    value={identcode}
                    onChange={(e) => setIdentcode(e.target.value)}
                    className="h-9 font-mono"
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="verificationLink" className="text-xs">Verifizierungslink *</Label>
                  <Input
                    id="verificationLink"
                    type="url"
                    placeholder="https://webid.com/verify/..."
                    value={verificationLink}
                    onChange={(e) => setVerificationLink(e.target.value)}
                    className="h-9"
                  />
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
                  onClick={handleApproveDocuments}
                  disabled={processing}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Dokumente genehmigen
                </Button>
              </div>
            </div>
          )}

          {/* Admin Actions - Ident Submitted */}
          {request.status === 'ident_submitted' && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                Kredit-Verifizierung prüfen
              </h4>
              
              <div className="space-y-2">
                <Label className="text-xs">Ablehnungsgrund (optional bei Ablehnung)</Label>
                <Textarea
                  placeholder="Grund für die Ablehnung..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={2}
                />
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
                  onClick={handleApproveCredit}
                  disabled={processing}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Kredit genehmigen
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
