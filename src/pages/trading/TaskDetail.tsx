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
  CheckCircle, 
  Clock, 
  XCircle,
  Briefcase,
  Phone,
  Mail,
  Key,
  Link,
  Lock,
  MessageSquare
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
      toast.error('Fehler beim Laden');
      navigate('/kryptotrading/geld-verdienen');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();

    // Subscribe to changes
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

    try {
      const { error } = await supabase
        .from('user_tasks')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (error) throw error;
      toast.success('Auftrag gestartet');
      fetchTask();
    } catch (error) {
      console.error('Error starting task:', error);
      toast.error('Fehler');
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

      // Send telegram notification
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

      toast.success('Auftrag eingereicht - Warte auf Prüfung');
      fetchTask();
    } catch (error) {
      console.error('Error submitting task:', error);
      toast.error('Fehler');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('In Zwischenablage kopiert');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Laden...</div>
      </div>
    );
  }

  if (!task) {
    return null;
  }

  const hasIdentInfo = task.contact_email || task.contact_phone || task.ident_code || task.ident_link || task.task_password;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate('/kryptotrading/geld-verdienen')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Zurück zur Übersicht
      </Button>

      {/* Header Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-green-600 via-green-500 to-emerald-500 p-6 text-white">
          <div className="flex items-start gap-4">
            {task.template.logo_path ? (
              <img
                src={getLogoUrl(task.template.logo_path) || ''}
                alt={task.template.title}
                className="h-16 w-16 object-contain rounded-xl bg-white/20 p-2"
              />
            ) : (
              <div className="h-16 w-16 bg-white/20 rounded-xl flex items-center justify-center">
                <Briefcase className="h-8 w-8" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{task.template.title}</h1>
              <p className="text-white/80 mt-1">{task.template.description}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <Badge className="bg-white/20 text-white border-white/30">
              {task.status === 'pending' && 'Offen'}
              {task.status === 'in_progress' && 'In Bearbeitung'}
              {task.status === 'submitted' && 'In Überprüfung'}
              {task.status === 'approved' && 'Genehmigt'}
              {task.status === 'rejected' && 'Abgelehnt'}
            </Badge>
            <span className="text-2xl font-bold">{formatCurrency(task.template.compensation)}</span>
          </div>
        </div>
      </Card>

      {/* Status Messages */}
      {task.status === 'submitted' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="py-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800">In Überprüfung</p>
              <p className="text-sm text-yellow-700">
                Dein Auftrag wird geprüft. Die Vergütung wird nach Genehmigung gutgeschrieben.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {task.status === 'approved' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Auftrag genehmigt!</p>
              <p className="text-sm text-green-700">
                Die Vergütung von {formatCurrency(task.template.compensation)} wurde deinem Guthaben gutgeschrieben.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {task.status === 'rejected' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-600" />
              <p className="font-medium text-red-800">Auftrag abgelehnt</p>
            </div>
            {task.rejection_reason && (
              <p className="text-sm text-red-700 mt-2 ml-8">{task.rejection_reason}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ident Information */}
      {hasIdentInfo && (task.status === 'pending' || task.status === 'in_progress') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="h-5 w-5" />
              Auftragsdaten
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {task.contact_email && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-mono">{task.contact_email}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(task.contact_email!)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}

            {task.contact_phone && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Telefon</p>
                    <p className="font-mono">{task.contact_phone}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(task.contact_phone!)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}

            {task.ident_code && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Identcode</p>
                    <p className="font-mono font-bold text-lg">{task.ident_code}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(task.ident_code!)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}

            {task.task_password && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Passwort</p>
                    <p className="font-mono">{task.task_password}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(task.task_password!)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}

            {task.ident_link && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Link className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Identlink</p>
                    <p className="font-mono text-sm truncate">{task.ident_link}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(task.ident_link!)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
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

      {/* Verification Code Display */}
      {task.verification_code && (task.status === 'pending' || task.status === 'in_progress') && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Verifikations-Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground mb-2">
                Dieser Code wird von Ihrem Berater durchgegeben
              </p>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-4xl font-bold tracking-widest text-primary">
                  {task.verification_code}
                </span>
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(task.verification_code!)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {task.status === 'pending' && (
        <Button size="lg" className="w-full" onClick={handleStartTask}>
          Auftrag starten
        </Button>
      )}

      {task.status === 'in_progress' && (
        <Button 
          size="lg" 
          className="w-full bg-green-600 hover:bg-green-700" 
          onClick={handleSubmitTask}
          disabled={submitting}
        >
          <CheckCircle className="mr-2 h-5 w-5" />
          {submitting ? 'Wird eingereicht...' : 'Als abgeschlossen markieren'}
        </Button>
      )}
    </div>
  );
}
