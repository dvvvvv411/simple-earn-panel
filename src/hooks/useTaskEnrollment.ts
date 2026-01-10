import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  compensation: number;
  logo_path: string | null;
}

interface UserTask {
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

export function useTaskEnrollment() {
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEnrollmentAndTasks = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      // Check enrollment
      const { data: enrollment } = await supabase
        .from('user_task_enrollments')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (enrollment) {
        setIsEnrolled(true);
        setIsActive(enrollment.is_active);

        // Fetch tasks with templates
        const { data: userTasks } = await supabase
          .from('user_tasks')
          .select(`
            *,
            template:task_templates(*)
          `)
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (userTasks) {
          setTasks(userTasks as unknown as UserTask[]);
        }
      } else {
        setIsEnrolled(false);
        setIsActive(false);
      }
    } catch (error) {
      console.error('Error fetching task enrollment:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollmentAndTasks();

    // Subscribe to changes
    const channel = supabase
      .channel('task-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_tasks' }, () => {
        fetchEnrollmentAndTasks();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_task_enrollments' }, () => {
        fetchEnrollmentAndTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const submittedTasks = tasks.filter(t => t.status === 'submitted');
  const completedTasks = tasks.filter(t => t.status === 'approved' || t.status === 'rejected');

  const submitTask = async (taskId: string) => {
    const { error } = await supabase
      .from('user_tasks')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (error) throw error;
    await fetchEnrollmentAndTasks();
  };

  const startTask = async (taskId: string) => {
    const { error } = await supabase
      .from('user_tasks')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (error) throw error;
    await fetchEnrollmentAndTasks();
  };

  return {
    isEnrolled,
    isActive,
    tasks,
    pendingTasks,
    submittedTasks,
    completedTasks,
    loading,
    submitTask,
    startTask,
    refetch: fetchEnrollmentAndTasks
  };
}
