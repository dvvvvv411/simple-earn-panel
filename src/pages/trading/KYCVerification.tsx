import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle2,
  Upload,
  Loader2,
  AlertTriangle,
  User,
  MapPin,
  Briefcase,
  CreditCard,
  Lock,
  Calendar,
  Check,
  ChevronsUpDown,
  Banknote,
  PiggyBank,
  TrendingUp,
  Gift,
  Home,
  Bitcoin,
  MoreHorizontal
} from "lucide-react";

// Countries list with Germany first - includes ISO codes for flag emojis
const COUNTRIES_WITH_FLAGS = [
  { name: "Deutschland", code: "DE" },
  { name: "Österreich", code: "AT" },
  { name: "Schweiz", code: "CH" },
  { name: "Afghanistan", code: "AF" },
  { name: "Albanien", code: "AL" },
  { name: "Algerien", code: "DZ" },
  { name: "Andorra", code: "AD" },
  { name: "Angola", code: "AO" },
  { name: "Argentinien", code: "AR" },
  { name: "Armenien", code: "AM" },
  { name: "Australien", code: "AU" },
  { name: "Aserbaidschan", code: "AZ" },
  { name: "Bahrain", code: "BH" },
  { name: "Bangladesch", code: "BD" },
  { name: "Belgien", code: "BE" },
  { name: "Bosnien und Herzegowina", code: "BA" },
  { name: "Brasilien", code: "BR" },
  { name: "Bulgarien", code: "BG" },
  { name: "Chile", code: "CL" },
  { name: "China", code: "CN" },
  { name: "Dänemark", code: "DK" },
  { name: "Ecuador", code: "EC" },
  { name: "Estland", code: "EE" },
  { name: "Finnland", code: "FI" },
  { name: "Frankreich", code: "FR" },
  { name: "Georgien", code: "GE" },
  { name: "Ghana", code: "GH" },
  { name: "Griechenland", code: "GR" },
  { name: "Großbritannien", code: "GB" },
  { name: "Indien", code: "IN" },
  { name: "Indonesien", code: "ID" },
  { name: "Irak", code: "IQ" },
  { name: "Iran", code: "IR" },
  { name: "Irland", code: "IE" },
  { name: "Island", code: "IS" },
  { name: "Israel", code: "IL" },
  { name: "Italien", code: "IT" },
  { name: "Japan", code: "JP" },
  { name: "Jordanien", code: "JO" },
  { name: "Kanada", code: "CA" },
  { name: "Kasachstan", code: "KZ" },
  { name: "Katar", code: "QA" },
  { name: "Kenia", code: "KE" },
  { name: "Kolumbien", code: "CO" },
  { name: "Kroatien", code: "HR" },
  { name: "Kuwait", code: "KW" },
  { name: "Lettland", code: "LV" },
  { name: "Libanon", code: "LB" },
  { name: "Liechtenstein", code: "LI" },
  { name: "Litauen", code: "LT" },
  { name: "Luxemburg", code: "LU" },
  { name: "Malaysia", code: "MY" },
  { name: "Marokko", code: "MA" },
  { name: "Mexiko", code: "MX" },
  { name: "Moldawien", code: "MD" },
  { name: "Monaco", code: "MC" },
  { name: "Montenegro", code: "ME" },
  { name: "Neuseeland", code: "NZ" },
  { name: "Niederlande", code: "NL" },
  { name: "Nigeria", code: "NG" },
  { name: "Nordmazedonien", code: "MK" },
  { name: "Norwegen", code: "NO" },
  { name: "Pakistan", code: "PK" },
  { name: "Peru", code: "PE" },
  { name: "Philippinen", code: "PH" },
  { name: "Polen", code: "PL" },
  { name: "Portugal", code: "PT" },
  { name: "Rumänien", code: "RO" },
  { name: "Russland", code: "RU" },
  { name: "Saudi-Arabien", code: "SA" },
  { name: "Schweden", code: "SE" },
  { name: "Serbien", code: "RS" },
  { name: "Singapur", code: "SG" },
  { name: "Slowakei", code: "SK" },
  { name: "Slowenien", code: "SI" },
  { name: "Spanien", code: "ES" },
  { name: "Südafrika", code: "ZA" },
  { name: "Südkorea", code: "KR" },
  { name: "Thailand", code: "TH" },
  { name: "Tschechien", code: "CZ" },
  { name: "Türkei", code: "TR" },
  { name: "Tunesien", code: "TN" },
  { name: "Ukraine", code: "UA" },
  { name: "Ungarn", code: "HU" },
  { name: "USA", code: "US" },
  { name: "Vereinigte Arabische Emirate", code: "AE" },
  { name: "Vietnam", code: "VN" },
  { name: "Zypern", code: "CY" }
];

