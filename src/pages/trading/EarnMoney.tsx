import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, Clock, CheckCircle, XCircle, ArrowRight, Briefcase } from "lucide-react";
import { useTaskEnrollment } from "@/hooks/useTaskEnrollment";
import { supabase } from "@/integrations/supabase/client";

export default function EarnMoney() {
  const navigate = useNavigate();
  const { pendingTasks, submittedTasks, completedTasks, loading } = useTaskEnrollment();

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Offen</Badge>;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Laden...</div>
      </div>
    );
  }

  const totalEarned = completedTasks
    .filter(t => t.status === 'approved')
    .reduce((sum, t) => sum + t.template.compensation, 0);

  const pendingEarnings = pendingTasks.reduce((sum, t) => sum + t.template.compensation, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-600 via-green-500 to-emerald-500 p-6 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <Coins className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold">Geld verdienen</h1>
          </div>
          <p className="text-white/80 max-w-xl">
            Führe Aufträge aus und verdiene Geld. Die Vergütung wird nach erfolgreicher Prüfung deinem Guthaben gutgeschrieben.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Offene Aufträge</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Überprüfung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submittedTasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Verdient</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalEarned)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Offene Aufträge Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          Offene Aufträge ({pendingTasks.length})
        </h2>
        {pendingTasks.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Briefcase className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Keine offenen Aufträge verfügbar</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pendingTasks.map((task) => (
              <Card key={task.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => navigate(`/kryptotrading/geld-verdienen/${task.id}`)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    {task.template.logo_path ? (
                      <img
                        src={getLogoUrl(task.template.logo_path) || ''}
                        alt={task.template.title}
                        className="h-12 w-12 object-contain rounded-lg bg-muted p-1"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                        <Briefcase className="h-6 w-6 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg">{task.template.title}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">
                        {task.template.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(task.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-green-600 text-lg">
                        {formatCurrency(task.template.compensation)}
                      </span>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* In Überprüfung Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-500" />
          In Überprüfung ({submittedTasks.length})
        </h2>
        {submittedTasks.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Clock className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Keine Aufträge in Überprüfung</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {submittedTasks.map((task) => (
              <Card key={task.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/kryptotrading/geld-verdienen/${task.id}`)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    {task.template.logo_path ? (
                      <img
                        src={getLogoUrl(task.template.logo_path) || ''}
                        alt={task.template.title}
                        className="h-12 w-12 object-contain rounded-lg bg-muted p-1"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                        <Clock className="h-6 w-6 text-white" />
                      </div>
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-lg">{task.template.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Eingereicht am {new Date(task.submitted_at!).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    {getStatusBadge(task.status)}
                    <span className="font-bold text-lg">
                      {formatCurrency(task.template.compensation)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Abgeschlossen Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          Abgeschlossen ({completedTasks.length})
        </h2>
        {completedTasks.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <CheckCircle className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Noch keine abgeschlossenen Aufträge</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {completedTasks.map((task) => (
              <Card key={task.id} className={`overflow-hidden cursor-pointer hover:shadow-lg transition-shadow ${task.status === 'approved' ? 'border-green-200' : 'border-red-200'}`}
                onClick={() => navigate(`/kryptotrading/geld-verdienen/${task.id}`)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    {task.template.logo_path ? (
                      <img
                        src={getLogoUrl(task.template.logo_path) || ''}
                        alt={task.template.title}
                        className="h-12 w-12 object-contain rounded-lg bg-muted p-1"
                      />
                    ) : (
                      <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                        task.status === 'approved' 
                          ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
                          : 'bg-gradient-to-br from-red-500 to-rose-500'
                      }`}>
                        {task.status === 'approved' ? (
                          <CheckCircle className="h-6 w-6 text-white" />
                        ) : (
                          <XCircle className="h-6 w-6 text-white" />
                        )}
                      </div>
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-lg">{task.template.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {task.status === 'approved' ? 'Genehmigt' : 'Abgelehnt'} am{' '}
                        {new Date(task.reviewed_at!).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    {getStatusBadge(task.status)}
                    <span className={`font-bold text-lg ${
                      task.status === 'approved' ? 'text-green-600' : 'text-muted-foreground line-through'
                    }`}>
                      {formatCurrency(task.template.compensation)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
