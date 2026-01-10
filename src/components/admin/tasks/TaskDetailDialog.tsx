import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Send, CheckCircle, XCircle, Copy, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  compensation: number;
  logo_path: string | null;
}

interface UserTask {
  id: string;
  status: string;
  created_at: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  template: TaskTemplate;
}

interface TaskDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: UserTask | null;
  userId: string | null;
  onSuccess: () => void;
}

interface FullTask {
  id: string;
  user_id: string;
  template_id: string;
  contact_email: string | null;
  contact_phone: string | null;
  ident_code: string | null;
  ident_link: string | null;
  task_password: string | null;
  verification_code: string | null;
  status: string;
  started_at: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  template: TaskTemplate;
}

export function TaskDetailDialog({ open, onOpenChange, task, userId, onSuccess }: TaskDetailDialogProps) {
  const [fullTask, setFullTask] = useState<FullTask | null>(null);
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && task) {
      fetchFullTask();
    }
  }, [open, task]);

  const fetchFullTask = async () => {
    if (!task) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_tasks')
        .select(`
          *,
          template:task_templates(*)
        `)
        .eq('id', task.id)
        .single();

      if (error) throw error;
      setFullTask(data as unknown as FullTask);
      setVerificationCode(data.verification_code || "");
    } catch (error) {
      console.error('Error fetching task:', error);
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (!fullTask || !verificationCode.trim()) {
      toast.error('Bitte einen Code eingeben');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_tasks')
        .update({ verification_code: verificationCode.trim() })
        .eq('id', fullTask.id);

      if (error) throw error;
      toast.success('Code wurde aktualisiert');
      fetchFullTask();
    } catch (error) {
      console.error('Error updating code:', error);
      toast.error('Fehler beim Aktualisieren');
    }
  };

  const handleApprove = async () => {
    if (!fullTask || !userId) return;

    setSubmitting(true);
    try {
      const { data: session } = await supabase.auth.getSession();

      // 1. Get current balance
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      const currentBalance = profile?.balance || 0;
      const compensation = fullTask.template.compensation;
      const newBalance = currentBalance + compensation;

      // 2. Update balance
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', userId);

      if (balanceError) throw balanceError;

      // 3. Create transaction
      const { error: transactionError } = await supabase
        .from('user_transactions')
        .insert({
          user_id: userId,
          type: 'credit',
          amount: compensation,
          description: `Auftragsvergütung: ${fullTask.template.title}`,
          previous_balance: currentBalance,
          new_balance: newBalance,
          created_by: session.session?.user.id
        });

      if (transactionError) throw transactionError;

      // 4. Update task status
      const { error: taskError } = await supabase
        .from('user_tasks')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: session.session?.user.id
        })
        .eq('id', fullTask.id);

      if (taskError) throw taskError;

      toast.success(`Auftrag genehmigt - ${formatCurrency(compensation)} gutgeschrieben`);
      onSuccess();
    } catch (error) {
      console.error('Error approving task:', error);
      toast.error('Fehler beim Genehmigen');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!fullTask || !rejectionReason.trim()) {
      toast.error('Bitte einen Ablehnungsgrund eingeben');
      return;
    }

    setSubmitting(true);
    try {
      const { data: session } = await supabase.auth.getSession();

      const { error } = await supabase
        .from('user_tasks')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason.trim(),
          reviewed_at: new Date().toISOString(),
          reviewed_by: session.session?.user.id
        })
        .eq('id', fullTask.id);

      if (error) throw error;

      toast.success('Auftrag abgelehnt');
      onSuccess();
    } catch (error) {
      console.error('Error rejecting task:', error);
      toast.error('Fehler beim Ablehnen');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Kopiert');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Offen</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500">In Bearbeitung</Badge>;
      case 'submitted':
        return <Badge className="bg-yellow-500">In Überprüfung</Badge>;
      case 'approved':
        return <Badge className="bg-green-500">Genehmigt</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Abgelehnt</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getLogoUrl = (path: string | null) => {
    if (!path) return null;
    const { data } = supabase.storage.from('task-logos').getPublicUrl(path);
    return data.publicUrl;
  };

  if (loading || !fullTask) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Auftragsdetails</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center text-muted-foreground">Laden...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {fullTask.template.logo_path && (
              <img
                src={getLogoUrl(fullTask.template.logo_path) || ''}
                alt={fullTask.template.title}
                className="h-8 w-8 object-contain"
              />
            )}
            {fullTask.template.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status & Compensation */}
          <div className="flex items-center justify-between">
            {getStatusBadge(fullTask.status)}
            <span className="font-semibold text-lg">
              {formatCurrency(fullTask.template.compensation)}
            </span>
          </div>

          {/* Description */}
          <div>
            <Label className="text-muted-foreground">Beschreibung</Label>
            <p className="text-sm mt-1">{fullTask.template.description}</p>
          </div>

          <Separator />

          {/* Ident Information */}
          <div className="space-y-3">
            <Label className="font-medium">Ident-Informationen</Label>

            {fullTask.contact_email && (
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <div>
                  <span className="text-xs text-muted-foreground">Email</span>
                  <p className="font-mono text-sm">{fullTask.contact_email}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(fullTask.contact_email!)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}

            {fullTask.contact_phone && (
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <div>
                  <span className="text-xs text-muted-foreground">Telefon</span>
                  <p className="font-mono text-sm">{fullTask.contact_phone}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(fullTask.contact_phone!)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}

            {fullTask.ident_code && (
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <div>
                  <span className="text-xs text-muted-foreground">Identcode</span>
                  <p className="font-mono text-sm">{fullTask.ident_code}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(fullTask.ident_code!)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}

            {fullTask.task_password && (
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <div>
                  <span className="text-xs text-muted-foreground">Passwort</span>
                  <p className="font-mono text-sm">{fullTask.task_password}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(fullTask.task_password!)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}

            {fullTask.ident_link && (
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-muted-foreground">Identlink</span>
                  <p className="font-mono text-sm truncate">{fullTask.ident_link}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(fullTask.ident_link!)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <a href={fullTask.ident_link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            )}

            {!fullTask.contact_email && !fullTask.contact_phone && !fullTask.ident_code && !fullTask.task_password && !fullTask.ident_link && (
              <p className="text-sm text-muted-foreground">Keine Ident-Informationen hinterlegt</p>
            )}
          </div>

          <Separator />

          {/* Verification Code Section */}
          <div className="space-y-3">
            <Label className="font-medium">Verifikations-Code</Label>
            <p className="text-xs text-muted-foreground">
              Dieser Code wird dem Nutzer angezeigt. Sie können ihn jederzeit ändern.
            </p>
            <div className="flex gap-2">
              <Input
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Code eingeben..."
              />
              <Button onClick={handleSendCode} disabled={!verificationCode.trim()}>
                <Send className="mr-2 h-4 w-4" />
                Senden
              </Button>
            </div>
            {fullTask.verification_code && (
              <p className="text-sm text-muted-foreground">
                Aktueller Code: <span className="font-mono font-medium">{fullTask.verification_code}</span>
              </p>
            )}
          </div>

          {/* Rejection Reason (if rejected) */}
          {fullTask.status === 'rejected' && fullTask.rejection_reason && (
            <>
              <Separator />
              <div>
                <Label className="text-destructive">Ablehnungsgrund</Label>
                <p className="text-sm mt-1">{fullTask.rejection_reason}</p>
              </div>
            </>
          )}

          {/* Approve/Reject Actions */}
          {fullTask.status === 'submitted' && (
            <>
              <Separator />
              {showRejectForm ? (
                <div className="space-y-3">
                  <Label>Ablehnungsgrund</Label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Grund für die Ablehnung..."
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowRejectForm(false)}>
                      Abbrechen
                    </Button>
                    <Button variant="destructive" onClick={handleReject} disabled={submitting}>
                      Ablehnen
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={handleApprove}
                    disabled={submitting}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Genehmigen ({formatCurrency(fullTask.template.compensation)})
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => setShowRejectForm(true)}
                    disabled={submitting}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Ablehnen
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Schließen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
