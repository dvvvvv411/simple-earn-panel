import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Eye, Code, Zap, Clock, ArrowRight, TrendingUp, TrendingDown, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Branding {
  id: string;
  name: string;
  accent_color: string | null;
  domain: string | null;
}

export default function EmailTemplates() {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewProfit, setPreviewProfit] = useState(true);
  const [brandings, setBrandings] = useState<Branding[]>([]);
  const [selectedBranding, setSelectedBranding] = useState<Branding | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrandings = async () => {
      const { data, error } = await supabase
        .from('brandings')
        .select('id, name, accent_color, domain')
        .order('name');
      
      if (data && data.length > 0) {
        setBrandings(data);
        setSelectedBranding(data[0]);
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

  const generatePreviewHtml = (isProfit: boolean, branding: Branding | null) => {
    const accentColor = branding?.accent_color || '#3B82F6';
    const brandingName = branding?.name || 'Demo Trading';
    const domain = branding?.domain || 'app.example.com';
    const profitColor = isProfit ? '#10B981' : '#DC2626';
    const profitSign = isProfit ? '+' : '';
    const profitAmount = isProfit ? 2.36 : -1.13;
    const profitPercent = isProfit ? 2.36 : -1.13;

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
            <td style="background: linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">${brandingName}</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Transaktionsbestätigung</p>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Email-Vorlagen</h1>
        <p className="text-muted-foreground">
          Übersicht aller automatisierten E-Mail-Benachrichtigungen
        </p>
      </div>

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
                <DialogTitle>Email-Vorschau</DialogTitle>
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
    </div>
  );
}
