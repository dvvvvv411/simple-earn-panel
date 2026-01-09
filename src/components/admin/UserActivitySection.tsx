import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Activity, Clock, Monitor, Calendar, ExternalLink } from "lucide-react";
import { UserActivityDialog } from "./UserActivityDialog";

interface ActivitySession {
  id: string;
  started_at: string;
  last_active_at: string;
  ended_at: string | null;
  duration_seconds: number;
  is_active: boolean;
  user_agent: string | null;
}

interface UserActivitySectionProps {
  userId: string;
}

export function UserActivitySection({ userId }: UserActivitySectionProps) {
  const [sessions, setSessions] = useState<ActivitySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllDialog, setShowAllDialog] = useState(false);
  const [stats, setStats] = useState({
    weekTotal: 0,
    monthTotal: 0,
    todayTotal: 0,
  });

  useEffect(() => {
    fetchSessions();
    
    // Subscribe to realtime updates for this user's sessions
    const channel = supabase
      .channel('user-activity-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_activity_sessions',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchSessions = async () => {
    try {
      // Fetch last 20 sessions
      const { data: sessionsData, error } = await supabase
        .from('user_activity_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setSessions(sessionsData || []);

      // Calculate statistics
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(startOfToday);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      let todayTotal = 0;
      let weekTotal = 0;
      let monthTotal = 0;

      (sessionsData || []).forEach((session: ActivitySession) => {
        const sessionStart = new Date(session.started_at);
        const duration = session.duration_seconds || 0;

        if (sessionStart >= startOfToday) {
          todayTotal += duration;
        }
        if (sessionStart >= startOfWeek) {
          weekTotal += duration;
        }
        if (sessionStart >= startOfMonth) {
          monthTotal += duration;
        }
      });

      setStats({ todayTotal, weekTotal, monthTotal });
    } catch (error) {
      console.error('Error fetching activity sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds} Sek`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} Min`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'gerade eben';
    if (diffMins < 60) return `vor ${diffMins} Min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `vor ${diffHours} Std`;
    const diffDays = Math.floor(diffHours / 24);
    return `vor ${diffDays} Tagen`;
  };

  const parseUserAgent = (ua: string | null): string => {
    if (!ua) return 'Unbekannt';
    
    let browser = 'Browser';
    let os = 'System';

    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';

    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'Mac';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('Linux')) os = 'Linux';

    return `${browser} / ${os}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Check if user is currently online
  const activeSession = sessions.find(s => s.is_active);
  const isOnline = activeSession && 
    new Date(activeSession.last_active_at).getTime() > Date.now() - 5 * 60 * 1000;

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Online-Aktivität
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Online-Aktivität
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Online Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}
            />
            <span className="text-foreground font-medium">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          {activeSession && (
            <span className="text-sm text-muted-foreground">
              Zuletzt aktiv: {formatTimeAgo(activeSession.last_active_at)}
            </span>
          )}
        </div>

        {/* Current Session */}
        {activeSession && isOnline && (
          <div className="flex items-center gap-2 p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
            <Clock className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700 dark:text-green-400">
              Aktuelle Session: {formatDuration(activeSession.duration_seconds)}
            </span>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <p className="text-xs text-muted-foreground">Heute</p>
            <p className="text-lg font-semibold text-foreground">{formatDuration(stats.todayTotal)}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <p className="text-xs text-muted-foreground">Diese Woche</p>
            <p className="text-lg font-semibold text-foreground">{formatDuration(stats.weekTotal)}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <p className="text-xs text-muted-foreground">Dieser Monat</p>
            <p className="text-lg font-semibold text-foreground">{formatDuration(stats.monthTotal)}</p>
          </div>
        </div>

        {/* Session History */}
        {sessions.length > 0 ? (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Datum
                    </div>
                  </TableHead>
                  <TableHead className="text-foreground">Zeitraum</TableHead>
                  <TableHead className="text-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Dauer
                    </div>
                  </TableHead>
                  <TableHead className="text-foreground">
                    <div className="flex items-center gap-1">
                      <Monitor className="h-3 w-3" />
                      Gerät
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.slice(0, 5).map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="text-muted-foreground">
                      {formatDate(session.started_at)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatTime(session.started_at)} - {session.ended_at ? formatTime(session.ended_at) : 'Aktiv'}
                    </TableCell>
                    <TableCell>
                      {session.is_active ? (
                        <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-300">
                          Aktiv
                        </Badge>
                      ) : (
                        <span className="text-foreground">{formatDuration(session.duration_seconds)}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {parseUserAgent(session.user_agent)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {sessions.length > 5 && (
              <div className="p-3 border-t border-border">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowAllDialog(true)}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Alle {sessions.length} Sessions anzeigen
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-muted-foreground">Noch keine Aktivitätsdaten vorhanden.</p>
          </div>
        )}

        <UserActivityDialog 
          userId={userId} 
          open={showAllDialog} 
          onOpenChange={setShowAllDialog} 
        />
      </CardContent>
    </Card>
  );
}
