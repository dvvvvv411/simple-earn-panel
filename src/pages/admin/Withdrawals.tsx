import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Wallet, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Search,
  Bitcoin,
  Copy,
  Loader2,
  Filter
} from "lucide-react";
import { useWithdrawalRequests, WithdrawalRequest } from "@/hooks/useWithdrawalRequests";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function Withdrawals() {
  const { requests, loading, fetchAllRequests, processRequest } = useWithdrawalRequests();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAllRequests();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400"><Clock className="w-3 h-3 mr-1" />Ausstehend</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"><CheckCircle className="w-3 h-3 mr-1" />Genehmigt</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Abgelehnt</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Kopiert",
      description: "BTC-Adresse wurde in die Zwischenablage kopiert.",
    });
  };

  const handleProcess = async (status: 'approved' | 'rejected') => {
    if (!selectedRequest) return;
    
    setIsProcessing(true);
    try {
      const success = await processRequest(selectedRequest.id, status, adminNote || undefined);
      if (success) {
        setSelectedRequest(null);
        setAdminNote("");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.btc_wallet_address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;
  const totalPendingAmount = requests
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Auszahlungen</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Auszahlungsanfragen der Benutzer
          </p>
        </div>
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
                <p className="text-sm text-muted-foreground">Genehmigt</p>
                <p className="text-2xl font-bold">{approvedCount}</p>
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
                <p className="text-sm text-muted-foreground">Abgelehnt</p>
                <p className="text-2xl font-bold">{rejectedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-950">
                <Wallet className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ausstehender Betrag</p>
                <p className="text-2xl font-bold">{formatCurrency(totalPendingAmount)}</p>
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
                placeholder="Suche nach E-Mail, Name oder BTC-Adresse..."
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
                variant={statusFilter === "approved" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("approved")}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Genehmigt
              </Button>
              <Button
                variant={statusFilter === "rejected" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("rejected")}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Abgelehnt
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Auszahlungsanfragen</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Keine Auszahlungsanfragen gefunden.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Benutzer</TableHead>
                  <TableHead>Betrag</TableHead>
                  <TableHead>BTC-Adresse</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Erstellt</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.user_name}</p>
                        <p className="text-sm text-muted-foreground">{request.user_email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(request.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Bitcoin className="w-4 h-4 text-orange-500" />
                        <span className="font-mono text-sm">
                          {request.btc_wallet_address.slice(0, 10)}...{request.btc_wallet_address.slice(-6)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleCopyAddress(request.btc_wallet_address)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      {format(new Date(request.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRequest(request)}
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
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Auszahlungsanfrage
            </DialogTitle>
            <DialogDescription>
              Details und Bearbeitung der Auszahlungsanfrage
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Benutzer</Label>
                  <p className="font-medium">{selectedRequest.user_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.user_email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Betrag</Label>
                  <p className="text-2xl font-bold">{formatCurrency(selectedRequest.amount)}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-muted-foreground">BTC-Wallet-Adresse</Label>
                <div className="flex items-center gap-2 mt-1 p-3 bg-muted/50 rounded-lg">
                  <Bitcoin className="w-5 h-5 text-orange-500 shrink-0" />
                  <p className="font-mono text-sm break-all">{selectedRequest.btc_wallet_address}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => handleCopyAddress(selectedRequest.btc_wallet_address)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Erstellt am</Label>
                  <p>{format(new Date(selectedRequest.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}</p>
                </div>
              </div>

              {selectedRequest.admin_note && (
                <div>
                  <Label className="text-muted-foreground">Admin-Notiz</Label>
                  <p className="p-3 bg-muted/50 rounded-lg">{selectedRequest.admin_note}</p>
                </div>
              )}

              {selectedRequest.status === 'pending' && (
                <>
                  <div>
                    <Label htmlFor="adminNote">Admin-Notiz (optional)</Label>
                    <Textarea
                      id="adminNote"
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Optionale Notiz für den Benutzer..."
                      className="mt-1"
                    />
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div className="text-sm text-yellow-700 dark:text-yellow-400">
                        <p className="font-medium">Wichtig:</p>
                        <p>Bei Genehmigung wird der Betrag automatisch vom Benutzerguthaben abgezogen. Stellen Sie sicher, dass Sie die BTC-Transaktion manuell durchführen.</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            {selectedRequest?.status === 'pending' ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleProcess('rejected')}
                  disabled={isProcessing}
                  className="text-destructive hover:text-destructive"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                  Ablehnen
                </Button>
                <Button
                  onClick={() => handleProcess('approved')}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Genehmigen
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                Schließen
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
