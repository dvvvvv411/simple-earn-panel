import React, { useState, useEffect } from "react";
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogHeader, ResponsiveDialogTitle } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  Euro, 
  Shield, 
  Clock, 
  Bitcoin,
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  User,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWithdrawalRequests } from "@/hooks/useWithdrawalRequests";
import { cn } from "@/lib/utils";

interface WithdrawalDialogProps {
  userBalance: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWithdrawalCreated?: () => void;
}

const QUICK_AMOUNTS = [50, 100, 250, 500, 1000];
const MIN_WITHDRAWAL = 50;

// Simple BTC address validation
const isValidBtcAddress = (address: string): boolean => {
  if (!address) return false;
  // Legacy addresses start with 1 or 3, SegWit with bc1
  const legacyRegex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  const segwitRegex = /^bc1[a-zA-HJ-NP-Z0-9]{25,90}$/;
  return legacyRegex.test(address) || segwitRegex.test(address);
};

export function WithdrawalDialog({ userBalance, open, onOpenChange, onWithdrawalCreated }: WithdrawalDialogProps) {
  const [amount, setAmount] = useState<string>("");
  const [btcAddress, setBtcAddress] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { toast } = useToast();
  const { createRequest, requests, fetchUserRequests } = useWithdrawalRequests();

  useEffect(() => {
    if (open) {
      fetchUserRequests();
    }
  }, [open]);

  const formatBalance = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const handleSubmit = async () => {
    const withdrawAmount = parseFloat(amount);
    
    if (!withdrawAmount || withdrawAmount <= 0) {
      toast({
        title: "Ungültiger Betrag",
        description: "Bitte geben Sie einen gültigen Betrag ein.",
        variant: "destructive",
      });
      return;
    }

    if (withdrawAmount < MIN_WITHDRAWAL) {
      toast({
        title: "Mindestbetrag",
        description: `Der Mindestauszahlungsbetrag beträgt ${formatBalance(MIN_WITHDRAWAL)}.`,
        variant: "destructive",
      });
      return;
    }

    if (withdrawAmount > userBalance) {
      toast({
        title: "Unzureichendes Guthaben",
        description: "Der Betrag übersteigt Ihr verfügbares Guthaben.",
        variant: "destructive",
      });
      return;
    }

    if (!isValidBtcAddress(btcAddress)) {
      toast({
        title: "Ungültige BTC-Adresse",
        description: "Bitte geben Sie eine gültige Bitcoin-Wallet-Adresse ein.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await createRequest(withdrawAmount, btcAddress);
      
      if (success) {
        setIsSuccess(true);
        onWithdrawalCreated?.();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setAmount("");
    setBtcAddress("");
    setIsSuccess(false);
    onOpenChange(false);
  };

  const handleQuickAmount = (quickAmount: number) => {
    if (quickAmount <= userBalance) {
      setAmount(quickAmount.toString());
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Ausstehend</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Genehmigt</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Abgelehnt</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={handleClose}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        <div className="flex flex-col h-full lg:block">
          <div className="flex-1 px-6 sm:px-0 overflow-y-auto flex items-center lg:block">
            <div className="w-full">
              <ResponsiveDialogHeader className="relative overflow-hidden p-0 sm:p-6 lg:p-6 mb-6 sm:mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-orange-500/10 to-orange-500/5 animate-pulse" />
                <div className="relative">
                  <ResponsiveDialogTitle className="flex items-center gap-3 text-xl sm:text-lg">
                    <div className="p-3 sm:p-2 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
                      <Wallet className="w-8 h-8 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                        Auszahlung beantragen
                      </span>
                      <p className="text-base sm:text-sm font-normal text-muted-foreground mt-1">
                        Auszahlung auf Ihre Bitcoin-Wallet
                      </p>
                    </div>
                  </ResponsiveDialogTitle>
                  
                  <div className="flex gap-3 sm:gap-2 mt-6 sm:mt-4">
                    <Badge variant="secondary" className="text-sm sm:text-xs">
                      <Shield className="w-4 h-4 sm:w-3 sm:h-3 mr-2 sm:mr-1" />
                      Sicher
                    </Badge>
                    <Badge variant="secondary" className="text-sm sm:text-xs">
                      <Bitcoin className="w-4 h-4 sm:w-3 sm:h-3 mr-2 sm:mr-1" />
                      BTC Only
                    </Badge>
                    <Badge variant="secondary" className="text-sm sm:text-xs">
                      <User className="w-4 h-4 sm:w-3 sm:h-3 mr-2 sm:mr-1" />
                      Manuell geprüft
                    </Badge>
                  </div>
                </div>
              </ResponsiveDialogHeader>

              {isSuccess ? (
                // Success Screen
                <div className="space-y-6 text-center py-8">
                  <div className="flex justify-center">
                    <div className="p-4 rounded-full bg-green-100 dark:bg-green-950/30">
                      <CheckCircle className="w-16 h-16 text-green-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Auszahlungsanfrage eingereicht!
                    </h3>
                    <p className="text-muted-foreground">
                      Ihre Anfrage über {formatBalance(parseFloat(amount))} wird geprüft.
                    </p>
                  </div>
                  <Card className="bg-muted/30">
                    <CardContent className="p-4 text-left">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                        <div className="text-sm text-muted-foreground">
                          <p>Nach Genehmigung wird der Betrag von Ihrem Guthaben abgezogen und an Ihre BTC-Wallet gesendet.</p>
                          <p className="mt-2">Sie werden über den Status Ihrer Anfrage benachrichtigt.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Button onClick={handleClose} className="w-full">
                    Schließen
                  </Button>
                </div>
              ) : (
                // Form Screen
                <div className="space-y-6">
                  {/* Balance Display */}
                  <Card className="bg-gradient-to-br from-muted/30 to-muted/50 border-muted">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Euro className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Verfügbares Guthaben</p>
                            <p className="text-2xl font-bold text-foreground">{formatBalance(userBalance)}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Amount Input */}
                  <div className="space-y-3">
                    <Label htmlFor="amount" className="text-base font-medium">Auszahlungsbetrag</Label>
                    <div className="relative">
                      <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="amount"
                        type="number"
                        min={MIN_WITHDRAWAL}
                        max={userBalance}
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder={`Min. ${formatBalance(MIN_WITHDRAWAL)}`}
                        className="pl-10 h-12 text-lg"
                      />
                    </div>
                    
                    {/* Quick Amounts */}
                    <div className="flex flex-wrap gap-2">
                      {QUICK_AMOUNTS.map((quickAmount) => (
                        <Button
                          key={quickAmount}
                          variant={amount === quickAmount.toString() ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleQuickAmount(quickAmount)}
                          disabled={quickAmount > userBalance}
                          className={cn(
                            "flex-1 min-w-[60px]",
                            quickAmount > userBalance && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {formatBalance(quickAmount)}
                        </Button>
                      ))}
                      <Button
                        variant={amount === userBalance.toString() ? "default" : "outline"}
                        size="sm"
                        onClick={() => setAmount(userBalance.toString())}
                        className="flex-1 min-w-[60px]"
                      >
                        Max
                      </Button>
                    </div>
                  </div>

                  {/* BTC Address Input */}
                  <div className="space-y-3">
                    <Label htmlFor="btcAddress" className="text-base font-medium">Bitcoin Wallet-Adresse</Label>
                    <div className="relative">
                      <Bitcoin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500" />
                      <Input
                        id="btcAddress"
                        type="text"
                        value={btcAddress}
                        onChange={(e) => setBtcAddress(e.target.value.trim())}
                        placeholder="bc1q... oder 1... oder 3..."
                        className="pl-10 h-12 font-mono text-sm"
                      />
                    </div>
                    {btcAddress && !isValidBtcAddress(btcAddress) && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        Ungültige Bitcoin-Adresse
                      </p>
                    )}
                    {btcAddress && isValidBtcAddress(btcAddress) && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Gültige Bitcoin-Adresse
                      </p>
                    )}
                  </div>

                  {/* Info Note */}
                  <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
                        <div className="text-sm text-orange-700 dark:text-orange-400">
                          <p className="font-medium">Wichtige Hinweise:</p>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>Mindestbetrag: {formatBalance(MIN_WITHDRAWAL)}</li>
                            <li>Bearbeitungszeit: 1-3 Werktage</li>
                            <li>Netzwerkgebühren werden abgezogen</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !amount || !btcAddress || !isValidBtcAddress(btcAddress) || parseFloat(amount) > userBalance}
                    className="w-full h-12 text-base bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Wird eingereicht...
                      </>
                    ) : (
                      <>
                        Auszahlung beantragen
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>

                  {/* Pending Requests */}
                  {pendingRequests.length > 0 && (
                    <div className="space-y-3 pt-4 border-t">
                      <h4 className="text-sm font-medium text-muted-foreground">Ausstehende Anfragen</h4>
                      {pendingRequests.slice(0, 3).map((request) => (
                        <Card key={request.id} className="bg-muted/30">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{formatBalance(request.amount)}</p>
                                <p className="text-xs text-muted-foreground font-mono">
                                  {request.btc_wallet_address.slice(0, 12)}...
                                </p>
                              </div>
                              {getStatusBadge(request.status)}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
