import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, MoreHorizontal, Plus, Ban, Eye, Key, Send, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TaskAssignDialog } from "./TaskAssignDialog";
import { TaskDetailDialog } from "./TaskDetailDialog";

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
  verification_code: string | null;
  template: TaskTemplate;
}

interface EnrolledUser {
  id: string;
  user_id: string;
  is_active: boolean;
  enrolled_at: string;
  profile: {
    email: string | null;
    first_name: string | null;
    last_name: string | null;
  };
  tasks: UserTask[];
}

interface PendingReviewTask {
  task: UserTask;
  userId: string;
  userName: string;
  userEmail: string | null;
}

interface TaskUserListProps {
  onRefresh: () => void;
}

export function TaskUserList({ onRefresh }: TaskUserListProps) {
  const [enrollments, setEnrollments] = useState<EnrolledUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<UserTask | null>(null);
  const [selectedTaskUserId, setSelectedTaskUserId] = useState<string | null>(null);
  const [editingCode, setEditingCode] = useState<{ taskId: string; code: string } | null>(null);
  const [editingPendingCode, setEditingPendingCode] = useState<{ taskId: string; code: string } | null>(null);

  const fetchEnrollments = async () => {
    try {
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('user_task_enrollments')
        .select(`
          id,
          user_id,
          is_active,
          enrolled_at,
          profile:profiles!user_task_enrollments_user_id_fkey(email, first_name, last_name)
        `)
        .order('enrolled_at', { ascending: false });

      if (enrollmentError) throw enrollmentError;

      // Fetch tasks for each enrollment
      const enrichedEnrollments = await Promise.all(
        (enrollmentData || []).map(async (enrollment) => {
          const { data: tasks } = await supabase
            .from('user_tasks')
            .select(`
              id,
              status,
              created_at,
              submitted_at,
              reviewed_at,
              verification_code,
              template:task_templates(id, title, description, compensation, logo_path)
            `)
            .eq('user_id', enrollment.user_id)
            .order('created_at', { ascending: false });

          return {
            ...enrollment,
            profile: enrollment.profile as unknown as { email: string | null; first_name: string | null; last_name: string | null },
            tasks: (tasks || []) as unknown as UserTask[]
          };
        })
      );

      setEnrollments(enrichedEnrollments);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedUsers(newExpanded);
  };

  const handleDeactivate = async (enrollmentId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('user_task_enrollments')
        .update({
          is_active: !isActive,
          deactivated_at: isActive ? new Date().toISOString() : null
        })
        .eq('id', enrollmentId);

      if (error) throw error;
      toast.success(isActive ? 'Nutzer deaktiviert' : 'Nutzer aktiviert');
      fetchEnrollments();
      onRefresh();
    } catch (error) {
      console.error('Error toggling enrollment:', error);
      toast.error('Fehler beim Aktualisieren');
    }
  };

  const handleAssignTask = (userId: string) => {
    setSelectedUserId(userId);
    setAssignDialogOpen(true);
  };

  const handleViewTask = (task: UserTask, userId: string) => {
    setSelectedTask(task);
    setSelectedTaskUserId(userId);
    setDetailDialogOpen(true);
  };

  const handleSaveCode = async (taskId: string, code: string) => {
    try {
      const { error } = await supabase
        .from('user_tasks')
        .update({ verification_code: code.trim() || null })
        .eq('id', taskId);

      if (error) throw error;
      toast.success('Code aktualisiert');
      setEditingCode(null);
      fetchEnrollments();
    } catch (error) {
      console.error('Error saving code:', error);
      toast.error('Fehler beim Speichern');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Offen</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500">In Bearbeitung</Badge>;
      case 'submitted':
        return <Badge className="bg-yellow-500">Zu Überprüfen</Badge>;
      case 'approved':
        return <Badge className="bg-green-500">Genehmigt</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Abgelehnt</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUserDisplayName = (profile: { email: string | null; first_name: string | null; last_name: string | null }) => {
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return profile.email || 'Unbekannt';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Alle zu überprüfenden Aufträge sammeln
  const pendingReviewTasks = useMemo((): PendingReviewTask[] => {
    return enrollments.flatMap(enrollment => 
      enrollment.tasks
        .filter(task => task.status === 'submitted')
        .map(task => ({
          task,
          userId: enrollment.user_id,
          userName: getUserDisplayName(enrollment.profile),
          userEmail: enrollment.profile.email
        }))
    );
  }, [enrollments]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Laden...
        </CardContent>
      </Card>
    );
  }

  if (enrollments.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Noch keine Nutzer für Aufträge freigeschaltet
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Zu überprüfende Aufträge Card */}
      <Card className="border-yellow-500/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-yellow-500" />
            Zu überprüfende Aufträge
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingReviewTasks.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Keine Aufträge zu überprüfen
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nutzer</TableHead>
                  <TableHead>Auftrag</TableHead>
                  <TableHead>Vergütung</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Eingereicht</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingReviewTasks.map((item) => (
                  <TableRow key={item.task.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.userName}</div>
                        <div className="text-sm text-muted-foreground">{item.userEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{item.task.template.title}</TableCell>
                    <TableCell>{formatCurrency(item.task.template.compensation)}</TableCell>
                    <TableCell>
                      {editingPendingCode?.taskId === item.task.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            value={editingPendingCode.code}
                            onChange={(e) => setEditingPendingCode({ taskId: item.task.id, code: e.target.value })}
                            className="h-8 w-24"
                            placeholder="Code..."
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveCode(item.task.id, editingPendingCode.code);
                                setEditingPendingCode(null);
                              }
                              if (e.key === 'Escape') setEditingPendingCode(null);
                            }}
                          />
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8"
                            onClick={() => {
                              handleSaveCode(item.task.id, editingPendingCode.code);
                              setEditingPendingCode(null);
                            }}
                          >
                            <Send className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          {item.task.verification_code ? (
                            <span className="font-mono text-sm">{item.task.verification_code}</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingPendingCode({ taskId: item.task.id, code: item.task.verification_code || '' });
                            }}
                          >
                            <Key className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.task.submitted_at 
                        ? new Date(item.task.submitted_at).toLocaleDateString('de-DE')
                        : '—'
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewTask(item.task, item.userId)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Eingetragene Nutzer Card */}
      <Card>
        <CardHeader>
          <CardTitle>Eingetragene Nutzer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {enrollments.map((enrollment) => (
            <Collapsible
              key={enrollment.id}
              open={expandedUsers.has(enrollment.id)}
              onOpenChange={() => toggleExpanded(enrollment.id)}
            >
              <div className="border rounded-lg">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50">
                    <div className="flex items-center gap-3">
                      {expandedUsers.has(enrollment.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <div>
                        <div className="font-medium">
                          {getUserDisplayName(enrollment.profile)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {enrollment.profile.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Badge variant={enrollment.is_active ? "default" : "secondary"}>
                          {enrollment.is_active ? 'Aktiv' : 'Deaktiviert'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {enrollment.tasks.length} Aufträge
                        </span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleAssignTask(enrollment.user_id)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Auftrag zuweisen
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeactivate(enrollment.id, enrollment.is_active)}>
                            <Ban className="mr-2 h-4 w-4" />
                            {enrollment.is_active ? 'Deaktivieren' : 'Aktivieren'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="border-t p-4">
                    {enrollment.tasks.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        Keine Aufträge zugewiesen
                        <Button
                          variant="link"
                          className="ml-2"
                          onClick={() => handleAssignTask(enrollment.user_id)}
                        >
                          Jetzt zuweisen
                        </Button>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Auftrag</TableHead>
                            <TableHead>Vergütung</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Erstellt</TableHead>
                            <TableHead className="text-right">Aktionen</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {enrollment.tasks.map((task) => (
                            <TableRow key={task.id}>
                              <TableCell className="font-medium">{task.template.title}</TableCell>
                              <TableCell>{formatCurrency(task.template.compensation)}</TableCell>
                              <TableCell>{getStatusBadge(task.status)}</TableCell>
                              <TableCell>
                                {editingCode?.taskId === task.id ? (
                                  <div className="flex items-center gap-1">
                                    <Input
                                      value={editingCode.code}
                                      onChange={(e) => setEditingCode({ taskId: task.id, code: e.target.value })}
                                      className="h-8 w-24"
                                      placeholder="Code..."
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveCode(task.id, editingCode.code);
                                        if (e.key === 'Escape') setEditingCode(null);
                                      }}
                                    />
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="h-8 w-8"
                                      onClick={() => handleSaveCode(task.id, editingCode.code)}
                                    >
                                      <Send className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    {task.verification_code ? (
                                      <span className="font-mono text-sm">{task.verification_code}</span>
                                    ) : (
                                      <span className="text-muted-foreground text-sm">—</span>
                                    )}
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="h-6 w-6"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingCode({ taskId: task.id, code: task.verification_code || '' });
                                      }}
                                    >
                                      <Key className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                {new Date(task.created_at).toLocaleDateString('de-DE')}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleViewTask(task, enrollment.user_id)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </CardContent>
      </Card>

      <TaskAssignDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        userId={selectedUserId}
        onSuccess={() => {
          setAssignDialogOpen(false);
          fetchEnrollments();
          onRefresh();
        }}
      />

      <TaskDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        task={selectedTask}
        userId={selectedTaskUserId}
        onSuccess={() => {
          setDetailDialogOpen(false);
          fetchEnrollments();
          onRefresh();
        }}
      />
    </div>
  );
}
