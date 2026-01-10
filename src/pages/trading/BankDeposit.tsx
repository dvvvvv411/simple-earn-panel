import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEurDepositStatus } from "@/hooks/useEurDepositStatus";
import { toast } from "@/components/ui/sonner";
import { 
  Landmark, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Phone, 
  Mail,
  Shield,
  Smartphone,
  Video,
  FileCheck,
  AlertCircle,
  Copy
} from "lucide-react";

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

  const handleCopyCode = () => {
    if (eurDepositRequest?.verification_code) {
      navigator.clipboard.writeText(eurDepositRequest.verification_code);
      toast.success('Code wurde kopiert');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!eurDepositRequest) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Landmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              EUR-Einzahlung ist für Ihr Konto nicht aktiviert.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pending - User needs to complete verification
  if (eurDepositStatus === 'pending') {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Landmark className="h-8 w-8 text-primary" />
            Bankeinzahlung einrichten
          </h1>
          <p className="text-muted-foreground mt-1">
            Eröffnen Sie ein Anlegekonto für SEPA-Einzahlungen
          </p>
        </div>

        {/* Partner Bank Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
                <Landmark className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  Ihre Partnerbank: {eurDepositRequest.partner_bank}
                </h2>
                <p className="text-muted-foreground mt-2 leading-relaxed">
                  Um EUR-Einzahlungen per SEPA-Überweisung zu ermöglichen, eröffnen wir für Sie über 
                  unsere Partnerbank <strong>{eurDepositRequest.partner_bank}</strong> ein separates Anlegekonto.
                </p>
                <p className="text-muted-foreground mt-2">
                  Für die Kontoeröffnung ist eine Identitätsprüfung via <strong>{eurDepositRequest.verification_type}</strong> erforderlich.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification Process */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              So funktioniert die {eurDepositRequest.verification_type}-Verifizierung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                  1
                </div>
                <div>
                  <p className="font-medium">Klicken Sie auf "Verifizierung starten"</p>
                  <p className="text-sm text-muted-foreground">
                    Sie werden zur {eurDepositRequest.verification_type}-Plattform weitergeleitet
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                  2
                </div>
                <div>
                  <p className="font-medium flex items-center gap-2">
                    <FileCheck className="h-4 w-4" />
                    Halten Sie folgende Dokumente bereit
                  </p>
                  <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                    <li>• Gültiger Personalausweis oder Reisepass</li>
                    <li>• Smartphone mit Kamera</li>
                  </ul>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                  3
                </div>
                <div>
                  <p className="font-medium flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Video-Identifikation durchführen
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Ein Mitarbeiter prüft Ihre Identität per Video-Chat (ca. 5-10 Minuten)
                  </p>
                </div>
              </div>

              {/* Step 4 - SMS Code */}
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                  4
                </div>
                <div className="flex-1">
                  <p className="font-medium flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    SMS-Code eingeben
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Am Ende der Verifizierung werden Sie nach einem Bestätigungscode gefragt. 
                    Diesen erhalten Sie per SMS von Ihrem persönlichen Berater:
                  </p>
                  
                  {/* Code Display */}
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-primary flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          Ihr Verifizierungscode
                        </p>
                        <p className="text-2xl font-mono font-bold mt-1">
                          {eurDepositRequest.verification_code}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleCopyCode}>
                        <Copy className="h-4 w-4 mr-1" />
                        Kopieren
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Geben Sie diesen Code am Ende der {eurDepositRequest.verification_type}-Verifizierung ein.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                  5
                </div>
                <div>
                  <p className="font-medium flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Bestätigung auf dieser Seite
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Nach erfolgreicher Verifizierung bestätigen Sie dies hier, damit wir Ihr Konto aktivieren können.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Kontakt bei Fragen</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{eurDepositRequest.contact_email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{eurDepositRequest.contact_phone}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => window.open(eurDepositRequest.verification_link, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Verifizierung starten
            </Button>

            <div className="border-t pt-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="confirm"
                  checked={confirmChecked}
                  onCheckedChange={(checked) => setConfirmChecked(checked === true)}
                />
                <label 
                  htmlFor="confirm" 
                  className="text-sm cursor-pointer leading-relaxed"
                >
                  Ich habe die Verifizierung erfolgreich abgeschlossen und den Bestätigungscode korrekt eingegeben.
                </label>
              </div>

              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={handleConfirmVerification}
                disabled={!confirmChecked || submitting}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {submitting ? 'Wird eingereicht...' : 'Verifizierung bestätigen'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Submitted - Waiting for review
  if (eurDepositStatus === 'submitted') {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Landmark className="h-8 w-8 text-primary" />
            Bankeinzahlung
          </h1>
        </div>

        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 mx-auto mb-4">
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Verifizierung wird geprüft</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Ihre Verifizierung wird derzeit von unserem Team überprüft. 
              Sie erhalten eine Benachrichtigung, sobald Ihr Anlegekonto freigeschaltet wurde.
            </p>
            {eurDepositRequest.user_confirmed_at && (
              <p className="text-sm text-muted-foreground mt-4">
                Bestätigt am: {new Date(eurDepositRequest.user_confirmed_at).toLocaleString('de-DE')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Approved - Show bank details
  if (eurDepositStatus === 'approved') {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Landmark className="h-8 w-8 text-primary" />
            Bankeinzahlung
          </h1>
        </div>

        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Ihr Anlegekonto ist aktiv</h2>
            <p className="text-muted-foreground">
              Sie können jetzt EUR-Einzahlungen per SEPA-Überweisung tätigen.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bankverbindung für Einzahlungen</CardTitle>
            <CardDescription>Überweisen Sie an folgende Bankverbindung</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Empfänger</p>
                <p className="font-medium">Trading Platform GmbH</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">IBAN</p>
                <p className="font-medium font-mono">DE89 3704 0044 0532 0130 00</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">BIC</p>
                <p className="font-medium font-mono">COBADEFFXXX</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Verwendungszweck</p>
                <p className="font-medium font-mono">{eurDepositRequest.user_id.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Bitte verwenden Sie exakt diesen Verwendungszweck, damit wir die Einzahlung Ihrem Konto zuordnen können.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Rejected
  if (eurDepositStatus === 'rejected') {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Landmark className="h-8 w-8 text-primary" />
            Bankeinzahlung
          </h1>
        </div>

        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 mx-auto mb-4">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Verifizierung abgelehnt</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Leider konnte Ihre Verifizierung nicht bestätigt werden.
            </p>
            {eurDepositRequest.rejection_reason && (
              <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-left max-w-md mx-auto">
                <p className="text-sm font-medium text-red-600">Grund:</p>
                <p className="text-sm mt-1">{eurDepositRequest.rejection_reason}</p>
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-4">
              Bitte kontaktieren Sie unseren Support für weitere Informationen.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
