import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Calendar, Monitor } from "lucide-react";

interface ActivitySession {
  id: string;
  started_at: string;
  ended_at: string | null;
  last_active_at: string;
  duration_seconds: number | null;
  is_active: boolean;
  user_agent: string | null;
}

interface UserActivityDialogProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserActivityDialog({ userId, open, onOpenChange }: UserActivityDialogProps) {
  const [sessions, setSessions] = useState<ActivitySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [stats, setStats] = useState({ totalTime: 0, avgDuration: 0, sessionCount: 0 });

  useEffect(() => {
    if (open && userId) {
      fetchAllSessions();
    }
  }, [open, userId, filter]);

  const fetchAllSessions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('user_activity_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false });

      // Apply date filter
      const now = new Date();
      if (filter === "today") {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        query = query.gte('started_at', todayStart);
      } else if (filter === "week") {
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('started_at', weekStart);
      } else if (filter === "month") {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        query = query.gte('started_at', monthStart);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;

      setSessions(data || []);

      // Calculate stats
      const totalSeconds = (data || []).reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
      const completedSessions = (data || []).filter(s => s.duration_seconds && s.duration_seconds > 0);
      setStats({
        totalTime: totalSeconds,
        avgDuration: completedSessions.length > 0 ? totalSeconds / completedSessions.length : 0,
        sessionCount: (data || []).length
      });
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    if (!seconds || seconds < 60) return `${seconds || 0} Sek`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins} Min`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const parseUserAgent = (ua: string | null): string => {
    if (!ua) return 'Unbekannt';
    
    let browser = 'Unbekannt';
    let os = 'Unbekannt';
    
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';
    
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    
    return `${browser} / ${os}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Vollständige Online-Aktivität
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filter and Stats */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-foreground">{formatDuration(stats.totalTime)}</div>
                <div className="text-xs text-muted-foreground">Gesamtzeit</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-foreground">{formatDuration(Math.round(stats.avgDuration))}</div>
                <div className="text-xs text-muted-foreground">Ø Session</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-foreground">{stats.sessionCount}</div>
                <div className="text-xs text-muted-foreground">Sessions</div>
              </div>
            </div>

            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Zeitraum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="today">Heute</SelectItem>
                <SelectItem value="week">Diese Woche</SelectItem>
                <SelectItem value="month">Dieser Monat</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sessions Table */}
          <ScrollArea className="h-[400px] rounded-md border">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-muted-foreground">Lade Sessions...</div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-muted-foreground">Keine Sessions im ausgewählten Zeitraum</div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Zeitraum</TableHead>
                    <TableHead>Dauer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Gerät</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">
                        {formatDate(session.started_at)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatTime(session.started_at)} - {session.ended_at ? formatTime(session.ended_at) : 'Aktiv'}
                      </TableCell>
                      <TableCell>
                        {session.is_active ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                            Aktiv
                          </Badge>
                        ) : (
                          formatDuration(session.duration_seconds || 0)
                        )}
                      </TableCell>
                      <TableCell>
                        {session.is_active ? (
                          <Badge className="bg-green-500/20 text-green-400">Online</Badge>
                        ) : (
                          <Badge variant="secondary">Beendet</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Monitor className="h-3 w-3" />
                          {parseUserAgent(session.user_agent)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
