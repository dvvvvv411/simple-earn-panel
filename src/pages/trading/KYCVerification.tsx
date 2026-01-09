import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ShieldCheck, 
  Clock, 
  XCircle, 
  CheckCircle2,
  Upload,
  Loader2,
  AlertCircle
} from "lucide-react";

// Countries list with Germany first
const COUNTRIES = [
  "Deutschland",
  "Österreich",
  "Schweiz",
  "Afghanistan", "Albanien", "Algerien", "Andorra", "Angola", "Argentinien", "Armenien",
  "Australien", "Aserbaidschan", "Bahrain", "Bangladesch", "Belgien", "Bosnien und Herzegowina",
  "Brasilien", "Bulgarien", "Chile", "China", "Dänemark", "Ecuador", "Estland", "Finnland",
  "Frankreich", "Georgien", "Ghana", "Griechenland", "Großbritannien", "Indien", "Indonesien",
  "Irak", "Iran", "Irland", "Island", "Israel", "Italien", "Japan", "Jordanien", "Kanada",
  "Kasachstan", "Katar", "Kenia", "Kolumbien", "Kroatien", "Kuwait", "Lettland", "Libanon",
  "Liechtenstein", "Litauen", "Luxemburg", "Malaysia", "Marokko", "Mexiko", "Moldawien",
  "Monaco", "Montenegro", "Neuseeland", "Niederlande", "Nigeria", "Nordmazedonien", "Norwegen",
  "Pakistan", "Peru", "Philippinen", "Polen", "Portugal", "Rumänien", "Russland", "Saudi-Arabien",
  "Schweden", "Serbien", "Singapur", "Slowakei", "Slowenien", "Spanien", "Südafrika", "Südkorea",
  "Thailand", "Tschechien", "Türkei", "Tunesien", "Ukraine", "Ungarn", "USA", "Vereinigte Arabische Emirate",
  "Vietnam", "Zypern"
];

const EMPLOYMENT_STATUS = [
  "Angestellt",
  "Selbstständig", 
  "Student",
  "Rentner",
  "Arbeitslos",
  "Sonstiges"
];

const INCOME_RANGES = [
  "Unter 1.000€",
  "1.000-2.500€",
  "2.500-5.000€",
  "5.000-10.000€",
  "Über 10.000€"
];

const SOURCE_OF_FUNDS = [
  "Gehalt/Einkommen",
  "Ersparnisse",
  "Investitionen/Aktien",
  "Erbschaft",
  "Immobilienverkauf",
  "Krypto-Gewinne",
  "Sonstiges"
];

interface KYCSubmission {
  id: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
}

