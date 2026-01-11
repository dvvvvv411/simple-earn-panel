import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, Clock, CheckCircle, XCircle, ArrowRight, Briefcase } from "lucide-react";
import { useTaskEnrollment } from "@/hooks/useTaskEnrollment";
import { supabase } from "@/integrations/supabase/client";

const animationStyles = `
  @keyframes floating {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(5deg); }
  }
  @keyframes floating-delayed {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-15px) rotate(-3deg); }
  }
  @keyframes shimmer {
    0% { transform: translateX(-100%) skewX(-12deg); }
    100% { transform: translateX(100%) skewX(-12deg); }
  }
  @keyframes particle-float {
    0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
    25% { transform: translateY(-10px) translateX(5px); opacity: 0.6; }
    75% { transform: translateY(-5px) translateX(-3px); opacity: 0.4; }
  }
`;

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
      <style>{animationStyles}</style>
      
      {/* Header mit animiertem Hintergrund */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/95 to-primary/80 p-6 md:p-8 text-white">
        {/* Floating Bubbles */}
        <div 
          className="absolute top-6 left-12 w-24 h-24 bg-white/10 rounded-full blur-sm"
          style={{ animation: 'floating 6s ease-in-out infinite' }} 
        />
        <div 
          className="absolute bottom-8 right-16 w-20 h-20 bg-white/15 rounded-full blur-sm"
          style={{ animation: 'floating-delayed 8s ease-in-out 2s infinite' }} 
        />
        <div 
          className="absolute top-1/2 left-1/3 w-16 h-16 bg-white/5 rounded-full blur-sm"
          style={{ animation: 'floating 7s ease-in-out 1s infinite' }} 
        />
        
        {/* Shimmer Overlay */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
            style={{ animation: 'shimmer 3s linear infinite' }} 
          />
        </div>
        
        {/* Particle Dots */}
        <div className="absolute inset-0 opacity-40">
          <div 
            className="absolute top-1/4 left-[16%] w-2 h-2 bg-white/60 rounded-full"
            style={{ animation: 'particle-float 5s ease-in-out infinite' }}
          />
          <div 
            className="absolute top-3/4 left-3/4 w-1.5 h-1.5 bg-white/50 rounded-full"
            style={{ animation: 'particle-float 7s ease-in-out 1s infinite' }}
          />
          <div 
            className="absolute bottom-1/4 left-1/2 w-1 h-1 bg-white/70 rounded-full"
            style={{ animation: 'particle-float 5s ease-in-out infinite' }}
          />
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/20">
              <Coins className="w-7 h-7 md:w-8 md:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Geld verdienen</h1>
              <p className="text-white/80 mt-1 text-sm md:text-base max-w-xl">
                Führe Aufträge aus und verdiene Geld. Die Vergütung wird nach erfolgreicher Prüfung deinem Guthaben gutgeschrieben.
              </p>
            </div>
          </div>
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
            <div className="text-2xl font-bold text-primary">{formatCurrency(totalEarned)}</div>
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
                      <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
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
                      <span className="font-bold text-primary text-lg">
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
      {submittedTasks.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            In Überprüfung ({submittedTasks.length})
          </h2>
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
        </div>
      )}

      {/* Abgeschlossen Section */}
      {completedTasks.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Abgeschlossen ({completedTasks.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {completedTasks.map((task) => (
              <Card key={task.id} className={`overflow-hidden cursor-pointer hover:shadow-lg transition-shadow ${task.status === 'approved' ? 'border-primary/30' : 'border-red-200'}`}
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
                          ? 'bg-gradient-to-br from-primary to-primary/80' 
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
                      task.status === 'approved' ? 'text-primary' : 'text-muted-foreground line-through'
                    }`}>
                      {formatCurrency(task.template.compensation)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
