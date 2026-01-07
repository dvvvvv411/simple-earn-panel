import React, { useState } from "react";
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogHeader, ResponsiveDialogTitle } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  Euro, 
  Shield, 
  Clock, 
  Zap, 
  Bitcoin, 
  ArrowRight,
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCryptoDeposits, CryptoDeposit } from "@/hooks/useCryptoDeposits";

interface DepositDialogProps {
  userBalance: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDepositCreated?: () => void;
}

const CRYPTO_OPTIONS = [
  { value: 'auto', label: 'Automatisch wählen', icon: '🔄' },
  { value: 'btc', label: 'Bitcoin (BTC)', icon: '₿' },
  { value: 'eth', label: 'Ethereum (ETH)', icon: 'Ξ' },
  { value: 'usdt', label: 'Tether (USDT)', icon: '₮' },
  { value: 'usdc', label: 'USD Coin (USDC)', icon: '$' },
  { value: 'ltc', label: 'Litecoin (LTC)', icon: 'Ł' },
  { value: 'xrp', label: 'Ripple (XRP)', icon: '✕' },
  { value: 'doge', label: 'Dogecoin (DOGE)', icon: 'Ð' },
  { value: 'trx', label: 'Tron (TRX)', icon: '◈' },
  { value: 'bnb', label: 'BNB', icon: '◆' },
  { value: 'sol', label: 'Solana (SOL)', icon: '◎' },
];

