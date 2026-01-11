import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEurDepositStatus } from "@/hooks/useEurDepositStatus";
import { toast } from "@/components/ui/sonner";
import { 
  Landmark, 
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
  AlertCircle,
  Loader2,
  Calendar,
  Building2,
  Hash,
  Link2
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
        <Landmark className="w-7 h-7 md:w-8 md:h-8 text-white" />
      </div>
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Bankeinzahlung</h1>
        <p className="text-white/80 mt-1 text-sm md:text-base">{subtitle}</p>
      </div>
    </div>
  </div>
);

export default function BankDeposit() {
  const { eurDepositRequest, eurDepositStatus, loading, confirmVerification } = useEurDepositStatus();
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleConfirmVerification = async () => {
    if (!confirmChecked) {
      toast.error('Bitte bestätigen Sie, dass Sie die Verifizierung abgeschlossen haben');
      return;
    }

    setSubmitting(true);
    const success = await confirmVerification();
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

  if (!eurDepositRequest) {
    return (
      <div className="container max-w-3xl mx-auto py-4 md:py-8 px-4">
        <PremiumHeader subtitle="SEPA-Einzahlung nicht verfügbar" />
        <Card className="border-muted bg-muted/30">
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
              <Landmark className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              EUR-Einzahlung ist für Ihr Konto nicht aktiviert.
            </p>
          </CardContent>
        </Card>
        <style>{animationStyles}</style>
      </div>
    );
  }

  // Pending - User needs to complete verification
  if (eurDepositStatus === 'pending') {
    return (
      <div className="container max-w-4xl mx-auto py-4 md:py-8 px-4">
        <PremiumHeader subtitle="Richten Sie Ihr SEPA-Einzahlungskonto ein" />

        {/* Partner Bank Card */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 overflow-hidden relative mb-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <CardContent className="py-8 relative z-10">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center shadow-lg border border-primary/20 shrink-0">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground">
                  Ihre Partnerbank: {eurDepositRequest.partner_bank}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Um EUR-Einzahlungen per SEPA-Überweisung zu ermöglichen, eröffnen wir für Sie über 
                  unsere Partnerbank <span className="font-semibold text-foreground">{eurDepositRequest.partner_bank}</span> ein separates Anlegekonto.
                </p>
                <p className="text-muted-foreground">
                  Für die Kontoeröffnung ist eine Identitätsprüfung via <span className="font-semibold text-foreground">{eurDepositRequest.verification_type}</span> erforderlich.
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
              So funktioniert die {eurDepositRequest.verification_type}-Verifizierung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold shadow-md">
                1
              </div>
              <div className="pt-1">
                <p className="font-semibold text-foreground">Klicken Sie auf "Verifizierung starten"</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Sie werden zur {eurDepositRequest.verification_type}-Plattform weitergeleitet
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold shadow-md">
                2
              </div>
              <div className="pt-1">
                <p className="font-semibold text-foreground flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-primary" />
                  Halten Sie folgende Dokumente bereit
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1.5 ml-6">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                    Gültiger Personalausweis oder Reisepass
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                    Smartphone mit Kamera
                  </li>
                </ul>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold shadow-md">
                3
              </div>
              <div className="pt-1">
                <p className="font-semibold text-foreground flex items-center gap-2">
                  <Video className="h-4 w-4 text-primary" />
                  Video-Identifikation durchführen
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Ein Mitarbeiter prüft Ihre Identität per Video-Chat (ca. 5-10 Minuten)
                </p>
              </div>
            </div>

            {/* Step 4 - SMS Code */}
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold shadow-md">
                4
              </div>
              <div className="pt-1 flex-1">
                <p className="font-semibold text-foreground flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-primary" />
                  SMS-Code eingeben
                </p>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Am Ende der Verifizierung werden Sie nach einem Bestätigungscode gefragt. 
                  Diesen erhalten Sie per SMS von Ihrem persönlichen Berater:
                </p>
                
                {/* Code Display Box */}
                <div className="p-5 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Smartphone className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">Ihr SMS-Code</span>
                  </div>
                  {eurDepositRequest.sms_code ? (
                    <p className="text-3xl font-mono font-bold tracking-widest text-foreground">
                      {eurDepositRequest.sms_code}
                    </p>
                  ) : (
                    <p className="text-lg font-medium text-muted-foreground italic">
                      Noch nicht verfügbar
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-3">
                    {eurDepositRequest.sms_code 
                      ? `Geben Sie diesen SMS-Code am Ende der ${eurDepositRequest.verification_type}-Verifizierung ein.`
                      : 'Ihr Berater wird Ihnen den SMS-Code in Kürze mitteilen.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold shadow-md">
                5
              </div>
              <div className="pt-1">
                <p className="font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Bestätigung auf dieser Seite
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Nach erfolgreicher Verifizierung bestätigen Sie dies hier, damit wir Ihr Konto aktivieren können.
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
            <p className="text-sm text-muted-foreground mb-5">
              Verwenden Sie diese Daten für die Verifizierung bei {eurDepositRequest.verification_type} über unsere Partnerbank {eurDepositRequest.partner_bank}.
            </p>
            
            <div className="space-y-3">
              {/* Identcode */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Identcode</span>
                </div>
                <p className="text-xl font-mono font-bold tracking-wider">{eurDepositRequest.identcode}</p>
              </div>
              
              {/* SMS-Code */}
              <div className="p-4 rounded-xl bg-muted/30 border border-muted">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">SMS-Code</span>
                </div>
                {eurDepositRequest.sms_code ? (
                  <p className="text-xl font-mono font-bold tracking-wider">{eurDepositRequest.sms_code}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Noch nicht verfügbar</p>
                )}
              </div>
              
              {/* Identlink */}
              <div className="p-4 rounded-xl bg-muted/30 border border-muted">
                <div className="flex items-center gap-2 mb-2">
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Identlink</span>
                </div>
                <p className="text-sm text-muted-foreground break-all">{eurDepositRequest.verification_link}</p>
              </div>
              
              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/30 border border-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">E-Mail</span>
                  </div>
                  <p className="text-sm">{eurDepositRequest.contact_email}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Telefon</span>
                  </div>
                  <p className="text-sm">{eurDepositRequest.contact_phone}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Card */}
        <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
          <CardContent className="py-6 space-y-5">
            {/* Verifizierung starten - Secondary */}
            <Button 
              variant="outline"
              className="w-full h-11" 
              onClick={() => window.open(eurDepositRequest.verification_link, '_blank')}
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

              {/* Verifizierung bestätigen - Dominant Primary */}
              <Button 
                className="w-full mt-4 h-12 text-base font-semibold shadow-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                size="lg"
                onClick={handleConfirmVerification}
                disabled={!confirmChecked || submitting}
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                {submitting ? 'Wird eingereicht...' : 'Verifizierung bestätigen'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <style>{animationStyles}</style>
      </div>
    );
  }

  // Submitted - Waiting for review
  if (eurDepositStatus === 'submitted') {
    return (
      <div className="container max-w-3xl mx-auto py-4 md:py-8 px-4">
        <PremiumHeader subtitle="Ihr Antrag wird bearbeitet" />

        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <CardContent className="text-center py-12 relative z-10">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/30 
                            flex items-center justify-center shadow-lg border border-primary/20">
              <Clock className="h-10 w-10 text-primary animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Verifizierung wird geprüft</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Unsere Experten prüfen Ihre Verifizierung sorgfältig. 
              Sie erhalten eine Benachrichtigung, sobald Ihr Anlegekonto freigeschaltet wurde.
            </p>
            {eurDepositRequest.user_confirmed_at && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm text-primary border border-primary/20">
                <Calendar className="h-4 w-4" />
                Bestätigt am {formatDate(eurDepositRequest.user_confirmed_at)}
              </div>
            )}
          </CardContent>
        </Card>

        <style>{animationStyles}</style>
      </div>
    );
  }

  // Approved - Show bank details
  if (eurDepositStatus === 'approved') {
    return (
      <div className="container max-w-3xl mx-auto py-4 md:py-8 px-4">
        <PremiumHeader subtitle="Ihr Anlegekonto ist aktiv" />

        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 
                        dark:from-primary/10 dark:via-primary/15 dark:to-primary/10 overflow-hidden relative mb-6">
          <div className="absolute top-4 left-8 w-2 h-2 bg-primary rounded-full animate-pulse" />
          <div className="absolute top-12 right-12 w-3 h-3 bg-primary/80 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
          <div className="absolute bottom-8 left-16 w-2.5 h-2.5 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: '500ms' }} />
          <div className="absolute bottom-16 right-8 w-2 h-2 bg-primary/70 rounded-full animate-pulse" style={{ animationDelay: '700ms' }} />
          
          <CardContent className="text-center py-10 relative z-10">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-primary/80 
                            flex items-center justify-center shadow-lg">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Anlegekonto aktiv</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Sie können jetzt EUR-Einzahlungen per SEPA-Überweisung tätigen.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Landmark className="h-5 w-5 text-primary" />
              </div>
              Bankverbindung für Einzahlungen
            </CardTitle>
            <CardDescription>Überweisen Sie an folgende Bankverbindung</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="p-4 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 border border-muted">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Empfänger</p>
                <p className="font-semibold text-foreground">Trading Platform GmbH</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 border border-muted">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">IBAN</p>
                <p className="font-semibold font-mono text-foreground tracking-wide">DE89 3704 0044 0532 0130 00</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 border border-muted">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">BIC</p>
                <p className="font-semibold font-mono text-foreground">COBADEFFXXX</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                <p className="text-xs font-medium text-primary uppercase tracking-wide mb-1">Verwendungszweck</p>
                <p className="font-bold font-mono text-foreground text-lg tracking-wider">
                  {eurDepositRequest.user_id.slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>

            <Alert className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700 dark:text-amber-300">
                Bitte verwenden Sie exakt diesen Verwendungszweck, damit wir die Einzahlung Ihrem Konto zuordnen können.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <style>{animationStyles}</style>
      </div>
    );
  }

  // Rejected
  if (eurDepositStatus === 'rejected') {
    return (
      <div className="container max-w-3xl mx-auto py-4 md:py-8 px-4">
        <PremiumHeader subtitle="Verifizierung nicht erfolgreich" />

        <Card className="border-red-500/30 bg-gradient-to-br from-red-50/50 via-rose-50/50 to-red-50/50 
                        dark:from-red-950/20 dark:via-rose-950/20 dark:to-red-950/20 overflow-hidden relative">
          <CardContent className="text-center py-12 relative z-10">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-500 to-rose-500 
                            flex items-center justify-center shadow-lg">
              <XCircle className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Verifizierung abgelehnt</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Leider konnte Ihre Verifizierung nicht bestätigt werden.
            </p>
            
            {eurDepositRequest.rejection_reason && (
              <div className="mt-6 p-4 rounded-xl bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-left max-w-md mx-auto">
                <p className="text-sm font-semibold text-red-700 dark:text-red-300 mb-1">Grund:</p>
                <p className="text-sm text-red-600 dark:text-red-400">{eurDepositRequest.rejection_reason}</p>
              </div>
            )}
            
            <p className="text-sm text-muted-foreground mt-6">
              Bitte kontaktieren Sie unseren Support für weitere Informationen.
            </p>
          </CardContent>
        </Card>

        <style>{animationStyles}</style>
      </div>
    );
  }

  return null;
}
