import React, { useState, useEffect } from "react";
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogHeader, ResponsiveDialogTitle } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { 
  Wallet, 
  Euro, 
  Shield, 
  Clock, 
  Zap, 
  Bitcoin, 
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Copy,
  ArrowLeft,
  ChevronsUpDown,
  Check,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCryptoDeposits, CryptoDeposit, CreateDepositResult } from "@/hooks/useCryptoDeposits";
import { useNowPaymentsCurrencies, CryptoCurrency } from "@/hooks/useNowPaymentsCurrencies";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";

interface DepositDialogProps {
  userBalance: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDepositCreated?: () => void;
}

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
      return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Fehlgeschlagen</Badge>;
    case 'expired':
      return <Badge variant="destructive"><Clock className="w-3 h-3 mr-1" />Abgelaufen</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export function DepositDialog({ userBalance, open, onOpenChange, onDepositCreated }: DepositDialogProps) {
  const [amount, setAmount] = useState<string>("");
  const [selectedCrypto, setSelectedCrypto] = useState<string>("btc");
  const [cryptoDropdownOpen, setCryptoDropdownOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [paymentData, setPaymentData] = useState<CreateDepositResult | null>(null);
  const [countdown, setCountdown] = useState<string>("");
  const [currentPaymentStatus, setCurrentPaymentStatus] = useState<string>("waiting");
  const [isPolling, setIsPolling] = useState(false);
  
  const { toast } = useToast();
  const { createDeposit, deposits, checkStatus, getPendingDeposits, loading: depositsLoading } = useCryptoDeposits();
  const { currencies, popularCurrencies, usdtCurrencies, usdcCurrencies, otherStablecoins, otherCurrencies, loading: currenciesLoading } = useNowPaymentsCurrencies();

  const formatBalance = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  // Countdown timer
  useEffect(() => {
    if (!paymentData?.expiration_estimate_date) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const expiry = new Date(paymentData.expiration_estimate_date).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setCountdown("Abgelaufen");
        // Set status to expired when countdown reaches 0
        if (['waiting', 'pending'].includes(currentPaymentStatus)) {
          setCurrentPaymentStatus('expired');
        }
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [paymentData?.expiration_estimate_date]);

  // Automatic status polling
  useEffect(() => {
    if (!paymentData || !open) return;
    
    // Don't poll if already in a final state
    if (['finished', 'failed', 'expired'].includes(currentPaymentStatus)) return;

    const pollStatus = async () => {
      setIsPolling(true);
      try {
        await checkStatus();
      } finally {
        setIsPolling(false);
      }
    };

    // Initial check
    pollStatus();
    
    // Poll every 10 seconds
    const interval = setInterval(pollStatus, 10000);
    
    return () => clearInterval(interval);
  }, [paymentData, open, currentPaymentStatus]);

  // Update currentPaymentStatus when deposits change
  useEffect(() => {
    if (!paymentData) return;
    
    const deposit = deposits.find(
      (d) => d.nowpayments_payment_id === paymentData.payment_id.toString()
    );
    
    if (deposit && deposit.status !== currentPaymentStatus) {
      setCurrentPaymentStatus(deposit.status);
      
      if (deposit.status === 'finished') {
        toast({
          title: "Zahlung erfolgreich!",
          description: "Ihr Guthaben wurde gutgeschrieben.",
        });
        onDepositCreated?.();
      } else if (deposit.status === 'confirming' || deposit.status === 'confirmed') {
        toast({
          title: "Zahlung empfangen!",
          description: "Warte auf Blockchain-Bestätigungen...",
        });
      }
    }
  }, [deposits, paymentData, currentPaymentStatus, toast, onDepositCreated]);

  const getPaymentStatusDisplay = () => {
    switch (currentPaymentStatus) {
      case 'waiting':
        return {
          icon: <Clock className="w-5 h-5 text-yellow-600" />,
          text: "Warte auf Zahlung...",
          description: "Senden Sie den Betrag an die angezeigte Adresse",
          bgClass: "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800",
          textClass: "text-yellow-700 dark:text-yellow-400"
        };
      case 'confirming':
        return {
          icon: <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />,
          text: "Zahlung empfangen!",
          description: "Warte auf Blockchain-Bestätigungen...",
          bgClass: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
          textClass: "text-blue-700 dark:text-blue-400"
        };
      case 'confirmed':
        return {
          icon: <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />,
          text: "Bestätigt!",
          description: "Transaktion wird verarbeitet...",
          bgClass: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
          textClass: "text-blue-700 dark:text-blue-400"
        };
      case 'sending':
        return {
          icon: <Zap className="w-5 h-5 text-blue-600 animate-pulse" />,
          text: "Wird verarbeitet...",
          description: "Guthaben wird gutgeschrieben",
          bgClass: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
          textClass: "text-blue-700 dark:text-blue-400"
        };
      case 'finished':
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-600" />,
          text: "Erfolgreich!",
          description: "Guthaben wurde gutgeschrieben",
          bgClass: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
          textClass: "text-green-700 dark:text-green-400"
        };
      case 'partially_paid':
        return {
          icon: <AlertCircle className="w-5 h-5 text-orange-600" />,
          text: "Teilzahlung empfangen",
          description: "Der gesendete Betrag war geringer als erwartet",
          bgClass: "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800",
          textClass: "text-orange-700 dark:text-orange-400"
        };
      case 'failed':
        return {
          icon: <AlertCircle className="w-5 h-5 text-red-600" />,
          text: "Fehlgeschlagen",
          description: "Die Zahlung konnte nicht verarbeitet werden",
          bgClass: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
          textClass: "text-red-700 dark:text-red-400"
        };
      case 'expired':
        return {
          icon: <AlertCircle className="w-5 h-5 text-red-600" />,
          text: "Abgelaufen",
          description: "Die Zahlungsfrist ist abgelaufen",
          bgClass: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
          textClass: "text-red-700 dark:text-red-400"
        };
      default:
        return {
          icon: <Clock className="w-5 h-5 text-muted-foreground" />,
          text: currentPaymentStatus,
          description: "",
          bgClass: "bg-muted/30 border-muted",
          textClass: "text-muted-foreground"
        };
    }
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
      const result = await createDeposit(depositAmount, selectedCrypto);
      
      if (result?.pay_address) {
        setPaymentData(result);
        onDepositCreated?.();
        
        toast({
          title: "Einzahlung erstellt",
          description: "Senden Sie den Betrag an die angezeigte Adresse.",
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

  const handleCopyAddress = () => {
    if (paymentData?.pay_address) {
      navigator.clipboard.writeText(paymentData.pay_address);
      toast({
        title: "Kopiert",
        description: "Wallet-Adresse wurde in die Zwischenablage kopiert.",
      });
    }
  };

  const handleCopyAmount = () => {
    if (paymentData?.pay_amount) {
      navigator.clipboard.writeText(paymentData.pay_amount.toString());
      toast({
        title: "Kopiert",
        description: "Kryptobetrag wurde in die Zwischenablage kopiert.",
      });
    }
  };

  const handleClose = () => {
    setAmount("");
    setSelectedCrypto("btc");
    setPaymentData(null);
    setCurrentPaymentStatus("waiting");
    onOpenChange(false);
  };

  const handleBackToForm = () => {
    setPaymentData(null);
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

  const handleOpenDeposit = (deposit: CryptoDeposit) => {
    setPaymentData({
      success: true,
      deposit_id: deposit.id,
      payment_id: deposit.nowpayments_payment_id || deposit.nowpayments_invoice_id || '',
      pay_address: deposit.pay_address || '',
      pay_amount: deposit.pay_amount || 0,
      pay_currency: deposit.pay_currency || '',
      expiration_estimate_date: deposit.expiration_estimate_date || '',
      payment_status: deposit.status,
    });
    setCurrentPaymentStatus(deposit.status);
    if (deposit.pay_currency) {
      setSelectedCrypto(deposit.pay_currency);
    }
    setAmount(deposit.price_amount.toString());
  };

const selectedCryptoData = currencies.find(c => c.code === selectedCrypto);
  const qrValue = paymentData ? `${selectedCryptoData?.uriPrefix || 'bitcoin'}:${paymentData.pay_address}?amount=${paymentData.pay_amount}` : '';

  return (
    <ResponsiveDialog open={open} onOpenChange={handleClose}>
      <ResponsiveDialogContent className="sm:max-w-2xl sm:max-h-[90vh] sm:overflow-y-auto">
        <div className="flex flex-col h-full lg:block">
          <div className="flex-1 px-6 sm:px-0 overflow-y-auto flex items-center lg:block">
            <div className="w-full">
              <ResponsiveDialogHeader className="relative p-0 sm:p-6 lg:p-6 mb-6 sm:mb-4">
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
                        Schnell und sicher mit Kryptowährungen
                      </p>
                    </div>
                  </ResponsiveDialogTitle>
                  
                  {!paymentData && (
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
                        30+ Coins
                      </Badge>
                    </div>
                  )}
                </div>
              </ResponsiveDialogHeader>

              {paymentData ? (
                // Payment Screen - Internal display
                <div className="space-y-6">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleBackToForm}
                    className="mb-2"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Zurück
                  </Button>

                  {/* QR Code */}
                  <div className="flex justify-center">
                    <div className="p-4 bg-white rounded-xl shadow-lg">
                      <QRCodeSVG 
                        value={qrValue}
                        size={180}
                        level="H"
                        includeMargin
                      />
                    </div>
                  </div>

                  {/* Amount Info */}
                  <div className="text-center space-y-2">
                    <div className="text-sm text-muted-foreground">Zu senden</div>
                    <div 
                      className="text-3xl font-bold text-foreground flex items-center justify-center gap-2 cursor-copy hover:text-primary transition-colors"
                      onClick={handleCopyAmount}
                      title="Klicken zum Kopieren"
                    >
                      {paymentData.pay_amount} {paymentData.pay_currency.toUpperCase()}
                      {selectedCryptoData && (
                        <img 
                          src={selectedCryptoData.icon} 
                          alt={selectedCryptoData.name} 
                          className="w-8 h-8 rounded-full"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ≈ {formatBalance(parseFloat(amount))}
                    </div>
                  </div>

                  {/* Wallet Address */}
                  <Card>
                    <CardContent className="p-4">
                      <Label className="text-sm text-muted-foreground mb-2 block">
                        Wallet-Adresse ({paymentData.pay_currency.toUpperCase()})
                      </Label>
                      <div className="flex items-center gap-2">
                        <div 
                          className="flex-1 p-3 bg-muted/50 rounded-lg font-mono text-sm break-all cursor-copy hover:bg-muted/70 transition-colors"
                          onClick={handleCopyAddress}
                          title="Klicken zum Kopieren"
                        >
                          {paymentData.pay_address}
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleCopyAddress}
                          className="flex-shrink-0"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Timer */}
                  <div className="p-4 rounded-lg bg-muted/30 border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">Gültig bis</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-lg font-mono">{countdown}</div>
                        {paymentData.expiration_estimate_date && (
                          <div className="text-xs text-muted-foreground">
                            {new Date(paymentData.expiration_estimate_date).toLocaleString('de-DE')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  {(() => {
                    const statusDisplay = getPaymentStatusDisplay();
                    return (
                      <div className={`flex items-center justify-between p-4 rounded-lg border ${statusDisplay.bgClass}`}>
                        <div className="flex items-center gap-3">
                          {statusDisplay.icon}
                          <div>
                            <span className={`font-medium ${statusDisplay.textClass}`}>
                              {statusDisplay.text}
                            </span>
                            {statusDisplay.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {statusDisplay.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRefreshStatus}
                          disabled={depositsLoading || isPolling || currentPaymentStatus === 'finished'}
                        >
                          <RefreshCw className={`w-4 h-4 ${depositsLoading || isPolling ? 'animate-spin' : ''}`} />
                        </Button>
                      </div>
                    );
                  })()}

                  {/* Instructions */}
                  <div className="p-4 rounded-lg bg-muted/30 border">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Scannen Sie den QR-Code oder kopieren Sie die Adresse in Ihre Wallet.</p>
                        <p>Senden Sie <strong>genau {paymentData.pay_amount} {paymentData.pay_currency.toUpperCase()}</strong> an diese Adresse.</p>
                        <p>Nach Bestätigung der Transaktion wird Ihr Guthaben automatisch gutgeschrieben.</p>
                      </div>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    onClick={handleClose}
                    className="w-full"
                  >
                    Schließen
                  </Button>
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
                      <div className="relative py-0.5">
                        <Euro className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 sm:w-5 sm:h-5 text-muted-foreground" />
                        <Input
                          id="amount"
                          type="number"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="pl-14 sm:pl-12 h-14 sm:h-12 text-lg sm:text-base"
                          min="10"
                          step="1"
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
                            {quickAmount.toLocaleString('de-DE')} €
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Crypto Selection - Searchable Combobox */}
                    <div className="space-y-4 sm:space-y-3">
                      <Label className="text-lg sm:text-base font-medium">
                        Kryptowährung
                      </Label>
                      <Popover open={cryptoDropdownOpen} onOpenChange={setCryptoDropdownOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={cryptoDropdownOpen}
                            className="w-full h-14 sm:h-12 justify-between text-lg sm:text-base font-normal"
                            disabled={currenciesLoading}
                          >
                            {currenciesLoading ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Lade Währungen...</span>
                              </div>
                            ) : selectedCryptoData ? (
                              <div className="flex items-center gap-3">
                                <img 
                                  src={selectedCryptoData.icon} 
                                  alt={selectedCryptoData.name} 
                                  className="w-6 h-6 rounded-full"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                                <span>{selectedCryptoData.name}</span>
                                {selectedCryptoData.networkLabel && (
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {selectedCryptoData.networkIcon && (
                                      <img 
                                        src={selectedCryptoData.networkIcon} 
                                        alt={selectedCryptoData.networkLabel}
                                        className="w-4 h-4"
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                      />
                                    )}
                                    <Badge variant="outline" className="text-xs">
                                      {selectedCryptoData.networkLabel}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            ) : (
                              "Währung wählen..."
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Kryptowährung suchen..." />
                            <CommandList 
                              className="max-h-[300px]"
                              onWheelCapture={(e) => e.stopPropagation()}
                              onTouchMove={(e) => e.stopPropagation()}
                            >
                              <CommandEmpty>Keine Währung gefunden.</CommandEmpty>
                              
                              {popularCurrencies.length > 0 && (
                                <CommandGroup heading="Beliebt">
                                  {popularCurrencies.map((crypto) => (
                                    <CommandItem
                                      key={crypto.code}
                                      value={`${crypto.name} ${crypto.code} ${crypto.networkLabel || ''}`}
                                      onSelect={() => {
                                        setSelectedCrypto(crypto.code);
                                        setCryptoDropdownOpen(false);
                                      }}
                                      className="cursor-pointer"
                                    >
                                      <div className="flex items-center gap-3 flex-1">
                                        <img 
                                          src={crypto.icon} 
                                          alt={crypto.name} 
                                          className="w-5 h-5 rounded-full"
                                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                        />
                                        <span className="truncate">{crypto.name}</span>
                                        <span className="text-muted-foreground text-sm">
                                          {crypto.symbol.toUpperCase()}
                                        </span>
                                      </div>
                                      <Check
                                        className={cn(
                                          "ml-2 h-4 w-4 shrink-0 text-primary/70",
                                          selectedCrypto === crypto.code ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              )}
                              
                              {usdtCurrencies.length > 0 && (
                                <CommandGroup heading="USDT - Tether">
                                  {usdtCurrencies.map((crypto) => (
                                    <CommandItem
                                      key={crypto.code}
                                      value={`${crypto.name} ${crypto.code} ${crypto.networkLabel || ''}`}
                                      onSelect={() => {
                                        setSelectedCrypto(crypto.code);
                                        setCryptoDropdownOpen(false);
                                      }}
                                      className="cursor-pointer"
                                    >
                                      <div className="flex items-center gap-3 flex-1">
                                        <img 
                                          src={crypto.icon} 
                                          alt={crypto.name} 
                                          className="w-5 h-5 rounded-full"
                                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                        />
                                        <span className="truncate">{crypto.name}</span>
                                        {crypto.networkLabel && (
                                          <div className="flex items-center gap-1.5 shrink-0">
                                            {crypto.networkIcon && (
                                              <img 
                                                src={crypto.networkIcon} 
                                                alt={crypto.networkLabel}
                                                className="w-4 h-4"
                                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                              />
                                            )}
                                            <Badge variant="outline" className="text-xs">
                                              {crypto.networkLabel}
                                            </Badge>
                                          </div>
                                        )}
                                      </div>
                                      <Check
                                        className={cn(
                                          "ml-2 h-4 w-4 shrink-0 text-primary/70",
                                          selectedCrypto === crypto.code ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              )}
                              
                              {usdcCurrencies.length > 0 && (
                                <CommandGroup heading="USDC - USD Coin">
                                  {usdcCurrencies.map((crypto) => (
                                    <CommandItem
                                      key={crypto.code}
                                      value={`${crypto.name} ${crypto.code} ${crypto.networkLabel || ''}`}
                                      onSelect={() => {
                                        setSelectedCrypto(crypto.code);
                                        setCryptoDropdownOpen(false);
                                      }}
                                      className="cursor-pointer"
                                    >
                                      <div className="flex items-center gap-3 flex-1">
                                        <img 
                                          src={crypto.icon} 
                                          alt={crypto.name} 
                                          className="w-5 h-5 rounded-full"
                                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                        />
                                        <span className="truncate">{crypto.name}</span>
                                        {crypto.networkLabel && (
                                          <div className="flex items-center gap-1.5 shrink-0">
                                            {crypto.networkIcon && (
                                              <img 
                                                src={crypto.networkIcon} 
                                                alt={crypto.networkLabel}
                                                className="w-4 h-4"
                                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                              />
                                            )}
                                            <Badge variant="outline" className="text-xs">
                                              {crypto.networkLabel}
                                            </Badge>
                                          </div>
                                        )}
                                      </div>
                                      <Check
                                        className={cn(
                                          "ml-2 h-4 w-4 shrink-0 text-primary/70",
                                          selectedCrypto === crypto.code ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              )}
                              
                              {otherStablecoins.length > 0 && (
                                <CommandGroup heading="Weitere Stablecoins">
                                  {otherStablecoins.map((crypto) => (
                                    <CommandItem
                                      key={crypto.code}
                                      value={`${crypto.name} ${crypto.code} ${crypto.networkLabel || ''}`}
                                      onSelect={() => {
                                        setSelectedCrypto(crypto.code);
                                        setCryptoDropdownOpen(false);
                                      }}
                                      className="cursor-pointer"
                                    >
                                      <div className="flex items-center gap-3 flex-1">
                                        <img 
                                          src={crypto.icon} 
                                          alt={crypto.name} 
                                          className="w-5 h-5 rounded-full"
                                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                        />
                                        <span className="truncate">{crypto.name}</span>
                                        {crypto.networkLabel && (
                                          <div className="flex items-center gap-1.5 shrink-0">
                                            {crypto.networkIcon && (
                                              <img 
                                                src={crypto.networkIcon} 
                                                alt={crypto.networkLabel}
                                                className="w-4 h-4"
                                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                              />
                                            )}
                                            <Badge variant="outline" className="text-xs">
                                              {crypto.networkLabel}
                                            </Badge>
                                          </div>
                                        )}
                                      </div>
                                      <Check
                                        className={cn(
                                          "ml-2 h-4 w-4 shrink-0 text-primary/70",
                                          selectedCrypto === crypto.code ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              )}
                              
                              {otherCurrencies.length > 0 && (
                                <CommandGroup heading="Weitere Kryptowährungen">
                                  {otherCurrencies.map((crypto) => (
                                    <CommandItem
                                      key={crypto.code}
                                      value={`${crypto.name} ${crypto.code} ${crypto.networkLabel || ''}`}
                                      onSelect={() => {
                                        setSelectedCrypto(crypto.code);
                                        setCryptoDropdownOpen(false);
                                      }}
                                      className="cursor-pointer"
                                    >
                                      <div className="flex items-center gap-3 flex-1">
                                        <img 
                                          src={crypto.icon} 
                                          alt={crypto.name} 
                                          className="w-5 h-5 rounded-full"
                                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                        />
                                        <span className="truncate">{crypto.name}</span>
                                        <span className="text-muted-foreground text-sm">
                                          {crypto.symbol.toUpperCase()}
                                        </span>
                                      </div>
                                      <Check
                                        className={cn(
                                          "ml-2 h-4 w-4 shrink-0 text-primary/70",
                                          selectedCrypto === crypto.code ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
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

                  {/* Right Column - Info */}
                  <div className="space-y-6 sm:space-y-4">
                    {/* How it works */}
                    <Card className="relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
                      <CardContent className="relative p-6 sm:p-4">
                        <h3 className="font-semibold text-lg sm:text-base mb-4">So funktioniert's</h3>
                        <div className="space-y-4">
                          {[
                            { step: 1, text: "Betrag und Kryptowährung wählen" },
                            { step: 2, text: "QR-Code scannen oder Adresse kopieren" },
                            { step: 3, text: "Betrag an Wallet senden" },
                            { step: 4, text: "Guthaben wird automatisch gutgeschrieben" },
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

                    {/* Security Note */}
                    <div className="p-4 rounded-lg bg-muted/30 border">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-sm mb-1">Sichere Zahlungen</h4>
                          <p className="text-xs text-muted-foreground">
                            Ihre Zahlungen werden sicher und verschlüsselt verarbeitet.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pending Deposits - Full Width (only show when not in payment state) */}
              {!paymentData && getPendingDeposits().length > 0 && (
                <Card className="mt-4">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm">Offene Einzahlungen</h3>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={handleRefreshStatus}
                        disabled={depositsLoading}
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${depositsLoading ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                    {/* Header Row - Desktop */}
                    <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_auto] gap-4 px-3 py-2 text-xs text-muted-foreground font-medium border-b">
                      <span>Währung</span>
                      <span>Betrag</span>
                      <span>Status</span>
                      <span className="w-8"></span>
                    </div>

                    {/* Data Rows */}
                    <div className="divide-y divide-border/50">
                      {getPendingDeposits().slice(0, 5).map((deposit: CryptoDeposit) => (
                        <div 
                          key={deposit.id} 
                          className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 sm:gap-4 px-3 py-2.5 items-center hover:bg-muted/50 cursor-pointer transition-colors group"
                          onClick={() => handleOpenDeposit(deposit)}
                          title="Klicken um Zahlungsdetails anzuzeigen"
                        >
                          {/* Währung mit Icon */}
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                              <ExternalLink className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <span className="font-medium text-sm">{deposit.pay_currency?.toUpperCase() || 'Krypto'}</span>
                          </div>
                          
                          {/* Betrag */}
                          <div className="font-medium text-sm text-right sm:text-left">{formatBalance(deposit.price_amount)}</div>
                          
                          {/* Status */}
                          <div className="col-span-2 sm:col-span-1 flex justify-start">
                            {getStatusBadge(deposit.status)}
                          </div>
                          
                          {/* Aktion */}
                          <div className="hidden sm:flex justify-end">
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Footer - only show when not in payment state */}
              {!paymentData && (
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
                        Einzahlung starten
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
