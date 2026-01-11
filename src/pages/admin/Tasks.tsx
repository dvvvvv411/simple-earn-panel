import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TaskTemplateManager } from "@/components/admin/tasks/TaskTemplateManager";
import { TaskUserList } from "@/components/admin/tasks/TaskUserList";
import { TaskEnrollmentDialog } from "@/components/admin/tasks/TaskEnrollmentDialog";

interface TaskStats {
  totalEnrolled: number;
  activeTasks: number;
  pendingReview: number;
  completed: number;
}

export default function Tasks() {
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [stats, setStats] = useState<TaskStats>({
    totalEnrolled: 0,
    activeTasks: 0,
    pendingReview: 0,
    completed: 0
  });

  const fetchStats = async () => {
    try {
      const [enrollments, tasks] = await Promise.all([
        supabase.from('user_task_enrollments').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('user_tasks').select('status')
      ]);

      const taskList = tasks.data || [];
      setStats({
        totalEnrolled: enrollments.count || 0,
        activeTasks: taskList.filter(t => t.status === 'pending' || t.status === 'in_progress').length,
        pendingReview: taskList.filter(t => t.status === 'submitted').length,
        completed: taskList.filter(t => t.status === 'approved').length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Aufträge</h1>
          <p className="text-muted-foreground">
            Verwalte das Geld-verdienen Programm für Nutzer
          </p>
        </div>
        <Button onClick={() => setEnrollDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Nutzer hinzufügen
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eingetragene Nutzer</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEnrolled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive Aufträge</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zu Überprüfen</CardTitle>
            <FileText className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReview}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abgeschlossen</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Nutzer & Aufträge</TabsTrigger>
          <TabsTrigger value="templates">Vorlagen verwalten</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <TaskUserList onRefresh={fetchStats} />
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <TaskTemplateManager />
        </TabsContent>
      </Tabs>

      <TaskEnrollmentDialog
        open={enrollDialogOpen}
        onOpenChange={setEnrollDialogOpen}
        onSuccess={() => {
          setEnrollDialogOpen(false);
          fetchStats();
        }}
      />
    </div>
  );
}
