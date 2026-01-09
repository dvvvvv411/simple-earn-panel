import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Eye,
  Loader2,
  RefreshCw
} from "lucide-react";

interface KYCSubmission {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  birth_place: string;
  street: string;
  postal_code: string;
  city: string;
  nationality: string;
  employment_status: string;
  monthly_income: string;
  source_of_funds: string[];
  id_front_path: string;
  id_back_path: string;
  status: string;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  user_email?: string;
}

export default function KYCManagement() {
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSubmission, setSelectedSubmission] = useState<KYCSubmission | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [idFrontUrl, setIdFrontUrl] = useState<string | null>(null);
  const [idBackUrl, setIdBackUrl] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('kyc_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user emails for each submission
      const submissionsWithEmails = await Promise.all(
        (data || []).map(async (submission) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', submission.user_id)
            .single();
          return {
            ...submission,
            user_email: profile?.email || 'Unbekannt'
          };
        })
      );

      setSubmissions(submissionsWithEmails);
    } catch (error: any) {
      console.error('Error fetching KYC submissions:', error);
      toast({
        title: "Fehler",
        description: "KYC-Einreichungen konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const loadDocumentUrls = async (submission: KYCSubmission) => {
    try {
      const { data: frontData } = await supabase.storage
        .from('kyc-documents')
        .createSignedUrl(submission.id_front_path, 3600);
      
      const { data: backData } = await supabase.storage
        .from('kyc-documents')
        .createSignedUrl(submission.id_back_path, 3600);

      setIdFrontUrl(frontData?.signedUrl || null);
      setIdBackUrl(backData?.signedUrl || null);
    } catch (error) {
      console.error('Error loading document URLs:', error);
    }
  };

  const openDetailDialog = async (submission: KYCSubmission) => {
    setSelectedSubmission(submission);
    setIdFrontUrl(null);
    setIdBackUrl(null);
    setDetailDialogOpen(true);
    await loadDocumentUrls(submission);
  };

  const handleApprove = async () => {
    if (!selectedSubmission) return;
    setProcessing(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('kyc_submissions')
        .update({
          status: 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: null
        })
        .eq('id', selectedSubmission.id);

      if (error) throw error;

      // Send confirmation email
      await supabase.functions.invoke('send-kyc-confirmation', {
        body: {
          user_id: selectedSubmission.user_id,
          approved: true
        }
      });

      toast({
        title: "Erfolgreich",
        description: "KYC-Verifizierung wurde genehmigt.",
      });

      setDetailDialogOpen(false);
      fetchSubmissions();
    } catch (error: any) {
      console.error('Error approving KYC:', error);
      toast({
        title: "Fehler",
        description: "KYC-Genehmigung fehlgeschlagen.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSubmission || !rejectionReason.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Ablehnungsgrund an.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('kyc_submissions')
        .update({
          status: 'rejected',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason
        })
        .eq('id', selectedSubmission.id);

      if (error) throw error;

      toast({
        title: "Erfolgreich",
        description: "KYC-Verifizierung wurde abgelehnt.",
      });

      setRejectionDialogOpen(false);
      setDetailDialogOpen(false);
      setRejectionReason("");
      fetchSubmissions();
    } catch (error: any) {
      console.error('Error rejecting KYC:', error);
      toast({
        title: "Fehler",
        description: "KYC-Ablehnung fehlgeschlagen.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = 
      submission.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (submission.user_email?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || submission.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    pending: submissions.filter(s => s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300"><Clock className="h-3 w-3 mr-1" />Ausstehend</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300"><CheckCircle2 className="h-3 w-3 mr-1" />Genehmigt</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300"><XCircle className="h-3 w-3 mr-1" />Abgelehnt</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">KYC-Verwaltung</h1>
          <p className="text-muted-foreground">Überprüfen und verwalten Sie Identitätsverifizierungen</p>
        </div>
        <Button onClick={fetchSubmissions} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Aktualisieren
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ausstehend</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Genehmigt</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Abgelehnt</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            KYC-Einreichungen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nach Name oder E-Mail suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
                size="sm"
              >
                Alle
              </Button>
              <Button
                variant={statusFilter === "pending" ? "default" : "outline"}
                onClick={() => setStatusFilter("pending")}
                size="sm"
              >
                Ausstehend
              </Button>
              <Button
                variant={statusFilter === "approved" ? "default" : "outline"}
                onClick={() => setStatusFilter("approved")}
                size="sm"
              >
                Genehmigt
              </Button>
              <Button
                variant={statusFilter === "rejected" ? "default" : "outline"}
                onClick={() => setStatusFilter("rejected")}
                size="sm"
              >
                Abgelehnt
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Keine KYC-Einreichungen gefunden.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Benutzer</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Eingereicht am</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">{submission.user_email}</TableCell>
                    <TableCell>{submission.first_name} {submission.last_name}</TableCell>
                    <TableCell>{formatDate(submission.created_at)}</TableCell>
                    <TableCell>{getStatusBadge(submission.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetailDialog(submission)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
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
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              KYC-Details - {selectedSubmission?.first_name} {selectedSubmission?.last_name}
            </DialogTitle>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-6">
              {/* Status Banner */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedSubmission.status)}</div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Eingereicht am</p>
                  <p className="font-medium">{formatDate(selectedSubmission.created_at)}</p>
                </div>
              </div>

              {selectedSubmission.rejection_reason && (
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">Ablehnungsgrund:</p>
                  <p className="text-red-700 dark:text-red-300">{selectedSubmission.rejection_reason}</p>
                </div>
              )}

              {/* Personal Data */}
              <div>
                <h3 className="font-semibold mb-3">Persönliche Daten</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Vorname</Label>
                    <p className="font-medium">{selectedSubmission.first_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Nachname</Label>
                    <p className="font-medium">{selectedSubmission.last_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Geburtsdatum</Label>
                    <p className="font-medium">{new Date(selectedSubmission.birth_date).toLocaleDateString('de-DE')}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Geburtsort</Label>
                    <p className="font-medium">{selectedSubmission.birth_place}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Staatsangehörigkeit</Label>
                    <p className="font-medium">{selectedSubmission.nationality}</p>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="font-semibold mb-3">Adresse</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Straße</Label>
                    <p className="font-medium">{selectedSubmission.street}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">PLZ</Label>
                    <p className="font-medium">{selectedSubmission.postal_code}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Stadt</Label>
                    <p className="font-medium">{selectedSubmission.city}</p>
                  </div>
                </div>
              </div>

              {/* Employment & Income */}
              <div>
                <h3 className="font-semibold mb-3">Beschäftigung & Finanzen</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Beschäftigungsstatus</Label>
                    <p className="font-medium">{selectedSubmission.employment_status}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Monatliches Einkommen</Label>
                    <p className="font-medium">{selectedSubmission.monthly_income}</p>
                  </div>
                  <div className="col-span-2 md:col-span-3">
                    <Label className="text-muted-foreground">Herkunft der Einlagen</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedSubmission.source_of_funds.map((source, idx) => (
                        <Badge key={idx} variant="secondary">{source}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="font-semibold mb-3">Dokumente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Personalausweis Vorderseite</Label>
                    {idFrontUrl ? (
                      <img 
                        src={idFrontUrl} 
                        alt="ID Front" 
                        className="mt-2 rounded-lg border max-h-64 object-contain w-full bg-muted"
                      />
                    ) : (
                      <div className="mt-2 h-48 rounded-lg border bg-muted flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Personalausweis Rückseite</Label>
                    {idBackUrl ? (
                      <img 
                        src={idBackUrl} 
                        alt="ID Back" 
                        className="mt-2 rounded-lg border max-h-64 object-contain w-full bg-muted"
                      />
                    ) : (
                      <div className="mt-2 h-48 rounded-lg border bg-muted flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {selectedSubmission.status === 'pending' && (
                <DialogFooter className="gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => setRejectionDialogOpen(true)}
                    disabled={processing}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Ablehnen
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={processing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    Genehmigen
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection Reason Dialog */}
      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>KYC-Verifizierung ablehnen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectionReason">Ablehnungsgrund (Pflichtfeld)</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Bitte geben Sie den Grund für die Ablehnung an..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectionDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Ablehnen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