// Convert ISO country code to flag emoji
const getFlagEmoji = (countryCode: string) => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

// Get country object by name
const getCountryByName = (name: string) => {
  return COUNTRIES_WITH_FLAGS.find(c => c.name === name);
};

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

const SOURCE_OF_FUNDS_WITH_ICONS = [
  { id: "salary", label: "Gehalt/Einkommen", icon: Banknote },
  { id: "savings", label: "Ersparnisse", icon: PiggyBank },
  { id: "investments", label: "Investitionen", icon: TrendingUp },
  { id: "inheritance", label: "Erbschaft", icon: Gift },
  { id: "realestate", label: "Immobilien", icon: Home },
  { id: "crypto", label: "Krypto-Gewinne", icon: Bitcoin },
  { id: "other", label: "Sonstiges", icon: MoreHorizontal }
];

interface KYCSubmission {
  id: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
}

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
  const [country, setCountry] = useState("Deutschland");
  const [nationality, setNationality] = useState("Deutschland");
  const [employmentStatus, setEmploymentStatus] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [sourceOfFunds, setSourceOfFunds] = useState<string[]>([]);
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);

  // Combobox states
  const [nationalityOpen, setNationalityOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

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

  const handleSourceOfFundsChange = (id: string, checked: boolean) => {
    if (checked) {
      setSourceOfFunds([...sourceOfFunds, id]);
    } else {
      setSourceOfFunds(sourceOfFunds.filter(s => s !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!firstName || !lastName || !birthDate || !birthPlace || !street || 
        !postalCode || !city || !country || !nationality || !employmentStatus || 
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
          country: country,
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
          <ShieldCheck className="w-7 h-7 md:w-8 md:h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Identitätsverifizierung</h1>
          <p className="text-white/80 mt-1 text-sm md:text-base">{subtitle}</p>
        </div>
      </div>
    </div>
  );

  // Progress steps data
  const progressSteps = [
    { icon: User, label: 'Persönliche Daten' },
    { icon: MapPin, label: 'Adresse' },
    { icon: Briefcase, label: 'Finanzen' },
    { icon: CreditCard, label: 'Dokumente' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Lade KYC-Status...</p>
        </div>
        <style>{animationStyles}</style>
      </div>
    );
  }

  // Status: Pending
  if (existingSubmission?.status === 'pending' && !showForm) {
    return (
      <div className="container max-w-3xl mx-auto py-4 md:py-8 px-4">
        <PremiumHeader subtitle="Ihr KYC-Antrag wird bearbeitet" />

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
              Unsere Experten prüfen Ihre eingereichten Unterlagen sorgfältig. 
              Sie erhalten eine Benachrichtigung, sobald die Prüfung abgeschlossen ist.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm text-primary border border-primary/20">
              <Calendar className="h-4 w-4" />
              Eingereicht am {formatDate(existingSubmission.created_at)}
            </div>
          </CardContent>
        </Card>

        <style>{animationStyles}</style>
      </div>
    );
  }

  // Status: Approved
  if (existingSubmission?.status === 'approved') {
    return (
      <div className="container max-w-3xl mx-auto py-4 md:py-8 px-4">
        <PremiumHeader subtitle="Ihre Identität wurde bestätigt" />

        <Card className="border-green-500/30 bg-gradient-to-br from-green-50/50 via-emerald-50/50 to-green-50/50 
                        dark:from-green-950/20 dark:via-emerald-950/20 dark:to-green-950/20 overflow-hidden relative">
          <div className="absolute top-4 left-8 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <div className="absolute top-12 right-12 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
          <div className="absolute bottom-8 left-16 w-2.5 h-2.5 bg-green-300 rounded-full animate-pulse" style={{ animationDelay: '500ms' }} />
          <div className="absolute bottom-16 right-8 w-2 h-2 bg-emerald-300 rounded-full animate-pulse" style={{ animationDelay: '700ms' }} />
          
          <CardContent className="text-center py-12 relative z-10">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 
                            flex items-center justify-center shadow-lg">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Verifizierung erfolgreich</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Ihre Identität wurde erfolgreich bestätigt. Sie haben nun Zugriff auf alle 
              Premium-Funktionen unserer Trading-Plattform.
            </p>
          </CardContent>
        </Card>

        <style>{animationStyles}</style>
      </div>
    );
  }

  // Show Form (new submission or rejected resubmission)
  return (
    <div className="container max-w-4xl mx-auto py-4 md:py-8 px-4">
      <PremiumHeader subtitle="Verifizieren Sie Ihre Identität, um alle Funktionen freizuschalten" />

      {/* Rejected Banner */}
      {existingSubmission?.status === 'rejected' && (
        <Card className="border-red-500/40 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 overflow-hidden mb-8">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-foreground mb-2">Verifizierung abgelehnt</h3>
                <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-3 mb-3 border border-red-200 dark:border-red-800">
                  <p className="text-red-700 dark:text-red-300 font-medium">
                    {existingSubmission.rejection_reason || "Bitte überprüfen Sie Ihre Angaben."}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Bitte überprüfen Sie Ihre Angaben und reichen Sie die Verifizierung erneut ein.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Indicator - Improved Layout */}
      <div className="flex items-center justify-center mb-8">
        {progressSteps.map((step, index) => (
          <React.Fragment key={step.label}>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary shadow-sm">
                <step.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs mt-2 text-foreground font-medium hidden md:block text-center whitespace-nowrap">
                {step.label}
              </span>
            </div>
            {index < progressSteps.length - 1 && (
              <div className="w-12 md:w-20 lg:w-24 h-0.5 bg-gradient-to-r from-primary/50 to-primary/30 mx-3" />
            )}
          </React.Fragment>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Data Card */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Persönliche Daten</CardTitle>
                <CardDescription>Ihre grundlegenden Informationen</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-base font-semibold text-foreground flex items-center gap-1.5">
                  Vorname <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-11 bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-base font-semibold text-foreground flex items-center gap-1.5">
                  Nachname <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-11 bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthDate" className="text-base font-semibold text-foreground flex items-center gap-1.5">
                  Geburtsdatum <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="h-11 bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthPlace" className="text-base font-semibold text-foreground flex items-center gap-1.5">
                  Geburtsort <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="birthPlace"
                  value={birthPlace}
                  onChange={(e) => setBirthPlace(e.target.value)}
                  className="h-11 bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-base font-semibold text-foreground flex items-center gap-1.5">
                Staatsangehörigkeit <span className="text-red-500">*</span>
              </Label>
              <Popover open={nationalityOpen} onOpenChange={setNationalityOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    role="combobox" 
                    aria-expanded={nationalityOpen}
                    className="h-11 w-full justify-between bg-background/50 border-border/50 hover:bg-background/80 font-normal"
                  >
                    <span className="flex items-center gap-2">
                      {nationality && getCountryByName(nationality) && (
                        <span className="text-lg">{getFlagEmoji(getCountryByName(nationality)!.code)}</span>
                      )}
                      {nationality || "Land auswählen..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Land suchen..." />
                    <CommandList>
                      <CommandEmpty>Kein Land gefunden.</CommandEmpty>
                      <CommandGroup>
                        {COUNTRIES_WITH_FLAGS.map((c) => (
                          <CommandItem
                            key={c.code}
                            value={c.name}
                            onSelect={() => {
                              setNationality(c.name);
                              setNationalityOpen(false);
                            }}
                            className="flex items-center gap-3 cursor-pointer"
                          >
                            <span className="text-xl">{getFlagEmoji(c.code)}</span>
                            <span className="flex-1">{c.name}</span>
                            <Check className={cn("h-4 w-4", nationality === c.name ? "opacity-100" : "opacity-0")} />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Address Card */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Adresse</CardTitle>
                <CardDescription>Ihre aktuelle Wohnanschrift</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="street" className="text-base font-semibold text-foreground flex items-center gap-1.5">
                Straße und Hausnummer <span className="text-red-500">*</span>
              </Label>
              <Input
                id="street"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="h-11 bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postalCode" className="text-base font-semibold text-foreground flex items-center gap-1.5">
                  Postleitzahl <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="postalCode"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="h-11 bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city" className="text-base font-semibold text-foreground flex items-center gap-1.5">
                  Stadt <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-11 bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-base font-semibold text-foreground flex items-center gap-1.5">
                Land <span className="text-red-500">*</span>
              </Label>
              <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    role="combobox" 
                    aria-expanded={countryOpen}
                    className="h-11 w-full justify-between bg-background/50 border-border/50 hover:bg-background/80 font-normal"
                  >
                    <span className="flex items-center gap-2">
                      {country && getCountryByName(country) && (
                        <span className="text-lg">{getFlagEmoji(getCountryByName(country)!.code)}</span>
                      )}
                      {country || "Land auswählen..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Land suchen..." />
                    <CommandList>
                      <CommandEmpty>Kein Land gefunden.</CommandEmpty>
                      <CommandGroup>
                        {COUNTRIES_WITH_FLAGS.map((c) => (
                          <CommandItem
                            key={c.code}
                            value={c.name}
                            onSelect={() => {
                              setCountry(c.name);
                              setCountryOpen(false);
                            }}
                            className="flex items-center gap-3 cursor-pointer"
                          >
                            <span className="text-xl">{getFlagEmoji(c.code)}</span>
                            <span className="flex-1">{c.name}</span>
                            <Check className={cn("h-4 w-4", country === c.name ? "opacity-100" : "opacity-0")} />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Employment & Finances Card */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Beschäftigung & Finanzen</CardTitle>
                <CardDescription>Informationen zu Ihrer beruflichen Situation</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employmentStatus" className="text-base font-semibold text-foreground flex items-center gap-1.5">
                  Beschäftigungsstatus <span className="text-red-500">*</span>
                </Label>
                <Select value={employmentStatus} onValueChange={setEmploymentStatus}>
                  <SelectTrigger className="h-11 bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20">
                    <SelectValue placeholder="Bitte wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_STATUS.map((status) => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthlyIncome" className="text-base font-semibold text-foreground flex items-center gap-1.5">
                  Monatliches Nettoeinkommen <span className="text-red-500">*</span>
                </Label>
                <Select value={monthlyIncome} onValueChange={setMonthlyIncome}>
                  <SelectTrigger className="h-11 bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20">
                    <SelectValue placeholder="Bitte wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {INCOME_RANGES.map((range) => (
                      <SelectItem key={range} value={range}>{range}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-base font-semibold text-foreground flex items-center gap-1.5">
                Herkunft der Einlagen <span className="text-red-500">*</span>
              </Label>
              <p className="text-sm text-muted-foreground -mt-1">Wählen Sie alle zutreffenden Optionen</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {SOURCE_OF_FUNDS_WITH_ICONS.map((source) => {
                  const isSelected = sourceOfFunds.includes(source.id);
                  const Icon = source.icon;
                  return (
                    <button
                      key={source.id}
                      type="button"
                      onClick={() => handleSourceOfFundsChange(source.id, !isSelected)}
                      className={cn(
                        "relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 min-h-[100px]",
                        isSelected 
                          ? "border-primary bg-primary/10 shadow-md" 
                          : "border-border/50 bg-background/30 hover:border-primary/40 hover:bg-primary/5"
                      )}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center mb-2 transition-colors",
                        isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className={cn(
                        "text-xs font-medium text-center leading-tight",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )}>
                        {source.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Upload Card */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Identitätsnachweis</CardTitle>
                <CardDescription>Bitte laden Sie Ihren Personalausweis oder Reisepass hoch</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Front */}
              <div className="space-y-2">
                <Label className="text-base font-semibold text-foreground flex items-center gap-1.5">
                  Vorderseite <span className="text-red-500">*</span>
                </Label>
                <div
                  onClick={() => frontInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer
                    ${idFront 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }
                  `}
                >
                  <input 
                    ref={frontInputRef}
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={(e) => setIdFront(e.target.files?.[0] || null)} 
                  />
                  
                  {idFront ? (
                    <div className="space-y-3">
                      <div className="w-full h-32 rounded-lg overflow-hidden bg-muted">
                        <img 
                          src={URL.createObjectURL(idFront)} 
                          alt="ID Vorderseite"
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="flex items-center justify-center gap-2 text-primary text-sm font-medium">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="truncate max-w-[150px]">{idFront.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Klicken zum Ändern</p>
                    </div>
                  ) : (
                    <div className="space-y-3 py-4">
                      <div className="w-14 h-14 mx-auto rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                        <Upload className="h-7 w-7 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Vorderseite hochladen</p>
                        <p className="text-sm text-muted-foreground mt-1">PNG, JPG bis 5MB</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Back */}
              <div className="space-y-2">
                <Label className="text-base font-semibold text-foreground flex items-center gap-1.5">
                  Rückseite <span className="text-red-500">*</span>
                </Label>
                <div
                  onClick={() => backInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer
                    ${idBack 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }
                  `}
                >
                  <input 
                    ref={backInputRef}
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={(e) => setIdBack(e.target.files?.[0] || null)} 
                  />
                  
                  {idBack ? (
                    <div className="space-y-3">
                      <div className="w-full h-32 rounded-lg overflow-hidden bg-muted">
                        <img 
                          src={URL.createObjectURL(idBack)} 
                          alt="ID Rückseite"
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="flex items-center justify-center gap-2 text-primary text-sm font-medium">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="truncate max-w-[150px]">{idBack.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Klicken zum Ändern</p>
                    </div>
                  ) : (
                    <div className="space-y-3 py-4">
                      <div className="w-14 h-14 mx-auto rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                        <Upload className="h-7 w-7 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Rückseite hochladen</p>
                        <p className="text-sm text-muted-foreground mt-1">PNG, JPG bis 5MB</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button 
          type="submit" 
          disabled={submitting}
          className="w-full h-14 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 
                     text-lg font-semibold shadow-lg hover:shadow-xl transition-all rounded-xl"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Wird eingereicht...
            </>
          ) : (
            <>
              <ShieldCheck className="mr-2 h-5 w-5" />
              Verifizierung einreichen
            </>
          )}
        </Button>

        {/* Security Footer */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pb-4">
          <Lock className="h-4 w-4 text-primary" />
          <span>Ihre Daten werden verschlüsselt übertragen und sicher gespeichert</span>
        </div>
      </form>

      <style>{animationStyles}</style>
    </div>
  );
}
