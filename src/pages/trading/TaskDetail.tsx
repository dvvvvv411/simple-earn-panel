import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Copy, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  XCircle,
  AlertCircle,
  Phone,
  Mail,
  Key,
  Link as LinkIcon,
  Lock,
  Smartphone,
  Info,
  ListChecks,
  Users,
  Shield,
  Timer,
  Euro,
  Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  compensation: number;
  logo_path: string | null;
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

export default function TaskDetail() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<FullTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchTask = async () => {
    if (!taskId) return;

    try {
      const { data, error } = await supabase
        .from('user_tasks')
        .select(`
          *,
          template:task_templates(*)
        `)
        .eq('id', taskId)
        .single();

      if (error) throw error;
      setTask(data as unknown as FullTask);
    } catch (error) {
      console.error('Error fetching task:', error);
      toast({
        title: "Fehler",
        description: "Auftrag konnte nicht geladen werden",
        variant: "destructive",
      });
      navigate('/kryptotrading/geld-verdienen');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();

    const channel = supabase
      .channel(`task-${taskId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'user_tasks',
        filter: `id=eq.${taskId}`
      }, () => {
        fetchTask();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId]);

  const handleStartTask = async () => {
    if (!task) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('user_tasks')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (error) throw error;
      toast({
        title: "Auftrag gestartet",
        description: "Du kannst jetzt mit dem App-Test beginnen",
      });
      fetchTask();
    } catch (error) {
      console.error('Error starting task:', error);
      toast({
        title: "Fehler",
        description: "Auftrag konnte nicht gestartet werden",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitTask = async () => {
    if (!task) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('user_tasks')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (error) throw error;

      await supabase.functions.invoke('send-telegram-notification', {
        body: { 
          event_type: 'task_submitted', 
          data: { 
            user_id: task.user_id,
            task_title: task.template.title,
            compensation: task.template.compensation
          } 
        }
      });

      toast({
        title: "Auftrag eingereicht",
        description: "Dein Auftrag wird jetzt geprüft",
      });
      fetchTask();
    } catch (error) {
      console.error('Error submitting task:', error);
      toast({
        title: "Fehler",
        description: "Auftrag konnte nicht eingereicht werden",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Kopiert",
      description: `${label} wurde in die Zwischenablage kopiert`,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getLogoUrl = (path: string | null) => {
    if (!path) return null;
    const { data } = supabase.storage.from('task-logos').getPublicUrl(path);
    return data.publicUrl;
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return {
          label: "Ausstehend",
          variant: "secondary" as const,
          icon: Clock,
          color: "text-muted-foreground"
        };
      case "in_progress":
        return {
          label: "In Bearbeitung",
          variant: "default" as const,
          icon: Clock,
          color: "text-primary"
        };
      case "submitted":
        return {
          label: "Eingereicht",
          variant: "outline" as const,
          icon: CheckCircle2,
          color: "text-amber-500"
        };
      case "approved":
        return {
          label: "Genehmigt",
          variant: "default" as const,
          icon: CheckCircle2,
          color: "text-green-500"
        };
      case "rejected":
        return {
          label: "Abgelehnt",
          variant: "destructive" as const,
          icon: XCircle,
          color: "text-destructive"
        };
      default:
        return {
          label: status,
          variant: "secondary" as const,
          icon: AlertCircle,
          color: "text-muted-foreground"
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-16 w-16 text-muted-foreground" />
        <p className="text-xl text-muted-foreground">Auftrag nicht gefunden</p>
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(task.status);
  const StatusIcon = statusConfig.icon;
  const logoUrl = getLogoUrl(task.template.logo_path);
  const hasIdentInfo = task.contact_email || task.contact_phone || task.ident_code || task.ident_link || task.task_password;

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate('/kryptotrading/geld-verdienen')}
        className="mb-2 -ml-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Zurück zur Übersicht
      </Button>

      {/* Hero Header Card - Neutral Design */}
      <Card className="overflow-hidden border-2">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 p-6">
            {/* Logo Container - Clean White Background */}
            <div className="shrink-0">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-white border-2 border-border shadow-sm flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={task.template.title}
                    className="w-16 h-16 md:w-20 md:h-20 object-contain"
                  />
                ) : (
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                )}
              </div>
            </div>

            {/* Title & Info */}
            <div className="flex-1 space-y-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  {task.template.title}
                </h1>
                <p className="text-muted-foreground mt-1">
                  App-Test durchführen
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={statusConfig.variant} className="text-sm px-3 py-1">
                  <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
                  {statusConfig.label}
                </Badge>
                <div className="flex items-center gap-1.5 text-lg font-semibold text-green-600">
                  <Euro className="h-5 w-5" />
                  {formatCurrency(task.template.compensation)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Messages */}
      {task.status === 'approved' && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
          <CardContent className="p-4 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">
                Auftrag erfolgreich abgeschlossen!
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Die Vergütung von {formatCurrency(task.template.compensation)} wurde deinem Guthaben gutgeschrieben.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {task.status === 'rejected' && task.rejection_reason && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-4 flex items-start gap-3">
            <XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-destructive">Auftrag abgelehnt</p>
              <p className="text-sm text-muted-foreground mt-1">
                Grund: {task.rejection_reason}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {task.status === 'submitted' && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="p-4 flex items-start gap-3">
            <Timer className="h-5 w-5 text-amber-600 animate-pulse mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Auftrag wird geprüft
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Dein Auftrag wurde eingereicht und wird von unserem Team überprüft. 
                Die Vergütung wird nach Genehmigung automatisch gutgeschrieben.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card - Was ist das? */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Info className="h-5 w-5 text-primary" />
            Was ist das?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            Du führst einen <span className="font-medium text-foreground">bezahlten App-Test</span> durch. 
            Nach erfolgreichem Abschluss wird dir eine Vergütung von{" "}
            <span className="font-semibold text-green-600">{formatCurrency(task.template.compensation)}</span>{" "}
            auf dein Guthaben gutgeschrieben.
          </p>
          
          {/* Partner Section */}
          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">In Partnerschaft mit</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="bg-white rounded-lg px-3 py-2 border shadow-sm">
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Check24_logo.svg/320px-Check24_logo.svg.png" 
                      alt="CHECK24" 
                      className="h-6 object-contain"
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Deutschlands größtes Vergleichsportal
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SMS Verification Code - Always Visible */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Smartphone className="h-5 w-5 text-primary" />
            SMS-Verifikationscode
          </CardTitle>
        </CardHeader>
        <CardContent>
          {task.verification_code ? (
            <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-6 text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl md:text-4xl font-mono font-bold tracking-[0.3em] text-primary">
                  {task.verification_code}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(task.verification_code!, "SMS-Code")}
                  className="shrink-0"
                >
                  <Copy className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Dieser Code wird für die Verifizierung in der App benötigt
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 p-6 text-center space-y-2">
              <Clock className="h-10 w-10 text-muted-foreground/50 mx-auto" />
              <p className="font-medium text-muted-foreground">
                Derzeit nicht verfügbar
              </p>
              <p className="text-sm text-muted-foreground/80">
                Der SMS-Code wird von deinem Berater bereitgestellt, sobald er verfügbar ist.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Description */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ListChecks className="h-5 w-5 text-primary" />
            Auftragsbeschreibung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {task.template.description}
          </p>
        </CardContent>
      </Card>

      {/* Access Credentials */}
      {hasIdentInfo && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Key className="h-5 w-5 text-primary" />
              Zugangsdaten für den Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {task.contact_email && (
                <div className="rounded-lg border bg-muted/30 p-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    E-Mail-Adresse
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate">{task.contact_email}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => copyToClipboard(task.contact_email!, "E-Mail")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {task.contact_phone && (
                <div className="rounded-lg border bg-muted/30 p-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    Telefonnummer
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{task.contact_phone}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => copyToClipboard(task.contact_phone!, "Telefon")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {task.ident_code && (
                <div className="rounded-lg border bg-muted/30 p-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Key className="h-4 w-4" />
                    Identifikationscode
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-medium">{task.ident_code}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => copyToClipboard(task.ident_code!, "Ident-Code")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {task.task_password && (
                <div className="rounded-lg border bg-muted/30 p-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock className="h-4 w-4" />
                    Passwort
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-medium">{task.task_password}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => copyToClipboard(task.task_password!, "Passwort")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {task.ident_link && (
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LinkIcon className="h-4 w-4" />
                  Verifizierungslink
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={task.ident_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline truncate flex-1 font-medium"
                  >
                    {task.ident_link}
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => copyToClipboard(task.ident_link!, "Link")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    asChild
                  >
                    <a href={task.ident_link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* How it works - Step by Step (only for pending tasks) */}
      {task.status === 'pending' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ListChecks className="h-5 w-5 text-primary" />
              So funktioniert's
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                "Starte den Auftrag über den Button unten",
                "Verwende die bereitgestellten Zugangsdaten",
                "Führe die Verifizierung in der App durch",
                "Markiere den Auftrag als abgeschlossen",
                "Nach Prüfung wird die Vergütung gutgeschrieben"
              ].map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <p className="text-muted-foreground pt-0.5">{step}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {(task.status === 'pending' || task.status === 'in_progress') && (
        <Card>
          <CardContent className="p-6">
            {task.status === 'pending' && (
              <Button
                onClick={handleStartTask}
                disabled={submitting}
                className="w-full h-12 text-lg"
                size="lg"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    Wird gestartet...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Auftrag jetzt starten
                  </span>
                )}
              </Button>
            )}

            {task.status === 'in_progress' && (
              <Button
                onClick={handleSubmitTask}
                disabled={submitting}
                className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    Wird eingereicht...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Als abgeschlossen markieren
                  </span>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Trust Footer */}
      <div className="flex flex-wrap items-center justify-center gap-6 py-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          <span>Sichere Durchführung</span>
        </div>
        <Separator orientation="vertical" className="h-4 hidden sm:block" />
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>Geprüfter Partner</span>
        </div>
        <Separator orientation="vertical" className="h-4 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4" />
          <span>24h Bearbeitung</span>
        </div>
      </div>
    </div>
  );
}
