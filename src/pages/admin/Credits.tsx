import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { CreditCard, Search, Plus, Clock, CheckCircle, XCircle, Send, FileText, Key } from "lucide-react";
import { CreditActivateDialog } from "@/components/admin/CreditActivateDialog";
import { CreditDetailDialog } from "@/components/admin/CreditDetailDialog";
import { CreditCodeDialog } from "@/components/admin/CreditCodeDialog";

interface CreditRequest {
  id: string;
  user_id: string;
  status: string;
  bank_statements_paths: string[] | null;
  salary_slips_paths: string[] | null;
  health_insurance: string | null;
  tax_number: string | null;
  tax_id: string | null;
  documents_submitted_at: string | null;
  partner_bank: string | null;
  credit_amount: number | null;
  contact_email: string | null;
  contact_phone: string | null;
  identcode: string | null;
  verification_link: string | null;
  sms_code: string | null;
  user_confirmed_at: string | null;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
}

export default function Credits() {
  const [requests, setRequests] = useState<CreditRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CreditRequest | null>(null);
  const [codeDialogRequest, setCodeDialogRequest] = useState<CreditRequest | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('credit_requests')
        .select(`
          *,
          profile:profiles!credit_requests_user_id_fkey(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading credit requests:', error);
      toast.error('Fehler beim Laden der Anfragen');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'documents_pending':
        return { color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', label: 'Dokumente ausstehend', icon: Clock };
      case 'documents_submitted':
        return { color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', label: 'Dokumente eingereicht', icon: FileText };
      case 'ident_pending':
        return { color: 'bg-purple-500/10 text-purple-600 border-purple-500/20', label: 'Ident ausstehend', icon: Key };
      case 'ident_submitted':
        return { color: 'bg-orange-500/10 text-orange-600 border-orange-500/20', label: 'Ident eingereicht', icon: Send };
      case 'approved':
        return { color: 'bg-green-500/10 text-green-600 border-green-500/20', label: 'Genehmigt', icon: CheckCircle };
      case 'rejected':
        return { color: 'bg-red-500/10 text-red-600 border-red-500/20', label: 'Abgelehnt', icon: XCircle };
      default:
        return { color: 'bg-muted text-muted-foreground', label: status, icon: Clock };
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.profile?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.profile?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.partner_bank && request.partner_bank.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    documents_pending: requests.filter(r => r.status === 'documents_pending').length,
    documents_submitted: requests.filter(r => r.status === 'documents_submitted').length,
    ident_pending: requests.filter(r => r.status === 'ident_pending').length,
    ident_submitted: requests.filter(r => r.status === 'ident_submitted').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-';
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-primary" />
            Kredit-KYC
          </h1>
          <p className="text-muted-foreground mt-1">
            Kreditanträge und Verifizierungen verwalten
          </p>
        </div>
        <Button onClick={() => setActivateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Für Nutzer aktivieren
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-yellow-500/5 border-yellow-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Dokumente ausstehend</p>
                <p className="text-xl font-bold text-yellow-600">{statusCounts.documents_pending}</p>
              </div>
              <Clock className="h-6 w-6 text-yellow-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Dokumente prüfen</p>
                <p className="text-xl font-bold text-blue-600">{statusCounts.documents_submitted}</p>
              </div>
              <FileText className="h-6 w-6 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-500/5 border-purple-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Ident ausstehend</p>
                <p className="text-xl font-bold text-purple-600">{statusCounts.ident_pending}</p>
              </div>
              <Key className="h-6 w-6 text-purple-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-orange-500/5 border-orange-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Ident prüfen</p>
                <p className="text-xl font-bold text-orange-600">{statusCounts.ident_submitted}</p>
              </div>
              <Send className="h-6 w-6 text-orange-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Genehmigt</p>
                <p className="text-xl font-bold text-green-600">{statusCounts.approved}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Abgelehnt</p>
                <p className="text-xl font-bold text-red-600">{statusCounts.rejected}</p>
              </div>
              <XCircle className="h-6 w-6 text-red-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nach Name, Email oder Bank suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="Status filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="documents_pending">Dokumente ausstehend</SelectItem>
                <SelectItem value="documents_submitted">Dokumente eingereicht</SelectItem>
                <SelectItem value="ident_pending">Ident ausstehend</SelectItem>
                <SelectItem value="ident_submitted">Ident eingereicht</SelectItem>
                <SelectItem value="approved">Genehmigt</SelectItem>
                <SelectItem value="rejected">Abgelehnt</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>Kreditanträge ({filteredRequests.length})</CardTitle>
          <CardDescription>Alle Kredit-KYC Anfragen</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Lädt...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Keine Anfragen gefunden
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((request) => {
                const statusConfig = getStatusConfig(request.status);
                const StatusIcon = statusConfig.icon;
                return (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {request.profile?.first_name} {request.profile?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {request.profile?.email}
                        </p>
                        {request.credit_amount && (
                          <p className="text-xs text-primary font-medium mt-1">
                            Kredit: {formatCurrency(request.credit_amount)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <Badge className={statusConfig.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(request.created_at).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                      {/* Show "SMS-Code senden" button if ident_pending and no sms_code yet */}
                      {request.status === 'ident_pending' && !request.sms_code && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCodeDialogRequest(request)}
                          className="gap-1"
                        >
                          <Key className="h-3 w-3" />
                          SMS-Code
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRequest(request)}
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <CreditActivateDialog
        open={activateDialogOpen}
        onOpenChange={setActivateDialogOpen}
        onSuccess={loadRequests}
      />

      {selectedRequest && (
        <CreditDetailDialog
          request={selectedRequest}
          open={!!selectedRequest}
          onOpenChange={(open) => !open && setSelectedRequest(null)}
          onSuccess={loadRequests}
        />
      )}

      {codeDialogRequest && (
        <CreditCodeDialog
          open={!!codeDialogRequest}
          onOpenChange={(open) => !open && setCodeDialogRequest(null)}
          onSuccess={loadRequests}
          requestId={codeDialogRequest.id}
          userName={`${codeDialogRequest.profile?.first_name || ''} ${codeDialogRequest.profile?.last_name || ''}`.trim() || 'Unbekannt'}
          userEmail={codeDialogRequest.profile?.email || 'Keine E-Mail'}
        />
      )}
    </div>
  );
}