const QUICK_AMOUNTS = [50, 100, 250, 500, 1000];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Ausstehend</Badge>;
    case 'waiting':
      return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3 mr-1" />Warte auf Zahlung</Badge>;
    case 'confirming':
    case 'confirmed':
    case 'sending':
      return <Badge className="bg-blue-100 text-blue-700"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Wird bestätigt</Badge>;
    case 'finished':
      return <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Abgeschlossen</Badge>;
    case 'failed':
    case 'expired':
      return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Fehlgeschlagen</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export function DepositDialog({ userBalance, open, onOpenChange, onDepositCreated }: DepositDialogProps) {
  const [amount, setAmount] = useState<string>("");
  const [selectedCrypto, setSelectedCrypto] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { toast } = useToast();
  const { createDeposit, getPendingDeposits, checkStatus, loading: depositsLoading } = useCryptoDeposits();
  const pendingDeposits = getPendingDeposits();

  const formatBalance = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const handleCreateDeposit = async () => {
    const depositAmount = parseFloat(amount);
    
    if (!depositAmount || depositAmount <= 0) {
      toast({
        title: "Ungültiger Betrag",
        description: "Bitte geben Sie einen gültigen Betrag ein.",
        variant: "destructive",
      });
      return;
    }

    if (depositAmount < 10) {
      toast({
        title: "Mindestbetrag",
        description: "Der Mindesteinzahlungsbetrag beträgt 10€.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      const result = await createDeposit(depositAmount, selectedCrypto === 'auto' ? undefined : selectedCrypto || undefined);
      
      if (result?.invoice_url) {
        setInvoiceUrl(result.invoice_url);
        setShowSuccess(true);
        onDepositCreated?.();
        
        toast({
          title: "Einzahlung erstellt",
          description: "Sie werden zur Zahlungsseite weitergeleitet.",
        });
      }
    } catch (error) {
      console.error('Deposit creation error:', error);
      toast({
        title: "Fehler",
        description: "Die Einzahlung konnte nicht erstellt werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenPaymentPage = () => {
    if (invoiceUrl) {
      window.open(invoiceUrl, '_blank');
    }
  };

  const handleClose = () => {
    setAmount("");
    setSelectedCrypto("");
    setInvoiceUrl(null);
    setShowSuccess(false);
    onOpenChange(false);
  };

  const handleRefreshStatus = async () => {
    try {
      await checkStatus();
      toast({
        title: "Status aktualisiert",
        description: "Die Einzahlungsstatus wurden aktualisiert.",
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Status konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={handleClose}>
      <ResponsiveDialogContent className="sm:max-w-3xl sm:max-h-[90vh] sm:overflow-y-auto">
        <div className="flex flex-col h-full lg:block">
          <div className="flex-1 px-6 sm:px-0 overflow-y-auto flex items-center lg:block">
            <div className="w-full">
              <ResponsiveDialogHeader className="relative overflow-hidden p-0 sm:p-6 lg:p-6 mb-6 sm:mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 animate-pulse" />
                <div className="relative">
                  <ResponsiveDialogTitle className="flex items-center gap-3 text-xl sm:text-lg">
                    <div className="p-3 sm:p-2 rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
                      <Wallet className="w-8 h-8 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                        Krypto Einzahlung
                      </span>
                      <p className="text-base sm:text-sm font-normal text-muted-foreground mt-1">
                        Schnell und sicher mit über 100 Kryptowährungen
                      </p>
                    </div>
                  </ResponsiveDialogTitle>
                  
                  <div className="flex gap-3 sm:gap-2 mt-6 sm:mt-4">
                    <Badge variant="secondary" className="text-sm sm:text-xs">
                      <Shield className="w-4 h-4 sm:w-3 sm:h-3 mr-2 sm:mr-1" />
                      Sicher
                    </Badge>
                    <Badge variant="secondary" className="text-sm sm:text-xs">
                      <Zap className="w-4 h-4 sm:w-3 sm:h-3 mr-2 sm:mr-1" />
                      Sofort
                    </Badge>
                    <Badge variant="secondary" className="text-sm sm:text-xs">
                      <Bitcoin className="w-4 h-4 sm:w-3 sm:h-3 mr-2 sm:mr-1" />
                      100+ Coins
                    </Badge>
                  </div>
                </div>
              </ResponsiveDialogHeader>

              {showSuccess ? (
                // Success State
                <div className="space-y-6 text-center py-8">
                  <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Einzahlung erstellt!</h3>
                    <p className="text-muted-foreground">
                      Klicken Sie auf den Button unten, um zur Zahlungsseite zu gelangen.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 border">
                    <div className="text-sm text-muted-foreground mb-1">Einzahlungsbetrag</div>
                    <div className="text-2xl font-bold text-foreground">{formatBalance(parseFloat(amount))}</div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Button 
                      onClick={handleOpenPaymentPage}
                      className="w-full h-12"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Zur Zahlungsseite
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleClose}
                      className="w-full"
                    >
                      Schließen
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Nach Abschluss der Zahlung wird Ihr Guthaben automatisch gutgeschrieben.
                  </p>
                </div>
              ) : (
                // Form State
                <div className="grid lg:grid-cols-2 gap-8 sm:gap-4">
                  {/* Left Column - Form */}
                  <div className="space-y-8 sm:space-y-6">
                    <div className="space-y-4 sm:space-y-3">
                      <Label htmlFor="amount" className="text-lg sm:text-base font-medium">
                        Einzahlungsbetrag (EUR)
                      </Label>
                      
                      {/* Balance Display */}
                      <div className="p-6 sm:p-4 rounded-lg bg-gradient-to-r from-muted/50 to-muted/30 border">
                        <div className="flex items-center justify-between">
                          <span className="text-base sm:text-sm text-muted-foreground">Aktuelles Guthaben</span>
                          <span className="font-semibold text-lg sm:text-base">
                            {formatBalance(userBalance)}
                          </span>
                        </div>
                      </div>

                      {/* Amount Input */}
                      <div className="relative">
                        <Euro className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 sm:w-5 sm:h-5 text-muted-foreground" />
                        <Input
                          id="amount"
                          type="number"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="pl-14 sm:pl-12 h-14 sm:h-12 text-lg sm:text-base"
                          min="10"
                          step="0.01"
                        />
                      </div>

                      {/* Quick Amount Buttons */}
                      <div className="grid grid-cols-5 gap-2">
                        {QUICK_AMOUNTS.map((quickAmount) => (
                          <Button
                            key={quickAmount}
                            variant="outline"
                            size="sm"
                            onClick={() => setAmount(quickAmount.toString())}
                            className="text-sm sm:text-xs h-10 sm:h-auto"
                          >
                            {quickAmount}€
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Crypto Selection */}
                    <div className="space-y-4 sm:space-y-3">
                      <Label className="text-lg sm:text-base font-medium">
                        Kryptowährung (optional)
                      </Label>
                      <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                        <SelectTrigger className="h-14 sm:h-12 text-lg sm:text-base">
                          <SelectValue placeholder="Automatisch wählen" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {CRYPTO_OPTIONS.map((crypto) => (
                            <SelectItem key={crypto.value} value={crypto.value}>
                              <div className="flex items-center gap-3">
                                <span className="text-lg">{crypto.icon}</span>
                                <span>{crypto.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Sie können auch auf der Zahlungsseite eine Kryptowährung auswählen.
                      </p>
                    </div>

                    {/* Amount Summary */}
                    {amount && parseFloat(amount) > 0 && (
                      <div className="p-4 sm:p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <div className="flex items-center gap-2 text-base sm:text-sm">
                          <Zap className="w-5 h-5 sm:w-4 sm:h-4 text-primary" />
                          <span className="font-medium">Einzahlung:</span>
                          <span className="font-semibold text-primary">
                            {formatBalance(parseFloat(amount))}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column - Info & Pending */}
                  <div className="space-y-6 sm:space-y-4">
                    {/* How it works */}
                    <Card className="relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
                      <CardContent className="relative p-6 sm:p-4">
                        <h3 className="font-semibold text-lg sm:text-base mb-4">So funktioniert's</h3>
                        <div className="space-y-4">
                          {[
                            { step: 1, text: "Betrag eingeben und zur Zahlung weiterleiten" },
                            { step: 2, text: "Kryptowährung auswählen und Betrag senden" },
                            { step: 3, text: "Nach Bestätigung wird Guthaben gutgeschrieben" },
                          ].map((item) => (
                            <div key={item.step} className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-semibold text-primary">{item.step}</span>
                              </div>
                              <span className="text-sm text-muted-foreground">{item.text}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Pending Deposits */}
                    {pendingDeposits.length > 0 && (
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-base">Offene Einzahlungen</h3>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={handleRefreshStatus}
                              disabled={depositsLoading}
                            >
                              <RefreshCw className={`w-4 h-4 ${depositsLoading ? 'animate-spin' : ''}`} />
                            </Button>
                          </div>
                          <div className="space-y-3">
                            {pendingDeposits.slice(0, 3).map((deposit: CryptoDeposit) => (
                              <div key={deposit.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <div>
                                  <div className="font-medium">{formatBalance(deposit.price_amount)}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(deposit.created_at).toLocaleDateString('de-DE')}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {getStatusBadge(deposit.status)}
                                  {deposit.invoice_url && deposit.status !== 'finished' && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => window.open(deposit.invoice_url!, '_blank')}
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Security Note */}
                    <div className="p-4 rounded-lg bg-muted/30 border">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-sm mb-1">Sichere Zahlungen</h4>
                          <p className="text-xs text-muted-foreground">
                            Powered by NowPayments. Ihre Zahlungen werden sicher und verschlüsselt verarbeitet.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer - only show when not in success state */}
              {!showSuccess && (
                <div className="mt-8 pt-6 border-t">
                  <Button
                    onClick={handleCreateDeposit}
                    disabled={!amount || parseFloat(amount) < 10 || isCreating}
                    className="w-full h-14 sm:h-12 text-lg sm:text-base"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Wird erstellt...
                      </>
                    ) : (
                      <>
                        Zur Zahlung
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-3">
                    Mindesteinzahlung: 10€ • Keine versteckten Gebühren
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
