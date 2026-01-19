import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Eye, Code, Zap, Clock, ArrowRight, TrendingUp, TrendingDown, CheckCircle2, Loader2, ShieldCheck, XCircle, Landmark, Bitcoin, CreditCard, Key, FileText, Briefcase, Coins, UserPlus, Unlock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Branding {
  id: string;
  name: string;
  accent_color: string | null;
  domain: string | null;
  logo_path: string | null;
}

export default function EmailTemplates() {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [kycPreviewOpen, setKycPreviewOpen] = useState(false);
  const [kycRejectionPreviewOpen, setKycRejectionPreviewOpen] = useState(false);
  const [bankDepositPreviewOpen, setBankDepositPreviewOpen] = useState(false);
  const [cryptoDepositPreviewOpen, setCryptoDepositPreviewOpen] = useState(false);
  const [bankKycApprovedPreviewOpen, setBankKycApprovedPreviewOpen] = useState(false);
  const [bankKycRejectedPreviewOpen, setBankKycRejectedPreviewOpen] = useState(false);
  const [creditActivatedPreviewOpen, setCreditActivatedPreviewOpen] = useState(false);
  const [creditIdentPreviewOpen, setCreditIdentPreviewOpen] = useState(false);
  const [creditApprovedPreviewOpen, setCreditApprovedPreviewOpen] = useState(false);
  const [creditRejectedPreviewOpen, setCreditRejectedPreviewOpen] = useState(false);
  const [previewProfit, setPreviewProfit] = useState(true);
  const [brandings, setBrandings] = useState<Branding[]>([]);
  const [selectedBranding, setSelectedBranding] = useState<Branding | null>(null);
  const [selectedKycBranding, setSelectedKycBranding] = useState<Branding | null>(null);
  const [selectedKycRejectionBranding, setSelectedKycRejectionBranding] = useState<Branding | null>(null);
  const [selectedBankDepositBranding, setSelectedBankDepositBranding] = useState<Branding | null>(null);
  const [selectedCryptoDepositBranding, setSelectedCryptoDepositBranding] = useState<Branding | null>(null);
  const [selectedBankKycApprovedBranding, setSelectedBankKycApprovedBranding] = useState<Branding | null>(null);
  const [selectedBankKycRejectedBranding, setSelectedBankKycRejectedBranding] = useState<Branding | null>(null);
  const [selectedCreditActivatedBranding, setSelectedCreditActivatedBranding] = useState<Branding | null>(null);
  const [selectedCreditIdentBranding, setSelectedCreditIdentBranding] = useState<Branding | null>(null);
  const [selectedCreditApprovedBranding, setSelectedCreditApprovedBranding] = useState<Branding | null>(null);
  const [selectedCreditRejectedBranding, setSelectedCreditRejectedBranding] = useState<Branding | null>(null);
  // Task Email Preview States
  const [taskEnrolledPreviewOpen, setTaskEnrolledPreviewOpen] = useState(false);
  const [taskAssignedPreviewOpen, setTaskAssignedPreviewOpen] = useState(false);
  const [taskApprovedPreviewOpen, setTaskApprovedPreviewOpen] = useState(false);
  const [taskRejectedPreviewOpen, setTaskRejectedPreviewOpen] = useState(false);
  const [selectedTaskEnrolledBranding, setSelectedTaskEnrolledBranding] = useState<Branding | null>(null);
  const [selectedTaskAssignedBranding, setSelectedTaskAssignedBranding] = useState<Branding | null>(null);
  const [selectedTaskApprovedBranding, setSelectedTaskApprovedBranding] = useState<Branding | null>(null);
  const [selectedTaskRejectedBranding, setSelectedTaskRejectedBranding] = useState<Branding | null>(null);
  // Registration Email Preview States
  const [registrationPreviewOpen, setRegistrationPreviewOpen] = useState(false);
  const [selectedRegistrationBranding, setSelectedRegistrationBranding] = useState<Branding | null>(null);
  // Lead Access Email Preview States
  const [leadAccessPreviewOpen, setLeadAccessPreviewOpen] = useState(false);
  const [selectedLeadAccessBranding, setSelectedLeadAccessBranding] = useState<Branding | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrandings = async () => {
      const { data, error } = await supabase
        .from('brandings')
        .select('id, name, accent_color, domain, logo_path')
        .order('name');
      
      if (data && data.length > 0) {
        setBrandings(data);
        setSelectedBranding(data[0]);
        setSelectedKycBranding(data[0]);
        setSelectedKycRejectionBranding(data[0]);
        setSelectedBankDepositBranding(data[0]);
        setSelectedCryptoDepositBranding(data[0]);
        setSelectedBankKycApprovedBranding(data[0]);
        setSelectedBankKycRejectedBranding(data[0]);
        setSelectedCreditActivatedBranding(data[0]);
        setSelectedCreditIdentBranding(data[0]);
        setSelectedCreditApprovedBranding(data[0]);
        setSelectedCreditRejectedBranding(data[0]);
        setSelectedTaskEnrolledBranding(data[0]);
        setSelectedTaskAssignedBranding(data[0]);
        setSelectedTaskApprovedBranding(data[0]);
        setSelectedTaskRejectedBranding(data[0]);
        setSelectedRegistrationBranding(data[0]);
        setSelectedLeadAccessBranding(data[0]);
      }
      setLoading(false);
    };

    fetchBrandings();
  }, []);

  const variables = [
    { name: "{cryptocurrency}", description: "Name der Kryptowährung (z.B. Bitcoin)" },
    { name: "{symbol}", description: "Kürzel (z.B. BTC, ETH)" },
    { name: "{trade_type}", description: "Position (LONG oder SHORT)" },
    { name: "{leverage}", description: "Hebelfaktor (z.B. 15x)" },
    { name: "{buy_price}", description: "Einstiegspreis in EUR" },
    { name: "{sell_price}", description: "Ausstiegspreis in EUR" },
    { name: "{start_amount}", description: "Investierter Betrag in EUR" },
    { name: "{profit_amount}", description: "Gewinn/Verlust in EUR" },
    { name: "{profit_percent}", description: "Prozentuale Änderung" },
    { name: "{duration}", description: "Trade-Dauer (z.B. 8m 32s)" },
    { name: "{accent_color}", description: "Branding-Farbe (aus Branding)" },
    { name: "{branding_name}", description: "Name des Brandings" },
    { name: "{domain}", description: "Domain des Brandings" },
    { name: "{first_name}", description: "Vorname des Nutzers" },
  ];

  const kycVariables = [
    { name: "{first_name}", description: "Vorname des Nutzers" },
    { name: "{last_name}", description: "Nachname des Nutzers" },
    { name: "{branding_name}", description: "Name des Brandings" },
    { name: "{domain}", description: "Domain des Brandings" },
    { name: "{accent_color}", description: "Akzentfarbe des Brandings" },
  ];

  const kycRejectionVariables = [
    { name: "{first_name}", description: "Vorname des Nutzers" },
    { name: "{last_name}", description: "Nachname des Nutzers" },
    { name: "{rejection_reason}", description: "Grund der Ablehnung" },
    { name: "{branding_name}", description: "Name des Brandings" },
    { name: "{domain}", description: "Domain des Brandings" },
    { name: "{accent_color}", description: "Akzentfarbe des Brandings" },
  ];

  const bankDepositVariables = [
    { name: "{first_name}", description: "Vorname des Nutzers" },
    { name: "{amount}", description: "Einzahlungsbetrag in EUR" },
    { name: "{branding_name}", description: "Name des Brandings" },
    { name: "{domain}", description: "Domain des Brandings" },
  ];

  const cryptoDepositVariables = [
    { name: "{first_name}", description: "Vorname des Nutzers" },
    { name: "{amount}", description: "Einzahlungsbetrag in EUR" },
    { name: "{currency}", description: "Kryptowährung (z.B. BTC)" },
    { name: "{branding_name}", description: "Name des Brandings" },
  ];

  const bankKycVariables = [
    { name: "{first_name}", description: "Vorname des Nutzers" },
    { name: "{bank_name}", description: "Name der Bank" },
    { name: "{bank_iban}", description: "IBAN" },
    { name: "{bank_bic}", description: "BIC" },
    { name: "{bank_account_holder}", description: "Kontoinhaber" },
    { name: "{branding_name}", description: "Name des Brandings" },
  ];

  const bankKycRejectionVariables = [
    { name: "{first_name}", description: "Vorname des Nutzers" },
    { name: "{rejection_reason}", description: "Ablehnungsgrund" },
    { name: "{branding_name}", description: "Name des Brandings" },
  ];

  const creditActivatedVariables = [
    { name: "{first_name}", description: "Vorname des Nutzers" },
    { name: "{branding_name}", description: "Name des Brandings" },
    { name: "{domain}", description: "Domain des Brandings" },
  ];

  const creditIdentVariables = [
    { name: "{first_name}", description: "Vorname des Nutzers" },
    { name: "{credit_amount}", description: "Kreditbetrag in EUR" },
    { name: "{partner_bank}", description: "Name der Partnerbank" },
    { name: "{branding_name}", description: "Name des Brandings" },
    { name: "{domain}", description: "Domain des Brandings" },
  ];

  const creditApprovedVariables = [
    { name: "{first_name}", description: "Vorname des Nutzers" },
    { name: "{credit_amount}", description: "Kreditbetrag in EUR" },
    { name: "{partner_bank}", description: "Name der Partnerbank" },
    { name: "{branding_name}", description: "Name des Brandings" },
    { name: "{domain}", description: "Domain des Brandings" },
  ];

  const creditRejectedVariables = [
    { name: "{first_name}", description: "Vorname des Nutzers" },
    { name: "{rejection_reason}", description: "Ablehnungsgrund" },
    { name: "{branding_name}", description: "Name des Brandings" },
    { name: "{domain}", description: "Domain des Brandings" },
  ];

  const taskEnrolledVariables = [
    { name: "{first_name}", description: "Vorname des Nutzers" },
    { name: "{branding_name}", description: "Name des Brandings" },
    { name: "{domain}", description: "Domain des Brandings" },
  ];

  const taskAssignedVariables = [
    { name: "{first_name}", description: "Vorname des Nutzers" },
    { name: "{task_title}", description: "Titel des Auftrags" },
    { name: "{compensation}", description: "Vergütung in EUR" },
    { name: "{branding_name}", description: "Name des Brandings" },
    { name: "{domain}", description: "Domain des Brandings" },
  ];

  const taskApprovedVariables = [
    { name: "{first_name}", description: "Vorname des Nutzers" },
    { name: "{task_title}", description: "Titel des Auftrags" },
    { name: "{compensation}", description: "Vergütung in EUR" },
    { name: "{branding_name}", description: "Name des Brandings" },
  ];

  const taskRejectedVariables = [
    { name: "{first_name}", description: "Vorname des Nutzers" },
    { name: "{task_title}", description: "Titel des Auftrags" },
    { name: "{rejection_reason}", description: "Ablehnungsgrund" },
    { name: "{branding_name}", description: "Name des Brandings" },
  ];

  const registrationVariables = [
    { name: "{first_name}", description: "Vorname des Nutzers" },
    { name: "{branding_name}", description: "Name des Brandings" },
    { name: "{domain}", description: "Domain des Brandings" },
    { name: "{accent_color}", description: "Akzentfarbe des Brandings" },
  ];

  const leadAccessVariables = [
    { name: "{first_name}", description: "Vorname des Leads" },
    { name: "{branding_name}", description: "Name des Brandings" },
    { name: "{domain}", description: "Domain des Brandings" },
    { name: "{accent_color}", description: "Akzentfarbe des Brandings" },
  ];

  const generatePreviewHtml = (isProfit: boolean, branding: Branding | null) => {
    const accentColor = branding?.accent_color || '#3B82F6';
    const brandingName = branding?.name || 'Demo Trading';
    const domain = branding?.domain || 'app.example.com';
    const profitColor = isProfit ? '#10B981' : '#DC2626';
    const profitSign = isProfit ? '+' : '';
    const profitAmount = isProfit ? 2.36 : -1.13;
    const profitPercent = isProfit ? 2.36 : -1.13;
    
    // Generate logo URL from Supabase storage
    const logoUrl = branding?.logo_path 
      ? supabase.storage.from('branding-logos').getPublicUrl(branding.logo_path).data.publicUrl
      : null;

    return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f7;">
    <tr>
      <td style="padding: 40px 20px;">
        <table cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #ffffff; padding: 32px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              ${logoUrl 
                ? `<img src="${logoUrl}" alt="${brandingName}" style="max-height: 48px; max-width: 200px; margin: 0 auto 12px auto; display: block;">`
                : `<h1 style="margin: 0 0 12px 0; color: #1f2937; font-size: 24px; font-weight: 700;">${brandingName}</h1>`
              }
              <p style="margin: 0; color: #6b7280; font-size: 14px; font-weight: 500;">Transaktionsbestätigung</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              
              <!-- Greeting -->
              <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px;">Sehr geehrte/r Max Mustermann,</p>
              
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                nachfolgend erhalten Sie die Bestätigung Ihres abgeschlossenen Trades.
              </p>

              <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                Transaktionsdetails
              </p>

              <!-- Trade Details Card -->
              <table cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px 24px; border-bottom: 1px solid #e2e8f0;">
                    <table cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="width: 48px;">
                          <img src="https://nowpayments.io/images/coins/btc.svg" alt="BTC" width="40" height="40" style="border-radius: 50%; background-color: #e2e8f0;">
                        </td>
                        <td style="padding-left: 12px;">
                          <p style="margin: 0; color: #1f2937; font-size: 18px; font-weight: 600;">Bitcoin</p>
                          <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">BTC</p>
                        </td>
                        <td style="text-align: right;">
                          <span style="display: inline-block; background-color: #dcfce7; color: #16a34a; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 600;">LONG 15x</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 24px;">
                    <table cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <p style="margin: 0; color: #6b7280; font-size: 13px;">Einstiegspreis</p>
                          <p style="margin: 4px 0 0 0; color: #1f2937; font-size: 16px; font-weight: 500;">94.150,00 €</p>
                        </td>
                        <td style="padding-bottom: 12px; text-align: right;">
                          <p style="margin: 0; color: #6b7280; font-size: 13px;">Ausstiegspreis</p>
                          <p style="margin: 4px 0 0 0; color: #1f2937; font-size: 16px; font-weight: 500;">94.298,15 €</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 12px; border-top: 1px solid #e2e8f0;">
                          <p style="margin: 0; color: #6b7280; font-size: 13px;">Investiert</p>
                          <p style="margin: 4px 0 0 0; color: #1f2937; font-size: 16px; font-weight: 500;">100,00 €</p>
                        </td>
                        <td style="padding-top: 12px; border-top: 1px solid #e2e8f0; text-align: right;">
                          <p style="margin: 0; color: #6b7280; font-size: 13px;">Trade-Dauer</p>
                          <p style="margin: 4px 0 0 0; color: #1f2937; font-size: 16px; font-weight: 500;">8m 32s</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: ${isProfit ? '#ecfdf5' : '#fef2f2'}; padding: 20px 24px; border-top: 1px solid ${isProfit ? '#a7f3d0' : '#fecaca'};">
                    <table cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td>
                          <p style="margin: 0; color: #6b7280; font-size: 13px;">Ergebnis</p>
                          <p style="margin: 4px 0 0 0; color: ${profitColor}; font-size: 24px; font-weight: 700;">${profitSign}${profitAmount.toFixed(2)} €</p>
                        </td>
                        <td style="text-align: right;">
                          <span style="display: inline-block; background-color: ${isProfit ? '#dcfce7' : '#fee2e2'}; color: ${profitColor}; padding: 8px 16px; border-radius: 8px; font-size: 18px; font-weight: 700;">${profitSign}${profitPercent.toFixed(2)}%</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Additional Text -->
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                Der Betrag wurde Ihrem Handelskonto gutgeschrieben.
              </p>

              <!-- CTA Button -->
              <table cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 24px;">
                <tr>
                  <td style="text-align: center;">
                    <a href="#" style="display: inline-block; background-color: ${accentColor}; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-size: 14px; font-weight: 500;">Transaktionsverlauf anzeigen</a>
                  </td>
                </tr>
              </table>

              <!-- Closing Text -->
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                  Bei Fragen zu dieser Transaktion wenden Sie sich bitte an unseren Kundenservice.
                </p>
                <p style="margin: 0; color: #1f2937; font-size: 14px; line-height: 1.6;">
                  Mit freundlichen Grüßen<br>
                  ${brandingName}
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f3f4f6; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} ${brandingName}</p>
              <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 11px; text-align: center;">Diese E-Mail wurde automatisch erstellt.</p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px; text-align: center;">
                <a href="#" style="color: #6b7280; text-decoration: none;">Einstellungen</a>
                <span style="margin: 0 8px; color: #d1d5db;">|</span>
                <a href="#" style="color: #6b7280; text-decoration: none;">Kundenservice</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  };

  const generateKycPreviewHtml = (branding: Branding | null) => {
    const accentColor = branding?.accent_color || '#3B82F6';
    const brandingName = branding?.name || 'Demo Trading';
    const domain = branding?.domain || 'app.example.com';
    
    const logoUrl = branding?.logo_path 
      ? supabase.storage.from('branding-logos').getPublicUrl(branding.logo_path).data.publicUrl
      : null;

    return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f7;">
    <tr>
      <td style="padding: 40px 20px;">
        <table cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #ffffff; padding: 32px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              ${logoUrl 
                ? `<img src="${logoUrl}" alt="${brandingName}" style="max-height: 48px; max-width: 200px; margin: 0 auto 12px auto; display: block;">`
                : `<h1 style="margin: 0 0 12px 0; color: #1f2937; font-size: 24px; font-weight: 700;">${brandingName}</h1>`
              }
              <p style="margin: 0; color: #6b7280; font-size: 14px; font-weight: 500;">Verifizierungsbestätigung</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              
              <!-- Success Icon -->
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 80px; height: 80px; background-color: #dcfce7; border-radius: 50%; line-height: 80px; text-align: center;">
                  <span style="color: #16a34a; font-size: 40px; line-height: 80px;">✓</span>
                </div>
              </div>
              
              <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 700; text-align: center;">
                Verifizierung erfolgreich!
              </h2>
              
              <!-- Greeting -->
              <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px;">Sehr geehrte/r Max Mustermann,</p>
              
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                wir freuen uns, Ihnen mitteilen zu können, dass Ihre KYC-Verifizierung erfolgreich abgeschlossen wurde. Ihr Konto ist jetzt vollständig verifiziert.
              </p>

              <!-- Benefits Box -->
              <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 12px 0; color: #16a34a; font-size: 14px; font-weight: 600;">
                  Sie haben nun Zugang zu:
                </p>
                <ul style="margin: 0; padding: 0 0 0 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
                  <li>Unbegrenzte Ein- und Auszahlungen</li>
                  <li>Vollständiger Zugang zu allen Trading-Bots</li>
                  <li>Erweiterte Kontofunktionen</li>
                </ul>
              </div>

              <!-- CTA Button -->
              <table cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 24px;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://${domain}/kryptotrading" style="display: inline-block; background-color: ${accentColor}; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-size: 14px; font-weight: 500;">Zum Trading-Dashboard</a>
                  </td>
                </tr>
              </table>

              <!-- Closing Text -->
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                  Bei Fragen stehen wir Ihnen gerne zur Verfügung.
                </p>
                <p style="margin: 0; color: #1f2937; font-size: 14px; line-height: 1.6;">
                  Mit freundlichen Grüßen<br>
                  ${brandingName}
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f3f4f6; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} ${brandingName}</p>
              <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 11px; text-align: center;">Diese E-Mail wurde automatisch erstellt.</p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px; text-align: center;">
                <a href="#" style="color: #6b7280; text-decoration: none;">Einstellungen</a>
                <span style="margin: 0 8px; color: #d1d5db;">|</span>
                <a href="#" style="color: #6b7280; text-decoration: none;">Kundenservice</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  };

  const generateKycRejectionPreviewHtml = (branding: Branding | null) => {
    const accentColor = branding?.accent_color || '#3B82F6';
    const brandingName = branding?.name || 'Demo Trading';
    const domain = branding?.domain || 'app.example.com';
    
    const logoUrl = branding?.logo_path 
      ? supabase.storage.from('branding-logos').getPublicUrl(branding.logo_path).data.publicUrl
      : null;

    const exampleRejectionReason = "Das hochgeladene Ausweisdokument ist nicht vollständig lesbar. Bitte laden Sie ein neues Foto hoch, auf dem alle Daten gut erkennbar sind.";

    return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f7;">
    <tr>
      <td style="padding: 40px 20px;">
        <table cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #ffffff; padding: 32px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              ${logoUrl 
                ? `<img src="${logoUrl}" alt="${brandingName}" style="max-height: 48px; max-width: 200px; margin: 0 auto 12px auto; display: block;">`
                : `<h1 style="margin: 0 0 12px 0; color: #1f2937; font-size: 24px; font-weight: 700;">${brandingName}</h1>`
              }
              <p style="margin: 0; color: #6b7280; font-size: 14px; font-weight: 500;">Identitätsverifizierung</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              
              <!-- Error Icon -->
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 80px; height: 80px; background-color: #fef2f2; border-radius: 50%; line-height: 80px; text-align: center;">
                  <span style="color: #dc2626; font-size: 40px; line-height: 80px;">✗</span>
                </div>
              </div>
              
              <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 700; text-align: center;">
                Verifizierung nicht erfolgreich
              </h2>
              
              <!-- Greeting -->
              <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px;">Sehr geehrte/r Max Mustermann,</p>
              
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                leider konnte Ihre KYC-Verifizierung nicht genehmigt werden.
              </p>

              <!-- Rejection Reason Box -->
              <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; color: #b91c1c; font-size: 14px; font-weight: 600;">
                  Grund der Ablehnung:
                </p>
                <p style="margin: 0; color: #991b1b; font-size: 15px; line-height: 1.6;">
                  ${exampleRejectionReason}
                </p>
              </div>

              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                Sie können die Verifizierung erneut einreichen, sobald Sie die genannten Punkte korrigiert haben.
              </p>

              <!-- CTA Button -->
              <table cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 24px;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://${domain}/kryptotrading/kyc" style="display: inline-block; background-color: ${accentColor}; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-size: 14px; font-weight: 500;">Erneut einreichen</a>
                  </td>
                </tr>
              </table>

              <!-- Closing Text -->
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                  Bei Fragen stehen wir Ihnen gerne zur Verfügung.
                </p>
                <p style="margin: 0; color: #1f2937; font-size: 14px; line-height: 1.6;">
                  Mit freundlichen Grüßen<br>
                  ${brandingName}
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f3f4f6; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} ${brandingName}</p>
              <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 11px; text-align: center;">Diese E-Mail wurde automatisch erstellt.</p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px; text-align: center;">
                <a href="#" style="color: #6b7280; text-decoration: none;">Einstellungen</a>
                <span style="margin: 0 8px; color: #d1d5db;">|</span>
                <a href="#" style="color: #6b7280; text-decoration: none;">Kundenservice</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  };

  const generateBankDepositPreviewHtml = (branding: Branding | null) => {
    const accentColor = branding?.accent_color || '#3B82F6';
    const brandingName = branding?.name || 'Demo Trading';
    const domain = branding?.domain || 'app.example.com';
    
    const logoUrl = branding?.logo_path 
      ? supabase.storage.from('branding-logos').getPublicUrl(branding.logo_path).data.publicUrl
      : null;

    return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f7;">
    <tr>
      <td style="padding: 40px 20px;">
        <table cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #ffffff; padding: 32px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              ${logoUrl 
                ? `<img src="${logoUrl}" alt="${brandingName}" style="max-height: 48px; max-width: 200px; margin: 0 auto 12px auto; display: block;">`
                : `<h1 style="margin: 0 0 12px 0; color: #1f2937; font-size: 24px; font-weight: 700;">${brandingName}</h1>`
              }
              <p style="margin: 0; color: #6b7280; font-size: 14px; font-weight: 500;">Einzahlungsbestätigung</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              
              <!-- Success Icon -->
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 80px; height: 80px; background-color: #dcfce7; border-radius: 50%; line-height: 80px; text-align: center;">
                  <span style="color: #16a34a; font-size: 40px; line-height: 80px;">✓</span>
                </div>
              </div>
              
              <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 700; text-align: center;">
                Einzahlung gutgeschrieben!
              </h2>
              
              <!-- Greeting -->
              <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px;">Sehr geehrte/r Max Mustermann,</p>
              
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                Ihr Konto wurde mit folgendem Betrag aufgeladen:
              </p>

              <!-- Amount Box -->
              <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <table cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td>
                      <p style="margin: 0; color: #6b7280; font-size: 13px;">Betrag</p>
                      <p style="margin: 4px 0 0 0; color: #16a34a; font-size: 28px; font-weight: 700;">€5.000,00</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top: 12px;">
                      <p style="margin: 0; color: #6b7280; font-size: 13px;">Einzahlungsart</p>
                      <p style="margin: 4px 0 0 0; color: #1f2937; font-size: 16px; font-weight: 500;">SEPA-Überweisung</p>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA Button -->
              <table cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 24px;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://${domain}/kryptotrading" style="display: inline-block; background-color: ${accentColor}; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-size: 14px; font-weight: 500;">Zum Dashboard</a>
                  </td>
                </tr>
              </table>

              <!-- Closing Text -->
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                  Bei Fragen stehen wir Ihnen gerne zur Verfügung.
                </p>
                <p style="margin: 0; color: #1f2937; font-size: 14px; line-height: 1.6;">
                  Mit freundlichen Grüßen<br>
                  ${brandingName}
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f3f4f6; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} ${brandingName}</p>
              <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 11px; text-align: center;">Diese E-Mail wurde automatisch erstellt.</p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px; text-align: center;">
                <a href="#" style="color: #6b7280; text-decoration: none;">Einstellungen</a>
                <span style="margin: 0 8px; color: #d1d5db;">|</span>
                <a href="#" style="color: #6b7280; text-decoration: none;">Kundenservice</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  };

  const generateCryptoDepositPreviewHtml = (branding: Branding | null) => {
    const accentColor = branding?.accent_color || '#3B82F6';
    const brandingName = branding?.name || 'Demo Trading';
    const domain = branding?.domain || 'app.example.com';
    
    const logoUrl = branding?.logo_path 
      ? supabase.storage.from('branding-logos').getPublicUrl(branding.logo_path).data.publicUrl
      : null;

    return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f7;">
    <tr>
      <td style="padding: 40px 20px;">
        <table cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #ffffff; padding: 32px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              ${logoUrl 
                ? `<img src="${logoUrl}" alt="${brandingName}" style="max-height: 48px; max-width: 200px; margin: 0 auto 12px auto; display: block;">`
                : `<h1 style="margin: 0 0 12px 0; color: #1f2937; font-size: 24px; font-weight: 700;">${brandingName}</h1>`
              }
              <p style="margin: 0; color: #6b7280; font-size: 14px; font-weight: 500;">Krypto-Einzahlungsbestätigung</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              
              <!-- Success Icon -->
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 80px; height: 80px; background-color: #fef3c7; border-radius: 50%; line-height: 80px; text-align: center;">
                  <span style="color: #f59e0b; font-size: 40px; line-height: 80px;">₿</span>
                </div>
              </div>
              
              <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 700; text-align: center;">
                Krypto-Einzahlung gutgeschrieben!
              </h2>
              
              <!-- Greeting -->
              <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px;">Sehr geehrte/r Max Mustermann,</p>
              
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                Ihre Krypto-Einzahlung wurde erfolgreich verarbeitet und Ihrem Konto gutgeschrieben:
              </p>

              <!-- Amount Box -->
              <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <table cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td>
                      <p style="margin: 0; color: #6b7280; font-size: 13px;">Betrag</p>
                      <p style="margin: 4px 0 0 0; color: #b45309; font-size: 28px; font-weight: 700;">€1.250,00</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top: 12px;">
                      <p style="margin: 0; color: #6b7280; font-size: 13px;">Bezahlt mit</p>
                      <p style="margin: 4px 0 0 0; color: #1f2937; font-size: 16px; font-weight: 500;">Bitcoin (BTC)</p>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA Button -->
              <table cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 24px;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://${domain}/kryptotrading" style="display: inline-block; background-color: ${accentColor}; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-size: 14px; font-weight: 500;">Zum Dashboard</a>
                  </td>
                </tr>
              </table>

              <!-- Closing Text -->
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                  Bei Fragen stehen wir Ihnen gerne zur Verfügung.
                </p>
                <p style="margin: 0; color: #1f2937; font-size: 14px; line-height: 1.6;">
                  Mit freundlichen Grüßen<br>
                  ${brandingName}
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f3f4f6; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} ${brandingName}</p>
              <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 11px; text-align: center;">Diese E-Mail wurde automatisch erstellt.</p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px; text-align: center;">
                <a href="#" style="color: #6b7280; text-decoration: none;">Einstellungen</a>
                <span style="margin: 0 8px; color: #d1d5db;">|</span>
                <a href="#" style="color: #6b7280; text-decoration: none;">Kundenservice</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  };

  const generateBankKycApprovedPreviewHtml = (branding: Branding | null) => {
    const accentColor = branding?.accent_color || '#3B82F6';
    const brandingName = branding?.name || 'Demo Trading';
    const domain = branding?.domain || 'app.example.com';
    
    const logoUrl = branding?.logo_path 
      ? supabase.storage.from('branding-logos').getPublicUrl(branding.logo_path).data.publicUrl
      : null;

    return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f7;">
    <tr>
      <td style="padding: 40px 20px;">
        <table cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #ffffff; padding: 32px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              ${logoUrl 
                ? `<img src="${logoUrl}" alt="${brandingName}" style="max-height: 48px; max-width: 200px; margin: 0 auto 12px auto; display: block;">`
                : `<h1 style="margin: 0 0 12px 0; color: #1f2937; font-size: 24px; font-weight: 700;">${brandingName}</h1>`
              }
              <p style="margin: 0; color: #6b7280; font-size: 14px; font-weight: 500;">Bank-Verifizierung</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              
              <!-- Success Icon -->
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 80px; height: 80px; background-color: #dcfce7; border-radius: 50%; line-height: 80px; text-align: center;">
                  <span style="color: #16a34a; font-size: 40px; line-height: 80px;">✓</span>
                </div>
              </div>
              
              <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 700; text-align: center;">
                Bank-Verifizierung erfolgreich!
              </h2>
              
              <!-- Greeting -->
              <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px;">Sehr geehrte/r Max Mustermann,</p>
              
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                Ihre Bank-Verifizierung wurde erfolgreich abgeschlossen. Sie können ab sofort SEPA-Einzahlungen auf folgendes Konto tätigen:
              </p>

              <!-- Bank Details Box -->
              <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 12px 0; color: #16a34a; font-size: 14px; font-weight: 600;">
                  Ihre Bankverbindung für SEPA-Einzahlungen:
                </p>
                <table cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #a7f3d0;">
                      <p style="margin: 0; color: #6b7280; font-size: 12px;">Kontoinhaber</p>
                      <p style="margin: 2px 0 0 0; color: #1f2937; font-size: 14px; font-weight: 500;">Max Mustermann</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #a7f3d0;">
                      <p style="margin: 0; color: #6b7280; font-size: 12px;">IBAN</p>
                      <p style="margin: 2px 0 0 0; color: #1f2937; font-size: 14px; font-weight: 500;">DE89 3704 0044 0532 0130 00</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #a7f3d0;">
                      <p style="margin: 0; color: #6b7280; font-size: 12px;">BIC</p>
                      <p style="margin: 2px 0 0 0; color: #1f2937; font-size: 14px; font-weight: 500;">COBADEFFXXX</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <p style="margin: 0; color: #6b7280; font-size: 12px;">Bank</p>
                      <p style="margin: 2px 0 0 0; color: #1f2937; font-size: 14px; font-weight: 500;">Commerzbank AG</p>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA Button -->
              <table cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 24px;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://${domain}/kryptotrading/wallet" style="display: inline-block; background-color: ${accentColor}; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-size: 14px; font-weight: 500;">Zur Wallet</a>
                  </td>
                </tr>
              </table>

              <!-- Closing Text -->
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                  Bei Fragen stehen wir Ihnen gerne zur Verfügung.
                </p>
                <p style="margin: 0; color: #1f2937; font-size: 14px; line-height: 1.6;">
                  Mit freundlichen Grüßen<br>
                  ${brandingName}
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f3f4f6; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} ${brandingName}</p>
              <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 11px; text-align: center;">Diese E-Mail wurde automatisch erstellt.</p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px; text-align: center;">
                <a href="#" style="color: #6b7280; text-decoration: none;">Einstellungen</a>
                <span style="margin: 0 8px; color: #d1d5db;">|</span>
                <a href="#" style="color: #6b7280; text-decoration: none;">Kundenservice</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  };

  const generateBankKycRejectedPreviewHtml = (branding: Branding | null) => {
    const accentColor = branding?.accent_color || '#3B82F6';
    const brandingName = branding?.name || 'Demo Trading';
    const domain = branding?.domain || 'app.example.com';
    
    const logoUrl = branding?.logo_path 
      ? supabase.storage.from('branding-logos').getPublicUrl(branding.logo_path).data.publicUrl
      : null;

    const exampleRejectionReason = "Die angegebene IBAN konnte nicht verifiziert werden. Bitte überprüfen Sie Ihre Angaben und stellen Sie sicher, dass das Konto auf Ihren Namen lautet.";

    return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f7;">
    <tr>
      <td style="padding: 40px 20px;">
        <table cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #ffffff; padding: 32px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              ${logoUrl 
                ? `<img src="${logoUrl}" alt="${brandingName}" style="max-height: 48px; max-width: 200px; margin: 0 auto 12px auto; display: block;">`
                : `<h1 style="margin: 0 0 12px 0; color: #1f2937; font-size: 24px; font-weight: 700;">${brandingName}</h1>`
              }
              <p style="margin: 0; color: #6b7280; font-size: 14px; font-weight: 500;">Bank-Verifizierung</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              
              <!-- Error Icon -->
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 80px; height: 80px; background-color: #fef2f2; border-radius: 50%; line-height: 80px; text-align: center;">
                  <span style="color: #dc2626; font-size: 40px; line-height: 80px;">✗</span>
                </div>
              </div>
              
              <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 700; text-align: center;">
                Bank-Verifizierung nicht erfolgreich
              </h2>
              
              <!-- Greeting -->
              <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px;">Sehr geehrte/r Max Mustermann,</p>
              
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                leider konnte Ihre Bank-Verifizierung nicht genehmigt werden.
              </p>

              <!-- Rejection Reason Box -->
              <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; color: #b91c1c; font-size: 14px; font-weight: 600;">
                  Grund der Ablehnung:
                </p>
                <p style="margin: 0; color: #991b1b; font-size: 15px; line-height: 1.6;">
                  ${exampleRejectionReason}
                </p>
              </div>

              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                Sie können die Verifizierung erneut einreichen, sobald Sie die genannten Punkte korrigiert haben.
              </p>

              <!-- CTA Button -->
              <table cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 24px;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://${domain}/kryptotrading/wallet" style="display: inline-block; background-color: ${accentColor}; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-size: 14px; font-weight: 500;">Erneut einreichen</a>
                  </td>
                </tr>
              </table>

              <!-- Closing Text -->
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                  Bei Fragen stehen wir Ihnen gerne zur Verfügung.
                </p>
                <p style="margin: 0; color: #1f2937; font-size: 14px; line-height: 1.6;">
                  Mit freundlichen Grüßen<br>
                  ${brandingName}
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f3f4f6; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} ${brandingName}</p>
              <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 11px; text-align: center;">Diese E-Mail wurde automatisch erstellt.</p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px; text-align: center;">
                <a href="#" style="color: #6b7280; text-decoration: none;">Einstellungen</a>
                <span style="margin: 0 8px; color: #d1d5db;">|</span>
                <a href="#" style="color: #6b7280; text-decoration: none;">Kundenservice</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  };

  const generateCreditActivatedPreviewHtml = (branding: Branding | null) => {
    const accentColor = branding?.accent_color || '#3B82F6';
    const brandingName = branding?.name || 'Demo Trading';
    const domain = branding?.domain || 'app.example.com';
    
    const logoUrl = branding?.logo_path 
      ? supabase.storage.from('branding-logos').getPublicUrl(branding.logo_path).data.publicUrl
      : null;

    return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f7;">
    <tr>
      <td style="padding: 40px 20px;">
        <table cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background-color: #ffffff; padding: 32px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              ${logoUrl 
                ? `<img src="${logoUrl}" alt="${brandingName}" style="max-height: 48px; max-width: 200px; margin: 0 auto 12px auto; display: block;">`
                : `<h1 style="margin: 0 0 12px 0; color: #1f2937; font-size: 24px; font-weight: 700;">${brandingName}</h1>`
              }
              <p style="margin: 0; color: #6b7280; font-size: 14px; font-weight: 500;">Kreditantrag</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 80px; height: 80px; background-color: #dbeafe; border-radius: 50%; line-height: 80px; text-align: center;">
                  <span style="font-size: 40px; line-height: 80px;">💳</span>
                </div>
              </div>
              <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 700; text-align: center;">Kredit jetzt beantragen</h2>
              <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px;">Sehr geehrte/r Max Mustermann,</p>
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">Sie können nun einen Kredit beantragen. Bitte reichen Sie Ihre Unterlagen ein.</p>
              <div style="background-color: #dbeafe; border: 1px solid #93c5fd; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 12px 0; color: #1e40af; font-size: 14px; font-weight: 600;">Benötigte Unterlagen:</p>
                <ul style="margin: 0; padding: 0 0 0 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
                  <li>Kontoauszüge der letzten 3 Monate</li>
                  <li>Gehaltsabrechnungen der letzten 3 Monate</li>
                  <li>Angaben zur Krankenversicherung</li>
                  <li>Steuernummer und Steuer-ID</li>
                </ul>
              </div>
              <table cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 24px;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://${domain}/kryptotrading/kredit" style="display: inline-block; background-color: ${accentColor}; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-size: 14px; font-weight: 500;">Zum Kreditantrag</a>
                  </td>
                </tr>
              </table>
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
                <p style="margin: 0; color: #1f2937; font-size: 14px; line-height: 1.6;">Mit freundlichen Grüßen<br>${brandingName}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f3f4f6; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} ${brandingName}</p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px; text-align: center;">Diese E-Mail wurde automatisch erstellt.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  };

  const generateCreditIdentPreviewHtml = (branding: Branding | null) => {
    const accentColor = branding?.accent_color || '#3B82F6';
    const brandingName = branding?.name || 'Demo Trading';
    const domain = branding?.domain || 'app.example.com';
    const logoUrl = branding?.logo_path ? supabase.storage.from('branding-logos').getPublicUrl(branding.logo_path).data.publicUrl : null;

    return `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f7;">
    <tr>
      <td style="padding: 40px 20px;">
        <table cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background-color: #ffffff; padding: 32px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              ${logoUrl ? `<img src="${logoUrl}" alt="${brandingName}" style="max-height: 48px; max-width: 200px; margin: 0 auto 12px auto; display: block;">` : `<h1 style="margin: 0 0 12px 0; color: #1f2937; font-size: 24px; font-weight: 700;">${brandingName}</h1>`}
              <p style="margin: 0; color: #6b7280; font-size: 14px; font-weight: 500;">Kreditantrag</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 80px; height: 80px; background-color: #f3e8ff; border-radius: 50%; line-height: 80px; text-align: center;">
                  <span style="font-size: 40px; line-height: 80px;">🔐</span>
                </div>
              </div>
              <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 700; text-align: center;">Identifizierung erforderlich</h2>
              <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px;">Sehr geehrte/r Max Mustermann,</p>
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">Ihre Unterlagen wurden geprüft. Bitte führen Sie die Identitätsprüfung durch.</p>
              <div style="background-color: #f3e8ff; border: 1px solid #d8b4fe; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 12px 0; color: #7c3aed; font-size: 14px; font-weight: 600;">Kreditdetails:</p>
                <p style="margin: 0 0 8px 0; color: #5b21b6; font-size: 15px;"><strong>Betrag:</strong> €25.000,00</p>
                <p style="margin: 0; color: #5b21b6; font-size: 15px;"><strong>Partnerbank:</strong> Commerzbank AG</p>
              </div>
              <table cellspacing="0" cellpadding="0" border="0" width="100%"><tr><td style="text-align: center;"><a href="https://${domain}/kryptotrading/kredit" style="display: inline-block; background-color: ${accentColor}; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-size: 14px; font-weight: 500;">Zur Identifizierung</a></td></tr></table>
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
                <p style="margin: 0; color: #1f2937; font-size: 14px;">Mit freundlichen Grüßen<br>${brandingName}</p>
              </div>
            </td>
          </tr>
          <tr><td style="background-color: #f3f4f6; padding: 24px 40px; border-top: 1px solid #e5e7eb;"><p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} ${brandingName}</p></td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  };

  const generateCreditApprovedPreviewHtml = (branding: Branding | null) => {
    const accentColor = branding?.accent_color || '#3B82F6';
    const brandingName = branding?.name || 'Demo Trading';
    const domain = branding?.domain || 'app.example.com';
    const logoUrl = branding?.logo_path ? supabase.storage.from('branding-logos').getPublicUrl(branding.logo_path).data.publicUrl : null;

    return `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f7;">
    <tr>
      <td style="padding: 40px 20px;">
        <table cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background-color: #ffffff; padding: 32px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              ${logoUrl ? `<img src="${logoUrl}" alt="${brandingName}" style="max-height: 48px; max-width: 200px; margin: 0 auto 12px auto; display: block;">` : `<h1 style="margin: 0 0 12px 0; color: #1f2937; font-size: 24px; font-weight: 700;">${brandingName}</h1>`}
              <p style="margin: 0; color: #6b7280; font-size: 14px; font-weight: 500;">Kreditantrag</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 80px; height: 80px; background-color: #dcfce7; border-radius: 50%; line-height: 80px; text-align: center;">
                  <span style="color: #16a34a; font-size: 40px; line-height: 80px;">✓</span>
                </div>
              </div>
              <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 700; text-align: center;">Kredit genehmigt!</h2>
              <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px;">Sehr geehrte/r Max Mustermann,</p>
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">Ihr Kreditantrag wurde genehmigt. Der Betrag wurde Ihrem Konto gutgeschrieben.</p>
              <div style="background-color: #dcfce7; border: 1px solid #86efac; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 12px 0; color: #16a34a; font-size: 14px; font-weight: 600;">Kreditdetails:</p>
                <p style="margin: 0 0 8px 0; color: #15803d; font-size: 15px;"><strong>Betrag:</strong> €25.000,00</p>
                <p style="margin: 0; color: #15803d; font-size: 15px;"><strong>Partnerbank:</strong> Commerzbank AG</p>
              </div>
              <table cellspacing="0" cellpadding="0" border="0" width="100%"><tr><td style="text-align: center;"><a href="https://${domain}/kryptotrading" style="display: inline-block; background-color: ${accentColor}; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-size: 14px; font-weight: 500;">Zum Dashboard</a></td></tr></table>
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
                <p style="margin: 0; color: #1f2937; font-size: 14px;">Mit freundlichen Grüßen<br>${brandingName}</p>
              </div>
            </td>
          </tr>
          <tr><td style="background-color: #f3f4f6; padding: 24px 40px; border-top: 1px solid #e5e7eb;"><p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} ${brandingName}</p></td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  };

  const generateCreditRejectedPreviewHtml = (branding: Branding | null) => {
    const accentColor = branding?.accent_color || '#3B82F6';
    const brandingName = branding?.name || 'Demo Trading';
    const domain = branding?.domain || 'app.example.com';
    const logoUrl = branding?.logo_path ? supabase.storage.from('branding-logos').getPublicUrl(branding.logo_path).data.publicUrl : null;
    const exampleRejectionReason = "Leider erfüllen die eingereichten Unterlagen nicht unsere Anforderungen.";

    return `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f7;">
    <tr>
      <td style="padding: 40px 20px;">
        <table cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background-color: #ffffff; padding: 32px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              ${logoUrl ? `<img src="${logoUrl}" alt="${brandingName}" style="max-height: 48px; max-width: 200px; margin: 0 auto 12px auto; display: block;">` : `<h1 style="margin: 0 0 12px 0; color: #1f2937; font-size: 24px; font-weight: 700;">${brandingName}</h1>`}
              <p style="margin: 0; color: #6b7280; font-size: 14px; font-weight: 500;">Kreditantrag</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 80px; height: 80px; background-color: #fef2f2; border-radius: 50%; line-height: 80px; text-align: center;">
                  <span style="color: #dc2626; font-size: 40px; line-height: 80px;">✗</span>
                </div>
              </div>
              <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 700; text-align: center;">Kreditantrag abgelehnt</h2>
              <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px;">Sehr geehrte/r Max Mustermann,</p>
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">Leider können wir Ihren Kreditantrag nicht genehmigen.</p>
              <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; color: #b91c1c; font-size: 14px; font-weight: 600;">Grund der Ablehnung:</p>
                <p style="margin: 0; color: #991b1b; font-size: 15px; line-height: 1.6;">${exampleRejectionReason}</p>
              </div>
              <table cellspacing="0" cellpadding="0" border="0" width="100%"><tr><td style="text-align: center;"><a href="https://${domain}/kryptotrading/support" style="display: inline-block; background-color: ${accentColor}; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-size: 14px; font-weight: 500;">Zum Support</a></td></tr></table>
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
                <p style="margin: 0; color: #1f2937; font-size: 14px;">Mit freundlichen Grüßen<br>${brandingName}</p>
              </div>
            </td>
          </tr>
          <tr><td style="background-color: #f3f4f6; padding: 24px 40px; border-top: 1px solid #e5e7eb;"><p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} ${brandingName}</p></td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  };

  const generateTaskEnrolledPreviewHtml = (branding: Branding | null) => {
    const accentColor = branding?.accent_color || '#3B82F6';
    const brandingName = branding?.name || 'Demo Trading';
    const domain = branding?.domain || 'app.example.com';
    const logoUrl = branding?.logo_path ? supabase.storage.from('branding-logos').getPublicUrl(branding.logo_path).data.publicUrl : null;

    return `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f7;">
    <tr>
      <td style="padding: 40px 20px;">
        <table cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background-color: #ffffff; padding: 32px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              ${logoUrl ? `<img src="${logoUrl}" alt="${brandingName}" style="max-height: 48px; max-width: 200px; margin: 0 auto 12px auto; display: block;">` : `<h1 style="margin: 0 0 12px 0; color: #1f2937; font-size: 24px; font-weight: 700;">${brandingName}</h1>`}
              <p style="margin: 0; color: #6b7280; font-size: 14px; font-weight: 500;">Aufträge</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 80px; height: 80px; background-color: #dcfce7; border-radius: 50%; line-height: 80px; text-align: center;">
                  <span style="color: #16a34a; font-size: 40px; line-height: 80px;">✓</span>
                </div>
              </div>
              <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 700; text-align: center;">Geld verdienen freigeschaltet!</h2>
              <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px;">Sehr geehrte/r Max Mustermann,</p>
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">Sie wurden für das Auftrags-Programm freigeschaltet. Ab sofort können Sie Aufträge absolvieren und Vergütungen verdienen.</p>
              <table cellspacing="0" cellpadding="0" border="0" width="100%"><tr><td style="text-align: center;"><a href="https://${domain}/kryptotrading/geld-verdienen" style="display: inline-block; background-color: ${accentColor}; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-size: 14px; font-weight: 500;">Zu den Aufträgen</a></td></tr></table>
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
                <p style="margin: 0; color: #1f2937; font-size: 14px;">Mit freundlichen Grüßen<br>${brandingName}</p>
              </div>
            </td>
          </tr>
          <tr><td style="background-color: #f3f4f6; padding: 24px 40px; border-top: 1px solid #e5e7eb;"><p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} ${brandingName}</p></td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  };

  const generateTaskAssignedPreviewHtml = (branding: Branding | null) => {
    const accentColor = branding?.accent_color || '#3B82F6';
    const brandingName = branding?.name || 'Demo Trading';
    const domain = branding?.domain || 'app.example.com';
    const logoUrl = branding?.logo_path ? supabase.storage.from('branding-logos').getPublicUrl(branding.logo_path).data.publicUrl : null;

    return `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f7;">
    <tr>
      <td style="padding: 40px 20px;">
        <table cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background-color: #ffffff; padding: 32px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              ${logoUrl ? `<img src="${logoUrl}" alt="${brandingName}" style="max-height: 48px; max-width: 200px; margin: 0 auto 12px auto; display: block;">` : `<h1 style="margin: 0 0 12px 0; color: #1f2937; font-size: 24px; font-weight: 700;">${brandingName}</h1>`}
              <p style="margin: 0; color: #6b7280; font-size: 14px; font-weight: 500;">Aufträge</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 80px; height: 80px; background-color: #dbeafe; border-radius: 50%; line-height: 80px; text-align: center;">
                  <span style="font-size: 40px; line-height: 80px;">📋</span>
                </div>
              </div>
              <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 700; text-align: center;">Neuer Auftrag verfügbar</h2>
              <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px;">Sehr geehrte/r Max Mustermann,</p>
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">Ihnen wurde ein neuer Auftrag zugewiesen.</p>
              <div style="background-color: #dbeafe; border: 1px solid #93c5fd; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 12px 0; color: #1d4ed8; font-size: 14px; font-weight: 600;">Auftragsdetails:</p>
                <p style="margin: 0 0 8px 0; color: #1e40af; font-size: 15px;"><strong>Auftrag:</strong> Beispiel-Auftrag</p>
                <p style="margin: 0; color: #1e40af; font-size: 15px;"><strong>Vergütung:</strong> €150,00</p>
              </div>
              <table cellspacing="0" cellpadding="0" border="0" width="100%"><tr><td style="text-align: center;"><a href="https://${domain}/kryptotrading/geld-verdienen" style="display: inline-block; background-color: ${accentColor}; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-size: 14px; font-weight: 500;">Auftrag ansehen</a></td></tr></table>
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
                <p style="margin: 0; color: #1f2937; font-size: 14px;">Mit freundlichen Grüßen<br>${brandingName}</p>
              </div>
            </td>
          </tr>
          <tr><td style="background-color: #f3f4f6; padding: 24px 40px; border-top: 1px solid #e5e7eb;"><p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} ${brandingName}</p></td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  };

  const generateTaskApprovedPreviewHtml = (branding: Branding | null) => {
    const accentColor = branding?.accent_color || '#3B82F6';
    const brandingName = branding?.name || 'Demo Trading';
    const domain = branding?.domain || 'app.example.com';
    const logoUrl = branding?.logo_path ? supabase.storage.from('branding-logos').getPublicUrl(branding.logo_path).data.publicUrl : null;

    return `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f7;">
    <tr>
      <td style="padding: 40px 20px;">
        <table cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background-color: #ffffff; padding: 32px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              ${logoUrl ? `<img src="${logoUrl}" alt="${brandingName}" style="max-height: 48px; max-width: 200px; margin: 0 auto 12px auto; display: block;">` : `<h1 style="margin: 0 0 12px 0; color: #1f2937; font-size: 24px; font-weight: 700;">${brandingName}</h1>`}
              <p style="margin: 0; color: #6b7280; font-size: 14px; font-weight: 500;">Aufträge</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 80px; height: 80px; background-color: #dcfce7; border-radius: 50%; line-height: 80px; text-align: center;">
                  <span style="color: #16a34a; font-size: 40px; line-height: 80px;">✓</span>
                </div>
              </div>
              <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 700; text-align: center;">Auftrag genehmigt!</h2>
              <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px;">Sehr geehrte/r Max Mustermann,</p>
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">Ihr Auftrag wurde genehmigt. Die Vergütung wurde Ihrem Konto gutgeschrieben.</p>
              <div style="background-color: #dcfce7; border: 1px solid #86efac; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 12px 0; color: #16a34a; font-size: 14px; font-weight: 600;">Vergütungsdetails:</p>
                <p style="margin: 0 0 8px 0; color: #15803d; font-size: 15px;"><strong>Auftrag:</strong> Beispiel-Auftrag</p>
                <p style="margin: 0; color: #15803d; font-size: 15px;"><strong>Vergütung:</strong> €150,00</p>
              </div>
              <table cellspacing="0" cellpadding="0" border="0" width="100%"><tr><td style="text-align: center;"><a href="https://${domain}/kryptotrading/wallet" style="display: inline-block; background-color: ${accentColor}; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-size: 14px; font-weight: 500;">Zum Wallet</a></td></tr></table>
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
                <p style="margin: 0; color: #1f2937; font-size: 14px;">Mit freundlichen Grüßen<br>${brandingName}</p>
              </div>
            </td>
          </tr>
          <tr><td style="background-color: #f3f4f6; padding: 24px 40px; border-top: 1px solid #e5e7eb;"><p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} ${brandingName}</p></td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  };

  const generateTaskRejectedPreviewHtml = (branding: Branding | null) => {
    const accentColor = branding?.accent_color || '#3B82F6';
    const brandingName = branding?.name || 'Demo Trading';
    const domain = branding?.domain || 'app.example.com';
    const logoUrl = branding?.logo_path ? supabase.storage.from('branding-logos').getPublicUrl(branding.logo_path).data.publicUrl : null;
    const exampleRejectionReason = "Die Aufgabe wurde nicht gemäß den Anforderungen durchgeführt.";

    return `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f7;">
    <tr>
      <td style="padding: 40px 20px;">
        <table cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background-color: #ffffff; padding: 32px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              ${logoUrl ? `<img src="${logoUrl}" alt="${brandingName}" style="max-height: 48px; max-width: 200px; margin: 0 auto 12px auto; display: block;">` : `<h1 style="margin: 0 0 12px 0; color: #1f2937; font-size: 24px; font-weight: 700;">${brandingName}</h1>`}
              <p style="margin: 0; color: #6b7280; font-size: 14px; font-weight: 500;">Aufträge</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 80px; height: 80px; background-color: #fef2f2; border-radius: 50%; line-height: 80px; text-align: center;">
                  <span style="color: #dc2626; font-size: 40px; line-height: 80px;">✗</span>
                </div>
              </div>
              <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 700; text-align: center;">Auftrag nicht genehmigt</h2>
              <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px;">Sehr geehrte/r Max Mustermann,</p>
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">Leider können wir Ihren eingereichten Auftrag nicht genehmigen.</p>
              <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; color: #b91c1c; font-size: 14px; font-weight: 600;">Grund der Ablehnung:</p>
                <p style="margin: 0; color: #991b1b; font-size: 15px; line-height: 1.6;">${exampleRejectionReason}</p>
              </div>
              <table cellspacing="0" cellpadding="0" border="0" width="100%"><tr><td style="text-align: center;"><a href="https://${domain}/kryptotrading/support" style="display: inline-block; background-color: ${accentColor}; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-size: 14px; font-weight: 500;">Zum Support</a></td></tr></table>
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
                <p style="margin: 0; color: #1f2937; font-size: 14px;">Mit freundlichen Grüßen<br>${brandingName}</p>
              </div>
            </td>
          </tr>
          <tr><td style="background-color: #f3f4f6; padding: 24px 40px; border-top: 1px solid #e5e7eb;"><p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} ${brandingName}</p></td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  };

  const generateRegistrationPreviewHtml = (branding: Branding | null) => {
    const accentColor = branding?.accent_color || '#3B82F6';
    const brandingName = branding?.name || 'Demo Trading';
    const domain = branding?.domain || 'app.example.com';
    
    const logoUrl = branding?.logo_path 
      ? supabase.storage.from('branding-logos').getPublicUrl(branding.logo_path).data.publicUrl
      : null;

    return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f7;">
    <tr>
      <td style="padding: 40px 20px;">
        <table cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background-color: #ffffff; padding: 32px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              ${logoUrl 
                ? `<img src="${logoUrl}" alt="${brandingName}" style="max-height: 48px; max-width: 200px; margin: 0 auto 12px auto; display: block;">`
                : `<h1 style="margin: 0 0 12px 0; color: #1f2937; font-size: 24px; font-weight: 700;">${brandingName}</h1>`
              }
              <p style="margin: 0; color: #6b7280; font-size: 14px; font-weight: 500;">Registrierungsbestätigung</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              <div style="display: inline-block; width: 80px; height: 80px; background-color: #ecfdf5; border-radius: 50%; line-height: 80px; text-align: center;">
                <span style="font-size: 40px; line-height: 80px;">🎉</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 700; text-align: center;">Herzlich Willkommen!</h2>
              <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px;">Sehr geehrte/r Max Mustermann,</p>
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">vielen Dank für Ihre Registrierung bei ${brandingName}. Wir freuen uns, Sie als neues Mitglied begrüßen zu dürfen!</p>
              <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 12px 0; color: #0369a1; font-size: 15px; font-weight: 600;">Was Sie jetzt tun können:</p>
                <ul style="margin: 0; padding-left: 20px; color: #0369a1; font-size: 14px; line-height: 1.8;">
                  <li>KI-gestütztes Trading starten</li>
                  <li>Ihr Profil vervollständigen</li>
                  <li>Die KYC-Verifizierung durchführen</li>
                  <li>Guthaben einzahlen</li>
                </ul>
              </div>
              <table cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 24px;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://${domain}/kryptotrading" style="display: inline-block; background-color: ${accentColor}; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-size: 14px; font-weight: 500;">Jetzt starten</a>
                  </td>
                </tr>
              </table>
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
                <p style="margin: 0; color: #1f2937; font-size: 14px; line-height: 1.6;">Mit freundlichen Grüßen<br>${brandingName}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f3f4f6; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} ${brandingName}</p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px; text-align: center;">Diese E-Mail wurde automatisch erstellt.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  };

  const generateLeadAccessPreviewHtml = (branding: Branding | null) => {
    const accentColor = branding?.accent_color || '#3B82F6';
    const brandingName = branding?.name || 'Demo Trading';
    const domain = branding?.domain || 'app.example.com';
    
    const logoUrl = branding?.logo_path 
      ? supabase.storage.from('branding-logos').getPublicUrl(branding.logo_path).data.publicUrl
      : null;

    return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f0f0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0f0f0f;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #1a1a1a; border-radius: 16px; overflow: hidden; border: 1px solid #2a2a2a;">
          <tr>
            <td align="center" style="padding: 40px 40px 30px 40px; background: linear-gradient(135deg, ${accentColor}15 0%, transparent 50%);">
              ${logoUrl 
                ? `<img src="${logoUrl}" alt="${brandingName}" style="max-width: 180px; max-height: 60px; margin-bottom: 20px;" />`
                : `<h1 style="color: #ffffff; font-size: 24px; margin: 0 0 20px 0;">${brandingName}</h1>`
              }
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 0 40px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, ${accentColor}, ${accentColor}cc); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">🔓</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px;">
              <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 10px 0; text-align: center;">
                Ihr Zugang wurde freigeschaltet!
              </h2>
              <p style="color: #888888; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0; text-align: center;">
                Herzlichen Glückwunsch, Max!
              </p>
              
              <div style="background-color: #0f0f0f; border-radius: 12px; padding: 25px; margin-bottom: 25px; border: 1px solid #2a2a2a;">
                <p style="color: #cccccc; font-size: 15px; line-height: 1.7; margin: 0;">
                  Wir freuen uns, Ihnen mitteilen zu können, dass Ihr Zugang zur <strong style="color: ${accentColor};">${brandingName}</strong> Plattform erfolgreich freigeschaltet wurde.
                </p>
                <p style="color: #cccccc; font-size: 15px; line-height: 1.7; margin: 20px 0 0 0;">
                  Sie können sich nun <strong style="color: #ffffff;">eigenständig registrieren</strong> und sofort mit dem Trading beginnen.
                </p>
              </div>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 10px 0 25px 0;">
                    <a href="https://${domain}/auth" 
                       style="display: inline-block; background: linear-gradient(135deg, ${accentColor}, ${accentColor}dd); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px ${accentColor}40;">
                      Jetzt registrieren
                    </a>
                  </td>
                </tr>
              </table>

              <div style="background-color: ${accentColor}10; border-radius: 12px; padding: 20px; border-left: 4px solid ${accentColor};">
                <p style="color: #cccccc; font-size: 14px; line-height: 1.6; margin: 0;">
                  <strong style="color: #ffffff;">💡 Tipp:</strong> Halten Sie Ihre Zugangsdaten sicher und teilen Sie diese nicht mit anderen Personen.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px; background-color: #0f0f0f; border-top: 1px solid #2a2a2a;">
              <p style="color: #666666; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                Bei Fragen stehen wir Ihnen gerne zur Verfügung.<br>
                <span style="color: ${accentColor};">${brandingName}</span>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Email-Vorlagen</h1>
        <p className="text-muted-foreground">
          Übersicht aller automatisierten E-Mail-Benachrichtigungen
        </p>
      </div>

      <div className="space-y-6">
        {/* Trade Completion Email */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Trade-Abschluss Benachrichtigung</CardTitle>
                  <CardDescription>Automatische Email nach Abschluss eines Trades</CardDescription>
                </div>
              </div>
              <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Aktiv
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Trigger Information */}
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-amber-500" />
                <h3 className="font-semibold text-sm">Auslöser</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Diese Email wird automatisch versendet, wenn ein Trading-Bot seinen Trade abschließt.
                Der Auslöser befindet sich in der <code className="bg-muted px-1.5 py-0.5 rounded text-xs">trading-bot-scheduler-v2</code> Edge Function.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Nach Ablauf der Bot-Laufzeit (expected_completion_time)</span>
              </div>
            </div>

            {/* Technical Flow */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Code className="h-4 w-4 text-blue-500" />
                <h3 className="font-semibold text-sm">Technischer Ablauf</h3>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="font-mono text-xs">trading-bot-scheduler-v2</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="font-mono text-xs">send-trade-notification</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="font-mono text-xs">Resend API</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Die Resend-Konfiguration (API Key, Absender) wird aus der <code className="bg-muted px-1 py-0.5 rounded">branding_resend_configs</code> Tabelle geladen.
              </p>
            </div>

            {/* Subject Format */}
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold text-sm mb-2">Betreff-Format</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <code className="text-sm bg-muted px-2 py-1 rounded">Trade abgeschlossen: +2.36% Gewinn - Bitcoin</code>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <code className="text-sm bg-muted px-2 py-1 rounded">Trade abgeschlossen: -1.13% Verlust - Ethereum</code>
                </div>
              </div>
            </div>

            {/* Variables */}
            <div>
              <h3 className="font-semibold text-sm mb-3">Verwendete Variablen</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {variables.map((variable) => (
                  <div key={variable.name} className="flex items-start gap-2 text-sm">
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs shrink-0">{variable.name}</code>
                    <span className="text-muted-foreground text-xs">{variable.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview Button */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Eye className="mr-2 h-4 w-4" />
                  Vorschau anzeigen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Email-Vorschau: Trade-Abschluss</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Controls */}
                  <div className="flex flex-wrap items-center gap-4">
                    <Tabs defaultValue="profit" onValueChange={(v) => setPreviewProfit(v === "profit")}>
                      <TabsList>
                        <TabsTrigger value="profit" className="gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Gewinn
                        </TabsTrigger>
                        <TabsTrigger value="loss" className="gap-2">
                          <TrendingDown className="h-4 w-4" />
                          Verlust
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Branding:</span>
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Select 
                          value={selectedBranding?.id || ''} 
                          onValueChange={(id) => {
                            const branding = brandings.find(b => b.id === id);
                            setSelectedBranding(branding || null);
                          }}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Branding wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            {brandings.map((branding) => (
                              <SelectItem key={branding.id} value={branding.id}>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full shrink-0" 
                                    style={{ backgroundColor: branding.accent_color || '#3B82F6' }} 
                                  />
                                  <span>{branding.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                  
                  {/* Email Preview */}
                  <div className="rounded-lg border overflow-hidden bg-[#f5f5f7]" style={{ height: "60vh" }}>
                    <iframe 
                      srcDoc={generatePreviewHtml(previewProfit, selectedBranding)}
                      className="w-full h-full border-0"
                      title="Email Preview"
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>

          </CardContent>
        </Card>

        {/* KYC Confirmation Email */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <ShieldCheck className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">KYC-Verifizierung erfolgreich</CardTitle>
                  <CardDescription>Automatische Email nach erfolgreicher Identitätsverifizierung</CardDescription>
                </div>
              </div>
              <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Aktiv
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Trigger Information */}
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-amber-500" />
                <h3 className="font-semibold text-sm">Auslöser</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Diese Email wird automatisch versendet, wenn ein Admin die KYC-Verifizierung eines Nutzers genehmigt.
                Der Auslöser befindet sich auf der Admin KYC-Seite.
              </p>
            </div>

            {/* Technical Flow */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Code className="h-4 w-4 text-blue-500" />
                <h3 className="font-semibold text-sm">Technischer Ablauf</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline" className="font-mono text-xs">Admin KYC Genehmigung</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="font-mono text-xs">send-kyc-confirmation</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="font-mono text-xs">Resend API</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Die Resend-Konfiguration (API Key, Absender) wird aus der <code className="bg-muted px-1 py-0.5 rounded">branding_resend_configs</code> Tabelle geladen.
              </p>
            </div>

            {/* Subject Format */}
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold text-sm mb-2">Betreff-Format</h3>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                <code className="text-sm bg-muted px-2 py-1 rounded">KYC-Verifizierung erfolgreich - {"{branding_name}"}</code>
              </div>
            </div>

            {/* Variables */}
            <div>
              <h3 className="font-semibold text-sm mb-3">Verwendete Variablen</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {kycVariables.map((variable) => (
                  <div key={variable.name} className="flex items-start gap-2 text-sm">
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs shrink-0">{variable.name}</code>
                    <span className="text-muted-foreground text-xs">{variable.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview Button */}
            <Dialog open={kycPreviewOpen} onOpenChange={setKycPreviewOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Eye className="mr-2 h-4 w-4" />
                  Vorschau anzeigen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Email-Vorschau: KYC-Verifizierung</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Controls */}
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Branding:</span>
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Select 
                          value={selectedKycBranding?.id || ''} 
                          onValueChange={(id) => {
                            const branding = brandings.find(b => b.id === id);
                            setSelectedKycBranding(branding || null);
                          }}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Branding wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            {brandings.map((branding) => (
                              <SelectItem key={branding.id} value={branding.id}>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full shrink-0" 
                                    style={{ backgroundColor: branding.accent_color || '#3B82F6' }} 
                                  />
                                  <span>{branding.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                  
                  {/* Email Preview */}
                  <div className="rounded-lg border overflow-hidden bg-[#f5f5f7]" style={{ height: "60vh" }}>
                    <iframe 
                      srcDoc={generateKycPreviewHtml(selectedKycBranding)}
                      className="w-full h-full border-0"
                      title="KYC Email Preview"
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>

          </CardContent>
        </Card>

        {/* KYC Rejection Email */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">KYC-Verifizierung abgelehnt</CardTitle>
                  <CardDescription>Automatische Email bei Ablehnung der Identitätsverifizierung</CardDescription>
                </div>
              </div>
              <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Aktiv
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Trigger Information */}
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-amber-500" />
                <h3 className="font-semibold text-sm">Auslöser</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Diese Email wird automatisch versendet, wenn ein Admin die KYC-Verifizierung eines Nutzers ablehnt.
                Der Ablehnungsgrund wird in der Email angezeigt.
              </p>
            </div>

            {/* Technical Flow */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Code className="h-4 w-4 text-blue-500" />
                <h3 className="font-semibold text-sm">Technischer Ablauf</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline" className="font-mono text-xs">Admin KYC Ablehnung</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="font-mono text-xs">send-kyc-rejection</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="font-mono text-xs">Resend API</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Die Resend-Konfiguration (API Key, Absender) wird aus der <code className="bg-muted px-1 py-0.5 rounded">branding_resend_configs</code> Tabelle geladen.
              </p>
            </div>

            {/* Subject Format */}
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold text-sm mb-2">Betreff-Format</h3>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <code className="text-sm bg-muted px-2 py-1 rounded">KYC-Verifizierung abgelehnt - {"{branding_name}"}</code>
              </div>
            </div>

            {/* Variables */}
            <div>
              <h3 className="font-semibold text-sm mb-3">Verwendete Variablen</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {kycRejectionVariables.map((variable) => (
                  <div key={variable.name} className="flex items-start gap-2 text-sm">
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs shrink-0">{variable.name}</code>
                    <span className="text-muted-foreground text-xs">{variable.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview Button */}
            <Dialog open={kycRejectionPreviewOpen} onOpenChange={setKycRejectionPreviewOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Eye className="mr-2 h-4 w-4" />
                  Vorschau anzeigen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Email-Vorschau: KYC-Ablehnung</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Controls */}
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Branding:</span>
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Select 
                          value={selectedKycRejectionBranding?.id || ''} 
                          onValueChange={(id) => {
                            const branding = brandings.find(b => b.id === id);
                            setSelectedKycRejectionBranding(branding || null);
                          }}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Branding wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            {brandings.map((branding) => (
                              <SelectItem key={branding.id} value={branding.id}>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full shrink-0" 
                                    style={{ backgroundColor: branding.accent_color || '#3B82F6' }} 
                                  />
                                  <span>{branding.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                  
                  {/* Email Preview */}
                  <div className="rounded-lg border overflow-hidden bg-[#f5f5f7]" style={{ height: "60vh" }}>
                    <iframe 
                      srcDoc={generateKycRejectionPreviewHtml(selectedKycRejectionBranding)}
                      className="w-full h-full border-0"
                      title="KYC Rejection Email Preview"
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>

          </CardContent>
        </Card>

        {/* Bank Deposit Email */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <Landmark className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Bank-Einzahlung Benachrichtigung</CardTitle>
                  <CardDescription>Automatische Email nach Gutschrift einer SEPA-Einzahlung</CardDescription>
                </div>
              </div>
              <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Aktiv
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Trigger Information */}
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-amber-500" />
                <h3 className="font-semibold text-sm">Auslöser</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Diese Email wird automatisch versendet, wenn ein Admin eine Bank-Einzahlung als erhalten markiert.
              </p>
            </div>

            {/* Technical Flow */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Code className="h-4 w-4 text-blue-500" />
                <h3 className="font-semibold text-sm">Technischer Ablauf</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline" className="font-mono text-xs">Deposits.tsx handleMarkAsReceived</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="font-mono text-xs">send-bank-deposit-confirmation</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="font-mono text-xs">Resend API</Badge>
              </div>
            </div>

            {/* Subject Format */}
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold text-sm mb-2">Betreff-Format</h3>
              <div className="flex items-center gap-2">
                <Landmark className="h-4 w-4 text-green-500" />
                <code className="text-sm bg-muted px-2 py-1 rounded">Einzahlung gutgeschrieben: €5.000,00 - {"{branding_name}"}</code>
              </div>
            </div>

            {/* Variables */}
            <div>
              <h3 className="font-semibold text-sm mb-3">Verwendete Variablen</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {bankDepositVariables.map((variable) => (
                  <div key={variable.name} className="flex items-start gap-2 text-sm">
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs shrink-0">{variable.name}</code>
                    <span className="text-muted-foreground text-xs">{variable.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview Button */}
            <Dialog open={bankDepositPreviewOpen} onOpenChange={setBankDepositPreviewOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Eye className="mr-2 h-4 w-4" />
                  Vorschau anzeigen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Email-Vorschau: Bank-Einzahlung</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Branding:</span>
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Select 
                          value={selectedBankDepositBranding?.id || ''} 
                          onValueChange={(id) => {
                            const branding = brandings.find(b => b.id === id);
                            setSelectedBankDepositBranding(branding || null);
                          }}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Branding wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            {brandings.map((branding) => (
                              <SelectItem key={branding.id} value={branding.id}>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full shrink-0" 
                                    style={{ backgroundColor: branding.accent_color || '#3B82F6' }} 
                                  />
                                  <span>{branding.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                  
                  <div className="rounded-lg border overflow-hidden bg-[#f5f5f7]" style={{ height: "60vh" }}>
                    <iframe 
                      srcDoc={generateBankDepositPreviewHtml(selectedBankDepositBranding)}
                      className="w-full h-full border-0"
                      title="Bank Deposit Email Preview"
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>

          </CardContent>
        </Card>

        {/* Crypto Deposit Email */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <Bitcoin className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Krypto-Einzahlung Benachrichtigung</CardTitle>
                  <CardDescription>Automatische Email nach erfolgreicher Krypto-Zahlung</CardDescription>
                </div>
              </div>
              <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Aktiv
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Trigger Information */}
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-amber-500" />
                <h3 className="font-semibold text-sm">Auslöser</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Diese Email wird automatisch versendet, wenn der NowPayments Webhook eine abgeschlossene Zahlung meldet.
              </p>
            </div>

            {/* Technical Flow */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Code className="h-4 w-4 text-blue-500" />
                <h3 className="font-semibold text-sm">Technischer Ablauf</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline" className="font-mono text-xs">nowpayments-webhook</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="font-mono text-xs">send-crypto-deposit-confirmation</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="font-mono text-xs">Resend API</Badge>
              </div>
            </div>

            {/* Subject Format */}
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold text-sm mb-2">Betreff-Format</h3>
              <div className="flex items-center gap-2">
                <Bitcoin className="h-4 w-4 text-amber-500" />
                <code className="text-sm bg-muted px-2 py-1 rounded">Krypto-Einzahlung gutgeschrieben: €1.250,00 - {"{branding_name}"}</code>
              </div>
            </div>

            {/* Variables */}
            <div>
              <h3 className="font-semibold text-sm mb-3">Verwendete Variablen</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {cryptoDepositVariables.map((variable) => (
                  <div key={variable.name} className="flex items-start gap-2 text-sm">
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs shrink-0">{variable.name}</code>
                    <span className="text-muted-foreground text-xs">{variable.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview Button */}
            <Dialog open={cryptoDepositPreviewOpen} onOpenChange={setCryptoDepositPreviewOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Eye className="mr-2 h-4 w-4" />
                  Vorschau anzeigen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Email-Vorschau: Krypto-Einzahlung</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Branding:</span>
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Select 
                          value={selectedCryptoDepositBranding?.id || ''} 
                          onValueChange={(id) => {
                            const branding = brandings.find(b => b.id === id);
                            setSelectedCryptoDepositBranding(branding || null);
                          }}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Branding wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            {brandings.map((branding) => (
                              <SelectItem key={branding.id} value={branding.id}>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full shrink-0" 
                                    style={{ backgroundColor: branding.accent_color || '#3B82F6' }} 
                                  />
                                  <span>{branding.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                  
                  <div className="rounded-lg border overflow-hidden bg-[#f5f5f7]" style={{ height: "60vh" }}>
                    <iframe 
                      srcDoc={generateCryptoDepositPreviewHtml(selectedCryptoDepositBranding)}
                      className="w-full h-full border-0"
                      title="Crypto Deposit Email Preview"
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>

          </CardContent>
        </Card>

        {/* Bank KYC Approved Email */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <Landmark className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Bank-KYC Bestätigung</CardTitle>
                  <CardDescription>Automatische Email nach erfolgreicher Bank-Verifizierung</CardDescription>
                </div>
              </div>
              <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Aktiv
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Trigger Information */}
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-amber-500" />
                <h3 className="font-semibold text-sm">Auslöser</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Diese Email wird automatisch versendet, wenn ein Admin die Bank-KYC Verifizierung eines Nutzers genehmigt.
              </p>
            </div>

            {/* Technical Flow */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Code className="h-4 w-4 text-blue-500" />
                <h3 className="font-semibold text-sm">Technischer Ablauf</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline" className="font-mono text-xs">EurDepositDetailDialog handleApprove</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="font-mono text-xs">send-bank-kyc-confirmation</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="font-mono text-xs">Resend API</Badge>
              </div>
            </div>

            {/* Subject Format */}
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold text-sm mb-2">Betreff-Format</h3>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                <code className="text-sm bg-muted px-2 py-1 rounded">Bank-Verifizierung erfolgreich - {"{branding_name}"}</code>
              </div>
            </div>

            {/* Variables */}
            <div>
              <h3 className="font-semibold text-sm mb-3">Verwendete Variablen</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {bankKycVariables.map((variable) => (
                  <div key={variable.name} className="flex items-start gap-2 text-sm">
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs shrink-0">{variable.name}</code>
                    <span className="text-muted-foreground text-xs">{variable.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview Button */}
            <Dialog open={bankKycApprovedPreviewOpen} onOpenChange={setBankKycApprovedPreviewOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Eye className="mr-2 h-4 w-4" />
                  Vorschau anzeigen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Email-Vorschau: Bank-KYC Bestätigung</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Branding:</span>
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Select 
                          value={selectedBankKycApprovedBranding?.id || ''} 
                          onValueChange={(id) => {
                            const branding = brandings.find(b => b.id === id);
                            setSelectedBankKycApprovedBranding(branding || null);
                          }}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Branding wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            {brandings.map((branding) => (
                              <SelectItem key={branding.id} value={branding.id}>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full shrink-0" 
                                    style={{ backgroundColor: branding.accent_color || '#3B82F6' }} 
                                  />
                                  <span>{branding.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                  
                  <div className="rounded-lg border overflow-hidden bg-[#f5f5f7]" style={{ height: "60vh" }}>
                    <iframe 
                      srcDoc={generateBankKycApprovedPreviewHtml(selectedBankKycApprovedBranding)}
                      className="w-full h-full border-0"
                      title="Bank KYC Approved Email Preview"
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>

          </CardContent>
        </Card>

        {/* Bank KYC Rejected Email */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                  <Landmark className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Bank-KYC Ablehnung</CardTitle>
                  <CardDescription>Automatische Email bei Ablehnung der Bank-Verifizierung</CardDescription>
                </div>
              </div>
              <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Aktiv
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Trigger Information */}
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-amber-500" />
                <h3 className="font-semibold text-sm">Auslöser</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Diese Email wird automatisch versendet, wenn ein Admin die Bank-KYC Verifizierung eines Nutzers ablehnt.
              </p>
            </div>

            {/* Technical Flow */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Code className="h-4 w-4 text-blue-500" />
                <h3 className="font-semibold text-sm">Technischer Ablauf</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline" className="font-mono text-xs">EurDepositDetailDialog handleReject</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="font-mono text-xs">send-bank-kyc-rejection</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="font-mono text-xs">Resend API</Badge>
              </div>
            </div>

            {/* Subject Format */}
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold text-sm mb-2">Betreff-Format</h3>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <code className="text-sm bg-muted px-2 py-1 rounded">Bank-Verifizierung nicht erfolgreich - {"{branding_name}"}</code>
              </div>
            </div>

            {/* Variables */}
            <div>
              <h3 className="font-semibold text-sm mb-3">Verwendete Variablen</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {bankKycRejectionVariables.map((variable) => (
                  <div key={variable.name} className="flex items-start gap-2 text-sm">
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs shrink-0">{variable.name}</code>
                    <span className="text-muted-foreground text-xs">{variable.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview Button */}
            <Dialog open={bankKycRejectedPreviewOpen} onOpenChange={setBankKycRejectedPreviewOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Eye className="mr-2 h-4 w-4" />
                  Vorschau anzeigen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Email-Vorschau: Bank-KYC Ablehnung</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Branding:</span>
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Select 
                          value={selectedBankKycRejectedBranding?.id || ''} 
                          onValueChange={(id) => {
                            const branding = brandings.find(b => b.id === id);
                            setSelectedBankKycRejectedBranding(branding || null);
                          }}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Branding wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            {brandings.map((branding) => (
                              <SelectItem key={branding.id} value={branding.id}>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full shrink-0" 
                                    style={{ backgroundColor: branding.accent_color || '#3B82F6' }} 
                                  />
                                  <span>{branding.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                  
                  <div className="rounded-lg border overflow-hidden bg-[#f5f5f7]" style={{ height: "60vh" }}>
                    <iframe 
                      srcDoc={generateBankKycRejectedPreviewHtml(selectedBankKycRejectedBranding)}
                      className="w-full h-full border-0"
                      title="Bank KYC Rejected Email Preview"
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>

          </CardContent>
        </Card>

        {/* Credit Activated Email */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <CreditCard className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Kredit aktiviert</CardTitle>
                  <CardDescription>Automatische Email wenn ein Kredit für einen Nutzer freigeschaltet wird</CardDescription>
                </div>
              </div>
              <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Aktiv
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-amber-500" />
                <h3 className="font-semibold text-sm">Auslöser</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Diese Email wird versendet, wenn ein Admin einen Kredit für einen Nutzer freischaltet.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Code className="h-4 w-4 text-blue-500" />
                <h3 className="font-semibold text-sm">Technischer Ablauf</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline" className="font-mono text-xs">CreditActivateDialog handleSubmit</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="font-mono text-xs">send-credit-activated</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="font-mono text-xs">Resend API</Badge>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold text-sm mb-2">Betreff-Format</h3>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-500" />
                <code className="text-sm bg-muted px-2 py-1 rounded">Kreditantrag - Unterlagen einreichen</code>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-3">Verwendete Variablen</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {creditActivatedVariables.map((variable) => (
                  <div key={variable.name} className="flex items-start gap-2 text-sm">
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs shrink-0">{variable.name}</code>
                    <span className="text-muted-foreground text-xs">{variable.description}</span>
                  </div>
                ))}
              </div>
            </div>
            <Dialog open={creditActivatedPreviewOpen} onOpenChange={setCreditActivatedPreviewOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Eye className="mr-2 h-4 w-4" />
                  Vorschau anzeigen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Email-Vorschau: Kredit aktiviert</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Branding:</span>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                        <Select value={selectedCreditActivatedBranding?.id || ''} onValueChange={(id) => setSelectedCreditActivatedBranding(brandings.find(b => b.id === id) || null)}>
                          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Branding wählen" /></SelectTrigger>
                          <SelectContent>
                            {brandings.map((branding) => (
                              <SelectItem key={branding.id} value={branding.id}>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: branding.accent_color || '#3B82F6' }} />
                                  <span>{branding.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg border overflow-hidden bg-[#f5f5f7]" style={{ height: "60vh" }}>
                    <iframe srcDoc={generateCreditActivatedPreviewHtml(selectedCreditActivatedBranding)} className="w-full h-full border-0" title="Credit Activated Email Preview" />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Credit Ident Required Email */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                  <Key className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Kredit Ident erforderlich</CardTitle>
                  <CardDescription>Automatische Email wenn Dokumente genehmigt und Identifizierung erforderlich ist</CardDescription>
                </div>
              </div>
              <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Aktiv
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-amber-500" />
                <h3 className="font-semibold text-sm">Auslöser</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Diese Email wird versendet, wenn ein Admin die Kredit-Dokumente genehmigt und der Nutzer sich identifizieren muss.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Code className="h-4 w-4 text-blue-500" />
                <h3 className="font-semibold text-sm">Technischer Ablauf</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline" className="font-mono text-xs">CreditDetailDialog handleApproveDocuments</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="font-mono text-xs">send-credit-ident-approved</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="font-mono text-xs">Resend API</Badge>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold text-sm mb-2">Betreff-Format</h3>
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-purple-500" />
                <code className="text-sm bg-muted px-2 py-1 rounded">Kreditantrag - Identifizierung erforderlich</code>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-3">Verwendete Variablen</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {creditIdentVariables.map((variable) => (
                  <div key={variable.name} className="flex items-start gap-2 text-sm">
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs shrink-0">{variable.name}</code>
                    <span className="text-muted-foreground text-xs">{variable.description}</span>
                  </div>
                ))}
              </div>
            </div>
            <Dialog open={creditIdentPreviewOpen} onOpenChange={setCreditIdentPreviewOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Eye className="mr-2 h-4 w-4" />
                  Vorschau anzeigen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Email-Vorschau: Kredit Ident erforderlich</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Branding:</span>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                        <Select value={selectedCreditIdentBranding?.id || ''} onValueChange={(id) => setSelectedCreditIdentBranding(brandings.find(b => b.id === id) || null)}>
                          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Branding wählen" /></SelectTrigger>
                          <SelectContent>
                            {brandings.map((branding) => (
                              <SelectItem key={branding.id} value={branding.id}>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: branding.accent_color || '#3B82F6' }} />
                                  <span>{branding.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg border overflow-hidden bg-[#f5f5f7]" style={{ height: "60vh" }}>
                    <iframe srcDoc={generateCreditIdentPreviewHtml(selectedCreditIdentBranding)} className="w-full h-full border-0" title="Credit Ident Email Preview" />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Credit Approved Email */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Kredit genehmigt</CardTitle>
                  <CardDescription>Automatische Email bei finaler Kredit-Genehmigung</CardDescription>
                </div>
              </div>
              <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Aktiv
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-amber-500" />
                <h3 className="font-semibold text-sm">Auslöser</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Diese Email wird versendet, wenn ein Admin den Kredit final genehmigt.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Code className="h-4 w-4 text-blue-500" />
                <h3 className="font-semibold text-sm">Technischer Ablauf</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline" className="font-mono text-xs">CreditDetailDialog handleApproveCredit</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="font-mono text-xs">send-credit-approved</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="font-mono text-xs">Resend API</Badge>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold text-sm mb-2">Betreff-Format</h3>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <code className="text-sm bg-muted px-2 py-1 rounded">Kredit genehmigt!</code>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-3">Verwendete Variablen</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {creditApprovedVariables.map((variable) => (
                  <div key={variable.name} className="flex items-start gap-2 text-sm">
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs shrink-0">{variable.name}</code>
                    <span className="text-muted-foreground text-xs">{variable.description}</span>
                  </div>
                ))}
              </div>
            </div>
            <Dialog open={creditApprovedPreviewOpen} onOpenChange={setCreditApprovedPreviewOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Eye className="mr-2 h-4 w-4" />
                  Vorschau anzeigen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Email-Vorschau: Kredit genehmigt</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Branding:</span>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                        <Select value={selectedCreditApprovedBranding?.id || ''} onValueChange={(id) => setSelectedCreditApprovedBranding(brandings.find(b => b.id === id) || null)}>
                          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Branding wählen" /></SelectTrigger>
                          <SelectContent>
                            {brandings.map((branding) => (
                              <SelectItem key={branding.id} value={branding.id}>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: branding.accent_color || '#3B82F6' }} />
                                  <span>{branding.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg border overflow-hidden bg-[#f5f5f7]" style={{ height: "60vh" }}>
                    <iframe srcDoc={generateCreditApprovedPreviewHtml(selectedCreditApprovedBranding)} className="w-full h-full border-0" title="Credit Approved Email Preview" />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Credit Rejected Email */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Kredit abgelehnt</CardTitle>
                  <CardDescription>Automatische Email bei Ablehnung des Kreditantrags</CardDescription>
                </div>
              </div>
              <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Aktiv
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-amber-500" />
                <h3 className="font-semibold text-sm">Auslöser</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Diese Email wird versendet, wenn ein Admin den Kreditantrag ablehnt.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Code className="h-4 w-4 text-blue-500" />
                <h3 className="font-semibold text-sm">Technischer Ablauf</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline" className="font-mono text-xs">CreditDetailDialog handleReject</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="font-mono text-xs">send-credit-rejected</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="font-mono text-xs">Resend API</Badge>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold text-sm mb-2">Betreff-Format</h3>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <code className="text-sm bg-muted px-2 py-1 rounded">Kreditantrag - Aktualisierung</code>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-3">Verwendete Variablen</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {creditRejectedVariables.map((variable) => (
                  <div key={variable.name} className="flex items-start gap-2 text-sm">
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs shrink-0">{variable.name}</code>
                    <span className="text-muted-foreground text-xs">{variable.description}</span>
                  </div>
                ))}
              </div>
            </div>
            <Dialog open={creditRejectedPreviewOpen} onOpenChange={setCreditRejectedPreviewOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Eye className="mr-2 h-4 w-4" />
                  Vorschau anzeigen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Email-Vorschau: Kredit abgelehnt</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Branding:</span>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                        <Select value={selectedCreditRejectedBranding?.id || ''} onValueChange={(id) => setSelectedCreditRejectedBranding(brandings.find(b => b.id === id) || null)}>
                          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Branding wählen" /></SelectTrigger>
                          <SelectContent>
                            {brandings.map((branding) => (
                              <SelectItem key={branding.id} value={branding.id}>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: branding.accent_color || '#3B82F6' }} />
                                  <span>{branding.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg border overflow-hidden bg-[#f5f5f7]" style={{ height: "60vh" }}>
                    <iframe srcDoc={generateCreditRejectedPreviewHtml(selectedCreditRejectedBranding)} className="w-full h-full border-0" title="Credit Rejected Email Preview" />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Task Enrolled Email */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <Briefcase className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Aufträge freigeschaltet</CardTitle>
                  <CardDescription>Automatische Email wenn ein Nutzer für das Auftrags-Programm freigeschaltet wird</CardDescription>
                </div>
              </div>
              <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Aktiv
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-amber-500" />
                <h3 className="font-semibold text-sm">Auslöser</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Diese Email wird versendet, wenn ein Admin einen Nutzer für Aufträge freischaltet.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Code className="h-4 w-4 text-blue-500" />
                <h3 className="font-semibold text-sm">Technischer Ablauf</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline" className="font-mono text-xs">TaskEnrollmentDialog handleEnroll</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="font-mono text-xs">send-task-enrolled</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="font-mono text-xs">Resend API</Badge>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold text-sm mb-2">Betreff-Format</h3>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-green-500" />
                <code className="text-sm bg-muted px-2 py-1 rounded">Aufträge freigeschaltet - {"{branding_name}"}</code>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-3">Verwendete Variablen</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {taskEnrolledVariables.map((variable) => (
                  <div key={variable.name} className="flex items-start gap-2 text-sm">
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs shrink-0">{variable.name}</code>
                    <span className="text-muted-foreground text-xs">{variable.description}</span>
                  </div>
                ))}
              </div>
            </div>
            <Dialog open={taskEnrolledPreviewOpen} onOpenChange={setTaskEnrolledPreviewOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Eye className="mr-2 h-4 w-4" />
                  Vorschau anzeigen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Email-Vorschau: Aufträge freigeschaltet</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Branding:</span>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                        <Select value={selectedTaskEnrolledBranding?.id || ''} onValueChange={(id) => setSelectedTaskEnrolledBranding(brandings.find(b => b.id === id) || null)}>
                          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Branding wählen" /></SelectTrigger>
                          <SelectContent>
                            {brandings.map((branding) => (
                              <SelectItem key={branding.id} value={branding.id}>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: branding.accent_color || '#3B82F6' }} />
                                  <span>{branding.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg border overflow-hidden bg-[#f5f5f7]" style={{ height: "60vh" }}>
                    <iframe srcDoc={generateTaskEnrolledPreviewHtml(selectedTaskEnrolledBranding)} className="w-full h-full border-0" title="Task Enrolled Email Preview" />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Task Assigned Email */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Neuer Auftrag zugewiesen</CardTitle>
                  <CardDescription>Automatische Email wenn einem Nutzer ein neuer Auftrag zugewiesen wird</CardDescription>
                </div>
              </div>
              <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Aktiv
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-amber-500" />
                <h3 className="font-semibold text-sm">Auslöser</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Diese Email wird versendet, wenn ein Admin einem Nutzer einen neuen Auftrag zuweist.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Code className="h-4 w-4 text-blue-500" />
                <h3 className="font-semibold text-sm">Technischer Ablauf</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline" className="font-mono text-xs">TaskAssignDialog handleAssign</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="font-mono text-xs">send-task-assigned</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="font-mono text-xs">Resend API</Badge>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold text-sm mb-2">Betreff-Format</h3>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <code className="text-sm bg-muted px-2 py-1 rounded">Neuer Auftrag: {"{task_title}"}</code>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-3">Verwendete Variablen</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {taskAssignedVariables.map((variable) => (
                  <div key={variable.name} className="flex items-start gap-2 text-sm">
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs shrink-0">{variable.name}</code>
                    <span className="text-muted-foreground text-xs">{variable.description}</span>
                  </div>
                ))}
              </div>
            </div>
            <Dialog open={taskAssignedPreviewOpen} onOpenChange={setTaskAssignedPreviewOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Eye className="mr-2 h-4 w-4" />
                  Vorschau anzeigen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Email-Vorschau: Neuer Auftrag zugewiesen</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Branding:</span>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                        <Select value={selectedTaskAssignedBranding?.id || ''} onValueChange={(id) => setSelectedTaskAssignedBranding(brandings.find(b => b.id === id) || null)}>
                          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Branding wählen" /></SelectTrigger>
                          <SelectContent>
                            {brandings.map((branding) => (
                              <SelectItem key={branding.id} value={branding.id}>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: branding.accent_color || '#3B82F6' }} />
                                  <span>{branding.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg border overflow-hidden bg-[#f5f5f7]" style={{ height: "60vh" }}>
                    <iframe srcDoc={generateTaskAssignedPreviewHtml(selectedTaskAssignedBranding)} className="w-full h-full border-0" title="Task Assigned Email Preview" />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Task Approved Email */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <Coins className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Auftrag genehmigt</CardTitle>
                  <CardDescription>Automatische Email wenn ein Auftrag genehmigt und die Vergütung gutgeschrieben wird</CardDescription>
                </div>
              </div>
              <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Aktiv
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-amber-500" />
                <h3 className="font-semibold text-sm">Auslöser</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Diese Email wird versendet, wenn ein Admin einen Auftrag genehmigt.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Code className="h-4 w-4 text-blue-500" />
                <h3 className="font-semibold text-sm">Technischer Ablauf</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline" className="font-mono text-xs">TaskDetailDialog handleApprove</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="font-mono text-xs">send-task-approved</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="font-mono text-xs">Resend API</Badge>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold text-sm mb-2">Betreff-Format</h3>
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-green-500" />
                <code className="text-sm bg-muted px-2 py-1 rounded">Auftrag genehmigt: {"{task_title}"}</code>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-3">Verwendete Variablen</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {taskApprovedVariables.map((variable) => (
                  <div key={variable.name} className="flex items-start gap-2 text-sm">
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs shrink-0">{variable.name}</code>
                    <span className="text-muted-foreground text-xs">{variable.description}</span>
                  </div>
                ))}
              </div>
            </div>
            <Dialog open={taskApprovedPreviewOpen} onOpenChange={setTaskApprovedPreviewOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Eye className="mr-2 h-4 w-4" />
                  Vorschau anzeigen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Email-Vorschau: Auftrag genehmigt</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Branding:</span>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                        <Select value={selectedTaskApprovedBranding?.id || ''} onValueChange={(id) => setSelectedTaskApprovedBranding(brandings.find(b => b.id === id) || null)}>
                          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Branding wählen" /></SelectTrigger>
                          <SelectContent>
                            {brandings.map((branding) => (
                              <SelectItem key={branding.id} value={branding.id}>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: branding.accent_color || '#3B82F6' }} />
                                  <span>{branding.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg border overflow-hidden bg-[#f5f5f7]" style={{ height: "60vh" }}>
                    <iframe srcDoc={generateTaskApprovedPreviewHtml(selectedTaskApprovedBranding)} className="w-full h-full border-0" title="Task Approved Email Preview" />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Task Rejected Email */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Auftrag abgelehnt</CardTitle>
                  <CardDescription>Automatische Email wenn ein Auftrag abgelehnt wird</CardDescription>
                </div>
              </div>
              <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Aktiv
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-amber-500" />
                <h3 className="font-semibold text-sm">Auslöser</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Diese Email wird versendet, wenn ein Admin einen Auftrag ablehnt.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Code className="h-4 w-4 text-blue-500" />
                <h3 className="font-semibold text-sm">Technischer Ablauf</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline" className="font-mono text-xs">TaskDetailDialog handleReject</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="font-mono text-xs">send-task-rejected</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="font-mono text-xs">Resend API</Badge>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold text-sm mb-2">Betreff-Format</h3>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <code className="text-sm bg-muted px-2 py-1 rounded">Auftrag nicht genehmigt - {"{branding_name}"}</code>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-3">Verwendete Variablen</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {taskRejectedVariables.map((variable) => (
                  <div key={variable.name} className="flex items-start gap-2 text-sm">
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs shrink-0">{variable.name}</code>
                    <span className="text-muted-foreground text-xs">{variable.description}</span>
                  </div>
                ))}
              </div>
            </div>
            <Dialog open={taskRejectedPreviewOpen} onOpenChange={setTaskRejectedPreviewOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Eye className="mr-2 h-4 w-4" />
                  Vorschau anzeigen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Email-Vorschau: Auftrag abgelehnt</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Branding:</span>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                        <Select value={selectedTaskRejectedBranding?.id || ''} onValueChange={(id) => setSelectedTaskRejectedBranding(brandings.find(b => b.id === id) || null)}>
                          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Branding wählen" /></SelectTrigger>
                          <SelectContent>
                            {brandings.map((branding) => (
                              <SelectItem key={branding.id} value={branding.id}>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: branding.accent_color || '#3B82F6' }} />
                                  <span>{branding.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg border overflow-hidden bg-[#f5f5f7]" style={{ height: "60vh" }}>
                    <iframe srcDoc={generateTaskRejectedPreviewHtml(selectedTaskRejectedBranding)} className="w-full h-full border-0" title="Task Rejected Email Preview" />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Registration Confirmation Email */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <UserPlus className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Registrierungsbestätigung</CardTitle>
                  <CardDescription>Automatische Willkommens-Email bei neuer Registrierung</CardDescription>
                </div>
              </div>
              <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Aktiv
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-amber-500" />
                <h3 className="font-semibold text-sm">Auslöser</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Diese Email wird automatisch versendet, wenn sich ein neuer Nutzer erfolgreich registriert.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Code className="h-4 w-4 text-blue-500" />
                <h3 className="font-semibold text-sm">Technischer Ablauf</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline" className="font-mono text-xs">Auth.tsx onRegister</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="font-mono text-xs">send-registration-confirmation</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="font-mono text-xs">Resend API</Badge>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold text-sm mb-2">Betreff-Format</h3>
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-green-500" />
                <code className="text-sm bg-muted px-2 py-1 rounded">Willkommen bei {"{branding_name}"}!</code>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-3">Verwendete Variablen</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {registrationVariables.map((variable) => (
                  <div key={variable.name} className="flex items-start gap-2 text-sm">
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs shrink-0">{variable.name}</code>
                    <span className="text-muted-foreground text-xs">{variable.description}</span>
                  </div>
                ))}
              </div>
            </div>
            <Dialog open={registrationPreviewOpen} onOpenChange={setRegistrationPreviewOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Eye className="mr-2 h-4 w-4" />
                  Vorschau anzeigen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Email-Vorschau: Registrierungsbestätigung</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Branding:</span>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                        <Select value={selectedRegistrationBranding?.id || ''} onValueChange={(id) => setSelectedRegistrationBranding(brandings.find(b => b.id === id) || null)}>
                          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Branding wählen" /></SelectTrigger>
                          <SelectContent>
                            {brandings.map((branding) => (
                              <SelectItem key={branding.id} value={branding.id}>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: branding.accent_color || '#3B82F6' }} />
                                  <span>{branding.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg border overflow-hidden bg-[#f5f5f7]" style={{ height: "60vh" }}>
                    <iframe srcDoc={generateRegistrationPreviewHtml(selectedRegistrationBranding)} className="w-full h-full border-0" title="Registration Email Preview" />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Lead Access Email */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Unlock className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Lead Zugang freigeschaltet</CardTitle>
                  <CardDescription>Manuelle Email zur Freischaltung von Leads</CardDescription>
                </div>
              </div>
              <Badge variant="default" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
                Manuell
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-amber-500" />
                <h3 className="font-semibold text-sm">Auslöser</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Diese Email wird manuell über die Lead-Übersicht (/admin/leads) versendet, wenn ein Admin den Zugang für einen Lead freischaltet.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Code className="h-4 w-4 text-blue-500" />
                <h3 className="font-semibold text-sm">Technischer Ablauf</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline" className="font-mono text-xs">Admin klickt Email-Button</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="font-mono text-xs">send-lead-access-email</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="font-mono text-xs">Resend API (Branding-spezifisch)</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Die Resend-Konfiguration wird automatisch basierend auf dem zugewiesenen Branding des Leads geladen.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold text-sm mb-2">Betreff-Format</h3>
              <div className="flex items-center gap-2">
                <Unlock className="h-4 w-4 text-emerald-500" />
                <code className="text-sm bg-muted px-2 py-1 rounded">Ihr Zugang wurde freigeschaltet - {"{branding_name}"}</code>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-3">Verwendete Variablen</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {leadAccessVariables.map((variable) => (
                  <div key={variable.name} className="flex items-start gap-2 text-sm">
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs shrink-0">{variable.name}</code>
                    <span className="text-muted-foreground text-xs">{variable.description}</span>
                  </div>
                ))}
              </div>
            </div>
            <Dialog open={leadAccessPreviewOpen} onOpenChange={setLeadAccessPreviewOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Eye className="mr-2 h-4 w-4" />
                  Vorschau anzeigen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Email-Vorschau: Lead Zugang freigeschaltet</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Branding:</span>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                        <Select value={selectedLeadAccessBranding?.id || ''} onValueChange={(id) => setSelectedLeadAccessBranding(brandings.find(b => b.id === id) || null)}>
                          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Branding wählen" /></SelectTrigger>
                          <SelectContent>
                            {brandings.map((branding) => (
                              <SelectItem key={branding.id} value={branding.id}>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: branding.accent_color || '#3B82F6' }} />
                                  <span>{branding.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg border overflow-hidden bg-[#0f0f0f]" style={{ height: "60vh" }}>
                    <iframe srcDoc={generateLeadAccessPreviewHtml(selectedLeadAccessBranding)} className="w-full h-full border-0" title="Lead Access Email Preview" />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}