import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Eye, Code, Zap, Clock, ArrowRight, TrendingUp, TrendingDown, CheckCircle2 } from "lucide-react";

export default function EmailTemplates() {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewProfit, setPreviewProfit] = useState(true);
  const [previewColor, setPreviewColor] = useState("#3B82F6");

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

  const generatePreviewHtml = (isProfit: boolean, accentColor: string) => {
    const profitColor = isProfit ? '#10B981' : '#EF4444';
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
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0a0a0a;">
    <tr>
      <td style="padding: 40px 20px;">
        <table cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #111111; border-radius: 16px; overflow: hidden; border: 1px solid #222222;">
          
          <tr>
            <td style="background: linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">Demo Trading</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px 0; color: #a1a1aa; font-size: 16px;">Hallo Max,</p>
              
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="display: inline-block; background-color: ${profitColor}15; border: 1px solid ${profitColor}40; border-radius: 12px; padding: 16px 24px;">
                  <p style="margin: 0; color: ${profitColor}; font-size: 18px; font-weight: 600;">
                    ${isProfit ? '🎉 Ihr Trade wurde erfolgreich abgeschlossen!' : '📊 Ihr Trade wurde abgeschlossen'}
                  </p>
                </div>
              </div>

              <table cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #1a1a1a; border-radius: 12px; border: 1px solid #2a2a2a; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px 24px; border-bottom: 1px solid #2a2a2a;">
                    <table cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="width: 48px;">
                          <img src="https://nowpayments.io/images/coins/btc.svg" alt="BTC" width="40" height="40" style="border-radius: 50%; background-color: #2a2a2a;">
                        </td>
                        <td style="padding-left: 12px;">
                          <p style="margin: 0; color: white; font-size: 18px; font-weight: 600;">Bitcoin</p>
                          <p style="margin: 4px 0 0 0; color: #71717a; font-size: 14px;">BTC</p>
                        </td>
                        <td style="text-align: right;">
                          <span style="display: inline-block; background-color: #10B98120; color: #10B981; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 600;">LONG 15x</span>
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
                          <p style="margin: 0; color: #71717a; font-size: 13px;">Einstiegspreis</p>
                          <p style="margin: 4px 0 0 0; color: white; font-size: 16px; font-weight: 500;">94.150,00 €</p>
                        </td>
                        <td style="padding-bottom: 12px; text-align: right;">
                          <p style="margin: 0; color: #71717a; font-size: 13px;">Ausstiegspreis</p>
                          <p style="margin: 4px 0 0 0; color: white; font-size: 16px; font-weight: 500;">94.298,15 €</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 12px; border-top: 1px solid #2a2a2a;">
                          <p style="margin: 0; color: #71717a; font-size: 13px;">Investiert</p>
                          <p style="margin: 4px 0 0 0; color: white; font-size: 16px; font-weight: 500;">100,00 €</p>
                        </td>
                        <td style="padding-top: 12px; border-top: 1px solid #2a2a2a; text-align: right;">
                          <p style="margin: 0; color: #71717a; font-size: 13px;">Trade-Dauer</p>
                          <p style="margin: 4px 0 0 0; color: white; font-size: 16px; font-weight: 500;">8m 32s</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: ${profitColor}10; padding: 20px 24px; border-top: 1px solid ${profitColor}30;">
                    <table cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td>
                          <p style="margin: 0; color: #a1a1aa; font-size: 13px;">Ergebnis</p>
                          <p style="margin: 4px 0 0 0; color: ${profitColor}; font-size: 24px; font-weight: 700;">${profitSign}${profitAmount.toFixed(2)} €</p>
                        </td>
                        <td style="text-align: right;">
                          <span style="display: inline-block; background-color: ${profitColor}20; color: ${profitColor}; padding: 8px 16px; border-radius: 8px; font-size: 18px; font-weight: 700;">${profitSign}${profitPercent.toFixed(2)}%</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 32px;">
                <tr>
                  <td style="text-align: center;">
                    <a href="#" style="display: inline-block; background-color: ${accentColor}; color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">Trading-Historie ansehen</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background-color: #0a0a0a; padding: 24px 40px; border-top: 1px solid #222222;">
              <p style="margin: 0 0 8px 0; color: #52525b; font-size: 12px; text-align: center;">Sie erhalten diese E-Mail, weil Sie Trade-Benachrichtigungen aktiviert haben.</p>
              <p style="margin: 0; color: #52525b; font-size: 12px; text-align: center;"><a href="#" style="color: ${accentColor}; text-decoration: none;">Benachrichtigungen verwalten</a></p>
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
                <div className="flex items-center gap-4">
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
                    <span className="text-sm text-muted-foreground">Akzentfarbe:</span>
                    <input 
                      type="color" 
                      value={previewColor} 
                      onChange={(e) => setPreviewColor(e.target.value)}
                      className="h-8 w-12 cursor-pointer rounded border"
                    />
                  </div>
                </div>
                
                {/* Email Preview */}
                <div className="rounded-lg border overflow-hidden bg-[#0a0a0a]" style={{ height: "60vh" }}>
                  <iframe 
                    srcDoc={generatePreviewHtml(previewProfit, previewColor)}
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
