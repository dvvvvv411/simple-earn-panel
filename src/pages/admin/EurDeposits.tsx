import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Landmark, Search, Plus, Clock, CheckCircle, XCircle, Send } from "lucide-react";
import { EurDepositActivateDialog } from "@/components/admin/EurDepositActivateDialog";
import { EurDepositDetailDialog } from "@/components/admin/EurDepositDetailDialog";

interface EurDepositRequest {
  id: string;
  user_id: string;
  partner_bank: string;
  verification_type: string;
  contact_email: string;
  contact_phone: string;
  verification_code: string;
  verification_link: string;
  status: string;
  user_confirmed_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
}

export default function EurDeposits() {
  const [requests, setRequests] = useState<EurDepositRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<EurDepositRequest | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('eur_deposit_requests')
        .select(`
          *,
          profile:profiles!eur_deposit_requests_user_id_fkey(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading EUR deposit requests:', error);
      toast.error('Fehler beim Laden der Anfragen');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', label: 'Ausstehend', icon: Clock };
      case 'submitted':
        return { color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', label: 'Eingereicht', icon: Send };
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
      request.partner_bank.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    pending: requests.filter(r => r.status === 'pending').length,
    submitted: requests.filter(r => r.status === 'submitted').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Landmark className="h-8 w-8 text-primary" />
            EUR-Einzahlungen
          </h1>
          <p className="text-muted-foreground mt-1">
            SEPA-Bankeinzahlungen für Nutzer verwalten
          </p>
        </div>
        <Button onClick={() => setActivateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Für Nutzer aktivieren
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-yellow-500/5 border-yellow-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ausstehend</p>
                <p className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Eingereicht</p>
                <p className="text-2xl font-bold text-blue-600">{statusCounts.submitted}</p>
              </div>
              <Send className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Genehmigt</p>
                <p className="text-2xl font-bold text-green-600">{statusCounts.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Abgelehnt</p>
                <p className="text-2xl font-bold text-red-600">{statusCounts.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500/50" />
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
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="pending">Ausstehend</SelectItem>
                <SelectItem value="submitted">Eingereicht</SelectItem>
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
          <CardTitle>Anfragen ({filteredRequests.length})</CardTitle>
          <CardDescription>Alle EUR-Einzahlungsanfragen</CardDescription>
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
                        <Landmark className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {request.profile?.first_name} {request.profile?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {request.profile?.email}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {request.partner_bank} • {request.verification_type}
                        </p>
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

      <EurDepositActivateDialog
        open={activateDialogOpen}
        onOpenChange={setActivateDialogOpen}
        onSuccess={loadRequests}
      />

      {selectedRequest && (
        <EurDepositDetailDialog
          request={selectedRequest}
          open={!!selectedRequest}
          onOpenChange={(open) => !open && setSelectedRequest(null)}
          onSuccess={loadRequests}
        />
      )}
    </div>
  );
}
