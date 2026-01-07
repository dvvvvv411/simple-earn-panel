import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Download, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search,
  Copy,
  Loader2,
  ExternalLink,
  Euro,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface Deposit {
  id: string;
  user_id: string;
  price_amount: number;
  price_currency: string;
  pay_currency: string | null;
  pay_amount: number | null;
  pay_address: string | null;
  actually_paid: number | null;
  status: string;
  nowpayments_invoice_id: string | null;
  nowpayments_payment_id: string | null;
  invoice_url: string | null;
  expiration_estimate_date: string | null;
  created_at: string;
  completed_at: string | null;
  profiles: {
    email: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

export default function Deposits() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const { toast } = useToast();

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('crypto_deposits')
        .select(`
          *,
          profiles:user_id (
            email,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeposits(data || []);
    } catch (error) {
      console.error('Error fetching deposits:', error);
      toast({
        title: "Fehler",
        description: "Einzahlungen konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    if (currency.toUpperCase() === 'EUR') {
      return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
      }).format(amount);
    }
    return `${amount.toFixed(8)} ${currency.toUpperCase()}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400"><Clock className="w-3 h-3 mr-1" />Warte auf Zahlung</Badge>;
      case 'confirming':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"><RefreshCw className="w-3 h-3 mr-1" />Wird bestätigt</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"><RefreshCw className="w-3 h-3 mr-1" />Bestätigt</Badge>;
      case 'sending':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"><RefreshCw className="w-3 h-3 mr-1" />Wird verarbeitet</Badge>;
      case 'finished':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"><CheckCircle className="w-3 h-3 mr-1" />Abgeschlossen</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"><XCircle className="w-3 h-3 mr-1" />Fehlgeschlagen</Badge>;
      case 'expired':
        return <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"><Clock className="w-3 h-3 mr-1" />Abgelaufen</Badge>;
      case 'refunded':
        return <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400"><RefreshCw className="w-3 h-3 mr-1" />Erstattet</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400"><Clock className="w-3 h-3 mr-1" />Ausstehend</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Kopiert",
      description: `${label} wurde in die Zwischenablage kopiert.`,
    });
  };

  const getUserName = (deposit: Deposit) => {
    if (deposit.profiles?.first_name || deposit.profiles?.last_name) {
      return `${deposit.profiles.first_name || ''} ${deposit.profiles.last_name || ''}`.trim();
    }
    return deposit.profiles?.email || 'Unbekannt';
  };

  const filteredDeposits = deposits.filter(deposit => {
    const userName = getUserName(deposit);
    const matchesSearch = 
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deposit.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deposit.nowpayments_payment_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deposit.nowpayments_invoice_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = statusFilter === "all";
    if (statusFilter === "pending") {
      matchesStatus = ['waiting', 'confirming', 'confirmed', 'sending', 'pending'].includes(deposit.status);
    } else if (statusFilter === "finished") {
      matchesStatus = deposit.status === 'finished';
    } else if (statusFilter === "failed") {
      matchesStatus = ['failed', 'expired', 'refunded'].includes(deposit.status);
    }
    
    return matchesSearch && matchesStatus;
  });

  const pendingCount = deposits.filter(d => ['waiting', 'confirming', 'confirmed', 'sending', 'pending'].includes(d.status)).length;
  const finishedCount = deposits.filter(d => d.status === 'finished').length;
  const failedCount = deposits.filter(d => ['failed', 'expired', 'refunded'].includes(d.status)).length;
  const totalFinishedAmount = deposits
    .filter(d => d.status === 'finished')
    .reduce((sum, d) => sum + d.price_amount, 0);

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Einzahlungen</h1>
          <p className="text-muted-foreground">
            Alle Krypto-Einzahlungen über NowPayments
          </p>
        </div>
        <Button variant="outline" onClick={fetchDeposits} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Aktualisieren
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-950">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ausstehend</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Abgeschlossen</p>
                <p className="text-2xl font-bold">{finishedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fehlgeschlagen</p>
                <p className="text-2xl font-bold">{failedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950">
                <Euro className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Eingezahlt (Gesamt)</p>
                <p className="text-2xl font-bold">{formatCurrency(totalFinishedAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Suche nach E-Mail, Name oder Payment-ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
              >
                Alle
              </Button>
              <Button
                variant={statusFilter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("pending")}
              >
                <Clock className="w-4 h-4 mr-1" />
                Ausstehend
              </Button>
              <Button
                variant={statusFilter === "finished" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("finished")}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Abgeschlossen
              </Button>
              <Button
                variant={statusFilter === "failed" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("failed")}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Fehlgeschlagen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Einzahlungen</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredDeposits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Keine Einzahlungen gefunden.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Benutzer</TableHead>
                  <TableHead>Betrag</TableHead>
                  <TableHead>Kryptowährung</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Erstellt</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeposits.map((deposit) => (
                  <TableRow key={deposit.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{getUserName(deposit)}</p>
                        <p className="text-sm text-muted-foreground">{deposit.profiles?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(deposit.price_amount)}
                    </TableCell>
                    <TableCell>
                      {deposit.pay_currency ? (
                        <div className="flex items-center gap-2">
                          <img 
                            src={`https://nowpayments.io/images/coins/${deposit.pay_currency.toLowerCase()}.svg`}
                            alt={deposit.pay_currency}
                            className="w-5 h-5"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <span className="font-mono text-sm">
                            {deposit.pay_amount?.toFixed(8)} {deposit.pay_currency.toUpperCase()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(deposit.status)}</TableCell>
                    <TableCell>
                      {format(new Date(deposit.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDeposit(deposit)}
                      >
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedDeposit} onOpenChange={() => setSelectedDeposit(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Einzahlungsdetails
            </DialogTitle>
            <DialogDescription>
              Details zur Krypto-Einzahlung
            </DialogDescription>
          </DialogHeader>
          
          {selectedDeposit && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Benutzer</Label>
                  <p className="font-medium">{getUserName(selectedDeposit)}</p>
                  <p className="text-sm text-muted-foreground">{selectedDeposit.profiles?.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Betrag</Label>
                  <p className="text-2xl font-bold">{formatCurrency(selectedDeposit.price_amount)}</p>
                </div>
              </div>

              {selectedDeposit.pay_currency && (
                <div>
                  <Label className="text-muted-foreground">Kryptowährung</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <img 
                      src={`https://nowpayments.io/images/coins/${selectedDeposit.pay_currency.toLowerCase()}.svg`}
                      alt={selectedDeposit.pay_currency}
                      className="w-6 h-6"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <span className="font-mono">
                      {selectedDeposit.pay_amount?.toFixed(8)} {selectedDeposit.pay_currency.toUpperCase()}
                    </span>
                  </div>
                </div>
              )}

              {selectedDeposit.actually_paid !== null && selectedDeposit.actually_paid > 0 && (
                <div>
                  <Label className="text-muted-foreground">Tatsächlich bezahlt</Label>
                  <p className="font-mono">
                    {selectedDeposit.actually_paid.toFixed(8)} {selectedDeposit.pay_currency?.toUpperCase()}
                  </p>
                </div>
              )}

              {selectedDeposit.pay_address && (
                <div>
                  <Label className="text-muted-foreground">Zahlungsadresse</Label>
                  <div className="flex items-center gap-2 mt-1 p-3 bg-muted/50 rounded-lg">
                    <p className="font-mono text-sm break-all flex-1">{selectedDeposit.pay_address}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => handleCopy(selectedDeposit.pay_address!, 'Zahlungsadresse')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedDeposit.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Erstellt am</Label>
                  <p>{format(new Date(selectedDeposit.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}</p>
                </div>
              </div>

              {selectedDeposit.completed_at && (
                <div>
                  <Label className="text-muted-foreground">Abgeschlossen am</Label>
                  <p>{format(new Date(selectedDeposit.completed_at), 'dd.MM.yyyy HH:mm', { locale: de })}</p>
                </div>
              )}

              {selectedDeposit.expiration_estimate_date && (
                <div>
                  <Label className="text-muted-foreground">Ablaufdatum</Label>
                  <p>{format(new Date(selectedDeposit.expiration_estimate_date), 'dd.MM.yyyy HH:mm', { locale: de })}</p>
                </div>
              )}

              {(selectedDeposit.nowpayments_invoice_id || selectedDeposit.nowpayments_payment_id) && (
                <div className="grid grid-cols-1 gap-2">
                  {selectedDeposit.nowpayments_invoice_id && (
                    <div>
                      <Label className="text-muted-foreground">Invoice ID</Label>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm">{selectedDeposit.nowpayments_invoice_id}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleCopy(selectedDeposit.nowpayments_invoice_id!, 'Invoice ID')}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {selectedDeposit.nowpayments_payment_id && (
                    <div>
                      <Label className="text-muted-foreground">Payment ID</Label>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm">{selectedDeposit.nowpayments_payment_id}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleCopy(selectedDeposit.nowpayments_payment_id!, 'Payment ID')}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedDeposit.invoice_url && (
                <div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(selectedDeposit.invoice_url!, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Invoice bei NowPayments öffnen
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDeposit(null)}>
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