export default function KYCVerification() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingSubmission, setExistingSubmission] = useState<KYCSubmission | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [street, setStreet] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [nationality, setNationality] = useState("Deutschland");
  const [employmentStatus, setEmploymentStatus] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [sourceOfFunds, setSourceOfFunds] = useState<string[]>([]);
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);

  useEffect(() => {
    checkExistingSubmission();
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        if (profile.first_name) setFirstName(profile.first_name);
        if (profile.last_name) setLastName(profile.last_name);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const checkExistingSubmission = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('kyc_submissions')
        .select('id, status, rejection_reason, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      setExistingSubmission(data);
      
      // If rejected, show form by default
      if (data?.status === 'rejected') {
        setShowForm(true);
      }
    } catch (error) {
      console.error('Error checking KYC status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSourceOfFundsChange = (source: string, checked: boolean) => {
    if (checked) {
      setSourceOfFunds([...sourceOfFunds, source]);
    } else {
      setSourceOfFunds(sourceOfFunds.filter(s => s !== source));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!firstName || !lastName || !birthDate || !birthPlace || !street || 
        !postalCode || !city || !nationality || !employmentStatus || 
        !monthlyIncome || sourceOfFunds.length === 0 || !idFront || !idBack) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Felder aus.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Nicht authentifiziert');

      const userId = session.user.id;

      // Upload ID front
      const frontExt = idFront.name.split('.').pop();
      const frontPath = `${userId}/id-front-${Date.now()}.${frontExt}`;
      const { error: frontError } = await supabase.storage
        .from('kyc-documents')
        .upload(frontPath, idFront);

      if (frontError) throw frontError;

      // Upload ID back
      const backExt = idBack.name.split('.').pop();
      const backPath = `${userId}/id-back-${Date.now()}.${backExt}`;
      const { error: backError } = await supabase.storage
        .from('kyc-documents')
        .upload(backPath, idBack);

      if (backError) throw backError;

      // Create submission
      const { error: submitError } = await supabase
        .from('kyc_submissions')
        .insert({
          user_id: userId,
          first_name: firstName,
          last_name: lastName,
          birth_date: birthDate,
          birth_place: birthPlace,
          street: street,
          postal_code: postalCode,
          city: city,
          nationality: nationality,
          employment_status: employmentStatus,
          monthly_income: monthlyIncome,
          source_of_funds: sourceOfFunds,
          id_front_path: frontPath,
          id_back_path: backPath,
          status: 'pending'
        });

      if (submitError) throw submitError;

      // Send Telegram notification
      try {
        await supabase.functions.invoke('send-telegram-notification', {
          body: {
            event: 'kyc_submitted',
            data: {
              user_email: session.user.email,
              user_name: `${firstName} ${lastName}`
            }
          }
        });
      } catch (telegramError) {
        console.error('Telegram notification failed:', telegramError);
      }

      toast({
        title: "Erfolgreich eingereicht",
        description: "Ihre KYC-Verifizierung wurde eingereicht und wird geprüft.",
      });

      // Refresh status
      setShowForm(false);
      checkExistingSubmission();
    } catch (error: any) {
      console.error('Error submitting KYC:', error);
      toast({
        title: "Fehler",
        description: error.message || "KYC-Einreichung fehlgeschlagen.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Status: Pending
  if (existingSubmission?.status === 'pending' && !showForm) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-amber-500/50 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
          <CardContent className="text-center py-12">
            <Clock className="h-20 w-20 text-amber-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-foreground mb-3">Verifizierung wird geprüft</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Wir prüfen Ihre Unterlagen. Dies kann bis zu 24 Stunden dauern. 
              Sie werden benachrichtigt, sobald die Prüfung abgeschlossen ist.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Eingereicht am: {new Date(existingSubmission.created_at).toLocaleDateString('de-DE')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Status: Approved
  if (existingSubmission?.status === 'approved') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-green-500/50 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardContent className="text-center py-12">
            <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-foreground mb-3">Verifizierung erfolgreich</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Ihre Identität wurde erfolgreich verifiziert. 
              Sie können alle Funktionen der Plattform uneingeschränkt nutzen.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Status: Rejected (show rejection message + form)
  const rejectionBanner = existingSubmission?.status === 'rejected' && (
    <Card className="border-red-500/50 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 mb-6">
      <CardContent className="py-6">
        <div className="flex items-start gap-4">
          <XCircle className="h-8 w-8 text-red-500 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-foreground mb-1">Verifizierung abgelehnt</h3>
            <p className="text-red-600 dark:text-red-400 mb-2">
              <strong>Grund:</strong> {existingSubmission.rejection_reason}
            </p>
            <p className="text-sm text-muted-foreground">
              Bitte korrigieren Sie die Angaben und reichen Sie die Verifizierung erneut ein.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Show Form
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <ShieldCheck className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-foreground">KYC-Verifizierung</h1>
        <p className="text-muted-foreground mt-2">
          Bitte vervollständigen Sie Ihre Identitätsverifizierung, um alle Funktionen freizuschalten.
        </p>
      </div>

      {rejectionBanner}

      <form onSubmit={handleSubmit}>
        <Card className="bg-card border-border mb-6">
          <CardHeader>
            <CardTitle>Persönliche Daten</CardTitle>
            <CardDescription>Geben Sie Ihre persönlichen Informationen ein.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Vorname *</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Max"
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Nachname *</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Mustermann"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="birthDate">Geburtsdatum *</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="birthPlace">Geburtsort *</Label>
                <Input
                  id="birthPlace"
                  value={birthPlace}
                  onChange={(e) => setBirthPlace(e.target.value)}
                  placeholder="Berlin"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="nationality">Staatsangehörigkeit *</Label>
              <Select value={nationality} onValueChange={setNationality}>
                <SelectTrigger>
                  <SelectValue placeholder="Wählen Sie Ihre Staatsangehörigkeit" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border mb-6">
          <CardHeader>
            <CardTitle>Adresse</CardTitle>
            <CardDescription>Ihre aktuelle Meldeadresse.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="street">Straße und Hausnummer *</Label>
              <Input
                id="street"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Musterstraße 123"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="postalCode">PLZ *</Label>
                <Input
                  id="postalCode"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="12345"
                  required
                />
              </div>
              <div>
                <Label htmlFor="city">Stadt *</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Berlin"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border mb-6">
          <CardHeader>
            <CardTitle>Beschäftigung & Finanzen</CardTitle>
            <CardDescription>Informationen zu Ihrer beruflichen Situation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employmentStatus">Beschäftigungsstatus *</Label>
                <Select value={employmentStatus} onValueChange={setEmploymentStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wählen Sie Ihren Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_STATUS.map((status) => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="monthlyIncome">Monatliches Nettoeinkommen *</Label>
                <Select value={monthlyIncome} onValueChange={setMonthlyIncome}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wählen Sie einen Bereich" />
                  </SelectTrigger>
                  <SelectContent>
                    {INCOME_RANGES.map((range) => (
                      <SelectItem key={range} value={range}>{range}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="mb-3 block">Herkunft der Einlagen *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SOURCE_OF_FUNDS.map((source) => (
                  <div key={source} className="flex items-center space-x-2">
                    <Checkbox
                      id={`source-${source}`}
                      checked={sourceOfFunds.includes(source)}
                      onCheckedChange={(checked) => handleSourceOfFundsChange(source, checked as boolean)}
                    />
                    <label 
                      htmlFor={`source-${source}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {source}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border mb-6">
          <CardHeader>
            <CardTitle>Identitätsnachweis</CardTitle>
            <CardDescription>Laden Sie Vorder- und Rückseite Ihres Personalausweises hoch.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="idFront" className="mb-2 block">Personalausweis Vorderseite *</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <input
                    id="idFront"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setIdFront(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <label htmlFor="idFront" className="cursor-pointer">
                    {idFront ? (
                      <div className="space-y-2">
                        <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto" />
                        <p className="text-sm text-foreground font-medium">{idFront.name}</p>
                        <p className="text-xs text-muted-foreground">Klicken zum Ändern</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                        <p className="text-sm text-muted-foreground">Bild hochladen</p>
                        <p className="text-xs text-muted-foreground">JPG, PNG (max. 5MB)</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
              <div>
                <Label htmlFor="idBack" className="mb-2 block">Personalausweis Rückseite *</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <input
                    id="idBack"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setIdBack(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <label htmlFor="idBack" className="cursor-pointer">
                    {idBack ? (
                      <div className="space-y-2">
                        <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto" />
                        <p className="text-sm text-foreground font-medium">{idBack.name}</p>
                        <p className="text-xs text-muted-foreground">Klicken zum Ändern</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                        <p className="text-sm text-muted-foreground">Bild hochladen</p>
                        <p className="text-xs text-muted-foreground">JPG, PNG (max. 5MB)</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Stellen Sie sicher, dass alle Angaben auf dem Ausweis gut lesbar sind und das Bild nicht unscharf ist.
              </p>
            </div>
          </CardContent>
        </Card>

        <Button 
          type="submit" 
          className="w-full py-6 text-lg"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Wird eingereicht...
            </>
          ) : (
            <>
              <ShieldCheck className="h-5 w-5 mr-2" />
              KYC-Verifizierung einreichen
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
