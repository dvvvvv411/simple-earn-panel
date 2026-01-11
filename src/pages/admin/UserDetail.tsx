import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, Plus, Save, Euro, Frown, Gift, Bot, ShieldCheck, 
  User as UserIcon, StickyNote, Trash2, ArrowLeft, Mail, Phone, 
  Calendar, Building2, CreditCard, FileText, Landmark, 
  MessageSquare, Copy, CheckCircle2, ClipboardList, Clock, 
  TrendingUp, Bitcoin, ExternalLink, SquareTerminal
} from "lucide-react";
import type { User, Transaction } from "@/types/user";
import { UserActivitySection } from "@/components/admin/UserActivitySection";
import { TaskEnrollmentDialog } from "@/components/admin/tasks/TaskEnrollmentDialog";
import { TaskAssignDialog } from "@/components/admin/tasks/TaskAssignDialog";
import { EurDepositDetailDialog } from "@/components/admin/EurDepositDetailDialog";
import { CreditDetailDialog } from "@/components/admin/CreditDetailDialog";
import { ManualBotCompleteDialog } from "@/components/admin/ManualBotCompleteDialog";

interface UserNote {
  id: string;
  user_id: string;
  admin_id: string;
  content: string;
  created_at: string;
  admin?: { first_name: string | null; last_name: string | null; email: string | null };
}

interface SupportTicket {
  id: string;
  subject: string;
  status: string;
  category: string;
  priority: string;
  created_at: string;
}

interface UserTask {
  id: string;
  status: string;
  created_at: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  template: {
    title: string;
    compensation: number;
  };
}

interface EurDepositRequest {
  id: string;
  user_id: string;
  partner_bank: string;
  verification_type: string;
  contact_email: string;
  contact_phone: string;
  identcode: string;
  sms_code: string | null;
  verification_link: string;
  status: string;
  user_confirmed_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  bank_account_holder?: string | null;
  bank_iban?: string | null;
  bank_bic?: string | null;
  bank_name?: string | null;
  profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
}

interface CreditRequest {
  id: string;
  user_id: string;
  status: string;
  bank_statements_paths: string[] | null;
  salary_slips_paths: string[] | null;
  health_insurance: string | null;
  tax_number: string | null;
  tax_id: string | null;
  documents_submitted_at: string | null;
  partner_bank: string | null;
  credit_amount: number | null;
  contact_email: string | null;
  contact_phone: string | null;
  identcode: string | null;
  verification_link: string | null;
  sms_code: string | null;
  user_confirmed_at: string | null;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
}

interface ActiveBot {
  id: string;
  user_id: string;
  cryptocurrency: string;
  symbol: string;
  start_amount: number;
  current_balance: number;
  status: string;
  position_type: string | null;
  leverage: number | null;
  created_at: string;
  expected_completion_time: string | null;
  profiles: {
    email: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  // User data state
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'crypto' | 'bank' | 'task' | 'bot'>('all');
  
  // Balance management
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceDescription, setBalanceDescription] = useState("");
  const [balanceOperation, setBalanceOperation] = useState<'add' | 'set'>('add');
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  
  // Bot bonus
  const [freeBotAmount, setFreeBotAmount] = useState("");
  const [freeBotOperation, setFreeBotOperation] = useState<'add' | 'set'>('add');
  const [freeBotLoading, setFreeBotLoading] = useState(false);
  const [currentFreeBots, setCurrentFreeBots] = useState(0);
  
  // Unlucky streak
  const [unluckyStreak, setUnluckyStreak] = useState(false);
  const [unluckyLoading, setUnluckyLoading] = useState(false);
  
  // KYC states
  const [kycRequired, setKycRequired] = useState(false);
  const [kycLoading, setKycLoading] = useState(false);
  const [kycStatus, setKycStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  
  // EUR Deposit (Bank-KYC)
  const [eurDepositStatus, setEurDepositStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [eurDepositRequest, setEurDepositRequest] = useState<EurDepositRequest | null>(null);
  const [eurDepositDialogOpen, setEurDepositDialogOpen] = useState(false);
  
  // Credit-KYC
  const [creditStatus, setCreditStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [creditRequest, setCreditRequest] = useState<CreditRequest | null>(null);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  
  // Active Bots
  const [userBots, setUserBots] = useState<ActiveBot[]>([]);
  const [loadingBots, setLoadingBots] = useState(false);
  const [selectedBot, setSelectedBot] = useState<ActiveBot | null>(null);
  const [botDialogOpen, setBotDialogOpen] = useState(false);
  
  // Tasks
  const [tasksEnabled, setTasksEnabled] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [userTasks, setUserTasks] = useState<UserTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [enrollmentDialogOpen, setEnrollmentDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  
  // Consultant
  const [consultants, setConsultants] = useState<{ id: string; name: string }[]>([]);
  const [selectedConsultantId, setSelectedConsultantId] = useState<string | null>(null);
  const [consultantLoading, setConsultantLoading] = useState(false);
  
  // Support tickets
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  
  // Notes
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const loadUserData = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Fetch user profile with branding and consultant
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          branding:brandings(id, name),
          consultant:consultants(id, name)
        `)
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Fetch user roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      const userData: User = {
        ...profileData,
        roles: rolesData?.map(r => ({ role: r.role })) || []
      };

      setUser(userData);
      setUnluckyStreak(userData.unlucky_streak ?? false);
      setCurrentFreeBots(userData.free_bots || 0);
      setSelectedConsultantId(userData.consultant_id || null);
      setKycRequired(userData.kyc_required ?? false);

      // Parallel fetch additional data
      await Promise.all([
        fetchTransactions(userId),
        fetchKycStatus(userId),
        fetchEurDepositStatus(userId),
        fetchCreditStatus(userId),
        fetchTaskEnrollment(userId),
        fetchUserTasks(userId),
        fetchConsultants(),
        fetchSupportTickets(userId),
        fetchNotes(userId),
        fetchUserBots(userId)
      ]);
    } catch (error: any) {
      console.error('Error loading user data:', error);
      toast({
        title: "Fehler",
        description: "Benutzerdaten konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (uid: string) => {
    setLoadingTransactions(true);
    try {
      const { data, error } = await supabase
        .from('user_transactions')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions((data || []) as Transaction[]);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const fetchKycStatus = async (uid: string) => {
    try {
      const { data } = await supabase
        .from('kyc_submissions')
        .select('status')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      setKycStatus((data?.status as any) ?? 'none');
    } catch (error) {
      console.error('Error fetching KYC status:', error);
    }
  };

  const fetchEurDepositStatus = async (uid: string) => {
    try {
      const { data } = await supabase
        .from('eur_deposit_requests')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      setEurDepositStatus((data?.status as any) ?? 'none');
      setEurDepositRequest(data as EurDepositRequest | null);
    } catch (error) {
      console.error('Error fetching EUR deposit status:', error);
    }
  };

  const fetchCreditStatus = async (uid: string) => {
    try {
      const { data } = await supabase
        .from('credit_requests')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      setCreditStatus((data?.status as any) ?? 'none');
      setCreditRequest(data as CreditRequest | null);
    } catch (error) {
      console.error('Error fetching credit status:', error);
    }
  };

  const fetchUserBots = async (uid: string) => {
    setLoadingBots(true);
    try {
      const { data, error } = await supabase
        .from('trading_bots')
        .select(`
          *,
          profiles!trading_bots_user_id_fkey(email, first_name, last_name)
        `)
        .eq('user_id', uid)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserBots((data || []) as unknown as ActiveBot[]);
    } catch (error) {
      console.error('Error fetching user bots:', error);
    } finally {
      setLoadingBots(false);
    }
  };

  const fetchTaskEnrollment = async (uid: string) => {
    try {
      const { data } = await supabase
        .from('user_task_enrollments')
        .select('is_active')
        .eq('user_id', uid)
        .maybeSingle();
      
      setTasksEnabled(data?.is_active ?? false);
    } catch (error) {
      console.error('Error fetching task enrollment:', error);
    }
  };

  const fetchUserTasks = async (uid: string) => {
    setLoadingTasks(true);
    try {
      const { data, error } = await supabase
        .from('user_tasks')
        .select(`
          id,
          status,
          created_at,
          submitted_at,
          reviewed_at,
          template:task_templates(title, compensation)
        `)
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserTasks((data || []) as unknown as UserTask[]);
    } catch (error) {
      console.error('Error fetching user tasks:', error);
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchConsultants = async () => {
    try {
      const { data, error } = await supabase
        .from('consultants')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setConsultants(data || []);
    } catch (error) {
      console.error('Error fetching consultants:', error);
    }
  };

  const fetchSupportTickets = async (uid: string) => {
    setLoadingTickets(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('id, subject, status, category, priority, created_at')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSupportTickets((data || []) as SupportTicket[]);
    } catch (error) {
      console.error('Error fetching support tickets:', error);
    } finally {
      setLoadingTickets(false);
    }
  };

  const fetchNotes = async (uid: string) => {
    setLoadingNotes(true);
    try {
      const { data, error } = await supabase
        .from('user_notes')
        .select('*, admin:profiles!user_notes_admin_id_fkey(first_name, last_name, email)')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes((data || []) as UserNote[]);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoadingNotes(false);
    }
  };

  // Handler functions
  const handleKycRequiredToggle = async (checked: boolean) => {
    if (!user) return;
    setKycLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ kyc_required: checked })
        .eq('id', user.id);
      if (error) throw error;
      setKycRequired(checked);
      toast({
        title: checked ? "KYC aktiviert" : "KYC deaktiviert",
        description: checked 
          ? "Nutzer muss jetzt KYC-Verifizierung durchführen." 
          : "KYC-Anforderung wurde entfernt.",
      });
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: "KYC-Status konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    } finally {
      setKycLoading(false);
    }
  };

  const handleUnluckyStreakToggle = async (checked: boolean) => {
    if (!user) return;
    setUnluckyLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ unlucky_streak: checked })
        .eq('id', user.id);

      if (error) throw error;
      setUnluckyStreak(checked);
      toast({
        title: checked ? "Pechsträhne aktiviert" : "Pechsträhne deaktiviert",
        description: checked 
          ? "Trading Bots werden jetzt Verluste erzeugen." 
          : "Trading Bots erzeugen wieder normale Gewinne.",
      });
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: "Pechsträhne konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    } finally {
      setUnluckyLoading(false);
    }
  };

  const handleConsultantChange = async (consultantId: string) => {
    if (!user) return;
    setConsultantLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ consultant_id: consultantId })
        .eq('id', user.id);

      if (error) throw error;
      setSelectedConsultantId(consultantId);
      toast({
        title: "Berater zugewiesen",
        description: "Berater wurde erfolgreich geändert.",
      });
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: "Berater konnte nicht geändert werden.",
        variant: "destructive",
      });
    } finally {
      setConsultantLoading(false);
    }
  };

  const handleBalanceUpdate = async () => {
    if (!user || !balanceAmount || !balanceDescription.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Felder aus.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(balanceAmount);
    if (isNaN(amount)) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen gültigen Betrag ein.",
        variant: "destructive",
      });
      return;
    }

    setIsBalanceLoading(true);
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error('Nicht authentifiziert');

      const finalAmount = balanceOperation === 'set' 
        ? amount - user.balance 
        : amount;

      const { error } = await supabase.rpc('update_user_balance', {
        target_user_id: user.id,
        amount_change: finalAmount,
        transaction_type: balanceOperation === 'set' ? 'adjustment' : (finalAmount >= 0 ? 'credit' : 'debit'),
        transaction_description: balanceDescription,
        admin_user_id: currentUser.data.user.id
      });

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: "Guthaben wurde erfolgreich aktualisiert.",
      });
      
      setBalanceAmount("");
      setBalanceDescription("");
      setBalanceOperation('add');
      loadUserData();
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message || "Guthaben konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    } finally {
      setIsBalanceLoading(false);
    }
  };

  const handleFreeBotUpdate = async () => {
    if (!user || !freeBotAmount) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie eine Anzahl ein.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseInt(freeBotAmount);
    if (isNaN(amount) || amount < 0) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie eine gültige Anzahl ein.",
        variant: "destructive",
      });
      return;
    }

    setFreeBotLoading(true);
    try {
      const { error } = await supabase.rpc('update_user_free_bots', {
        target_user_id: user.id,
        amount_change: amount,
        operation_type: freeBotOperation
      });

      if (error) throw error;

      const newFreeBots = freeBotOperation === 'add' 
        ? currentFreeBots + amount 
        : amount;
      setCurrentFreeBots(newFreeBots);

      toast({
        title: "Erfolg",
        description: freeBotOperation === 'add' 
          ? `${amount} Bonus-Bot(s) wurden hinzugefügt.`
          : `Bonus-Bots wurden auf ${amount} gesetzt.`,
      });
      
      setFreeBotAmount("");
      setFreeBotOperation('add');
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message || "Bonus-Bots konnten nicht aktualisiert werden.",
        variant: "destructive",
      });
    } finally {
      setFreeBotLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!user || !newNote.trim()) return;
    
    setAddingNote(true);
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error('Nicht authentifiziert');

      const { error } = await supabase
        .from('user_notes')
        .insert({
          user_id: user.id,
          admin_id: currentUser.data.user.id,
          content: newNote.trim()
        });

      if (error) throw error;

      toast({
        title: "Notiz hinzugefügt",
        description: "Die Notiz wurde erfolgreich gespeichert.",
      });
      
      setNewNote("");
      fetchNotes(user.id);
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: "Notiz konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    } finally {
      setAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('user_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      toast({
        title: "Notiz gelöscht",
        description: "Die Notiz wurde entfernt.",
      });
      
      setNotes(notes.filter(n => n.id !== noteId));
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: "Notiz konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  };

  const handleTaskEnrollmentToggle = async () => {
    if (!user) return;
    setTasksLoading(true);
    try {
      if (tasksEnabled) {
        // Deactivate
        const { error } = await supabase
          .from('user_task_enrollments')
          .update({ is_active: false, deactivated_at: new Date().toISOString() })
          .eq('user_id', user.id);
        if (error) throw error;
        setTasksEnabled(false);
        toast({ title: "Aufträge deaktiviert" });
      } else {
        // Check if enrollment exists
        const { data: existing } = await supabase
          .from('user_task_enrollments')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (existing) {
          // Reactivate
          const { error } = await supabase
            .from('user_task_enrollments')
            .update({ is_active: true, deactivated_at: null })
            .eq('user_id', user.id);
          if (error) throw error;
        } else {
          // Create new enrollment
          const currentUser = await supabase.auth.getUser();
          const { error } = await supabase
            .from('user_task_enrollments')
            .insert({
              user_id: user.id,
              is_active: true,
              enrolled_by: currentUser.data.user?.id
            });
          if (error) throw error;
        }
        setTasksEnabled(true);
        toast({ title: "Aufträge aktiviert" });
      }
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: "Auftrags-Status konnte nicht geändert werden.",
        variant: "destructive",
      });
    } finally {
      setTasksLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Kopiert", description: "In die Zwischenablage kopiert." });
  };

  // Helper functions
  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(balance);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-DE');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const getDisplayName = (u: User) => {
    if (u.first_name && u.last_name) return `${u.first_name} ${u.last_name}`;
    if (u.first_name) return u.first_name;
    if (u.last_name) return u.last_name;
    return u.email || 'Unbekannt';
  };

  const getUserRole = (u: User) => {
    if (!u.roles || u.roles.length === 0) return 'user';
    return u.roles[0].role;
  };

  const getAdminName = (note: UserNote) => {
    if (!note.admin) return 'Admin';
    if (note.admin.first_name && note.admin.last_name) {
      return `${note.admin.first_name} ${note.admin.last_name}`;
    }
    if (note.admin.first_name) return note.admin.first_name;
    if (note.admin.email) return note.admin.email.split('@')[0];
    return 'Admin';
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      none: { variant: 'outline', label: 'Nicht beantragt' },
      pending: { variant: 'secondary', label: 'In Prüfung' },
      submitted: { variant: 'secondary', label: 'Eingereicht' },
      approved: { variant: 'default', label: 'Genehmigt' },
      rejected: { variant: 'destructive', label: 'Abgelehnt' },
      activated: { variant: 'default', label: 'Aktiviert' }
    };
    const c = config[status] || config.none;
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const getTaskStatusBadge = (status: string) => {
    const config: Record<string, { className: string; label: string }> = {
      pending: { className: 'bg-gray-500', label: 'Ausstehend' },
      in_progress: { className: 'bg-blue-500', label: 'In Bearbeitung' },
      submitted: { className: 'bg-amber-500', label: 'Eingereicht' },
      approved: { className: 'bg-green-500', label: 'Genehmigt' },
      rejected: { className: 'bg-red-500', label: 'Abgelehnt' }
    };
    const c = config[status] || config.pending;
    return <Badge className={`${c.className} text-white`}>{c.label}</Badge>;
  };

  const getTicketStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      open: { variant: 'secondary', label: 'Offen' },
      in_progress: { variant: 'default', label: 'In Bearbeitung' },
      resolved: { variant: 'outline', label: 'Gelöst' },
      closed: { variant: 'outline', label: 'Geschlossen' }
    };
    const c = config[status] || { variant: 'outline' as const, label: status };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  // Filter transactions based on selected filter
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const desc = t.description.toLowerCase();
      switch (transactionFilter) {
        case 'all':
          // Bank- und Krypto-Einzahlungen (keine Bot-Trades)
          return desc.includes('banküberweisung') || desc.includes('krypto-einzahlung');
        case 'bank':
          // NUR Bankeinzahlungen
          return desc.includes('banküberweisung');
        case 'crypto':
          // NUR Krypto-Einzahlungen (nicht Bot-Trades)
          return desc.includes('krypto-einzahlung');
        case 'task':
          // Auftragsvergütungen
          return desc.includes('auftragsvergütung');
        case 'bot':
          // Bot-Trades (Erstellung + Abschluss)
          return desc.includes('trading bot') || desc.includes('trading-bot');
        default:
          return true;
      }
    });
  }, [transactions, transactionFilter]);

  // Helper for bot runtime
  const getBotRuntime = (createdAt: string) => {
    const start = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Benutzerdaten werden geladen...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Benutzer nicht gefunden.</p>
        <Button onClick={() => navigate('/admin/benutzer')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück zur Übersicht
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/admin/benutzer')}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xl font-bold">
              {(user.first_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{getDisplayName(user)}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>{user.email}</span>
                <Badge 
                  variant={getUserRole(user) === 'admin' ? 'default' : 'outline'}
                  className="text-xs"
                >
                  {getUserRole(user) === 'admin' ? 'Admin' : 'Benutzer'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-sm text-muted-foreground">Aktuelles Guthaben</p>
          <p className={`text-2xl font-bold ${user.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatBalance(user.balance)}
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - User Info & Management */}
        <div className="space-y-6">
          {/* User Information Card */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserIcon className="h-5 w-5 text-primary" />
                Benutzerinformationen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">E-Mail</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium text-foreground">{user.email || '-'}</span>
                    {user.email && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(user.email!)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">Telefon</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium text-foreground">{user.phone || '-'}</span>
                    {user.phone && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(user.phone!)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span className="text-sm">Branding</span>
                  </div>
                  <Badge variant="secondary">
                    {user.branding?.name || 'Kein Branding'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Registriert</span>
                  </div>
                  <span className="text-sm text-foreground">{formatDate(user.created_at)}</span>
                </div>
              </div>

              <Separator />

              {/* Consultant Assignment */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Zugewiesener Berater</Label>
                <Select 
                  value={selectedConsultantId || ''} 
                  onValueChange={handleConsultantChange}
                  disabled={consultantLoading}
                >
                  <SelectTrigger className="bg-background">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Kein Berater" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {consultants.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Verifications Card */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5 text-blue-500" />
                Verifizierungen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* KYC */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <p className="font-medium text-foreground">KYC Verifizierung</p>
                  <p className="text-xs text-muted-foreground">Identitätsprüfung</p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(kycStatus)}
                  {kycStatus !== 'approved' && (
                    <Switch 
                      checked={kycRequired}
                      onCheckedChange={handleKycRequiredToggle}
                      disabled={kycLoading}
                    />
                  )}
                </div>
              </div>

              {/* Bank-KYC (EUR Deposit) */}
              <div 
                className={`flex items-center justify-between p-3 rounded-lg bg-muted/30 ${eurDepositStatus !== 'none' ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}`}
                onClick={() => {
                  if (eurDepositRequest && eurDepositStatus !== 'none') {
                    setEurDepositDialogOpen(true);
                  }
                }}
              >
                <div>
                  <p className="font-medium text-foreground">Bank-KYC</p>
                  <p className="text-xs text-muted-foreground">EUR-Einzahlungen</p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(eurDepositStatus)}
                  {eurDepositStatus !== 'none' && (
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Credit-KYC */}
              <div 
                className={`flex items-center justify-between p-3 rounded-lg bg-muted/30 ${creditStatus !== 'none' ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}`}
                onClick={() => {
                  if (creditRequest && creditStatus !== 'none') {
                    setCreditDialogOpen(true);
                  }
                }}
              >
                <div>
                  <p className="font-medium text-foreground">Kredit-KYC</p>
                  <p className="text-xs text-muted-foreground">Kreditantrag</p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(creditStatus)}
                  {creditStatus !== 'none' && (
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pechsträhne & Bot Bonus */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bot className="h-5 w-5 text-amber-500" />
                Trading Einstellungen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pechsträhne */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                <div className="flex items-center gap-2">
                  <Frown className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium text-foreground">Pechsträhne</p>
                    <p className="text-xs text-muted-foreground">Bots erzeugen Verluste</p>
                  </div>
                </div>
                <Switch 
                  checked={unluckyStreak}
                  onCheckedChange={handleUnluckyStreakToggle}
                  disabled={unluckyLoading}
                  className="data-[state=checked]:bg-red-500"
                />
              </div>

              {/* Bot Bonus */}
              <div className="p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-900">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-amber-500" />
                    <span className="font-medium text-foreground">Bonus-Bots</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(currentFreeBots, 3) }).map((_, i) => (
                      <div 
                        key={i} 
                        className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center"
                      >
                        <Bot className="w-3 h-3 text-white" />
                      </div>
                    ))}
                    <span className="font-bold text-amber-600 ml-1">{currentFreeBots}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    placeholder="Anzahl"
                    value={freeBotAmount}
                    onChange={(e) => setFreeBotAmount(e.target.value)}
                    className="flex-1 h-8 bg-background"
                  />
                  <Button
                    size="sm"
                    variant={freeBotOperation === 'add' ? 'default' : 'outline'}
                    onClick={() => setFreeBotOperation('add')}
                    className="h-8"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant={freeBotOperation === 'set' ? 'default' : 'outline'}
                    onClick={() => setFreeBotOperation('set')}
                    className="h-8"
                  >
                    <Save className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleFreeBotUpdate}
                    disabled={freeBotLoading || !freeBotAmount}
                    className="h-8 bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    {freeBotLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Column - Management & Tasks */}
        <div className="space-y-6">
          {/* Balance Management */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Euro className="h-5 w-5 text-green-500" />
                Guthaben-Verwaltung
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg border border-green-200 dark:border-green-900">
                <p className="text-sm text-muted-foreground">Aktuelles Guthaben</p>
                <p className={`text-3xl font-bold ${user.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatBalance(user.balance)}
                </p>
              </div>
              
              <div className="space-y-3">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Betrag (€)"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  className="bg-background"
                />
                <Textarea
                  placeholder="Beschreibung..."
                  value={balanceDescription}
                  onChange={(e) => setBalanceDescription(e.target.value)}
                  className="bg-background min-h-[60px]"
                />
                <div className="flex gap-2">
                  <Button
                    variant={balanceOperation === 'add' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setBalanceOperation('add')}
                    className="flex-1"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Hinzufügen
                  </Button>
                  <Button
                    variant={balanceOperation === 'set' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setBalanceOperation('set')}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Setzen
                  </Button>
                </div>
                <Button
                  onClick={handleBalanceUpdate}
                  disabled={isBalanceLoading || !balanceAmount || !balanceDescription.trim()}
                  className="w-full"
                >
                  {isBalanceLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Guthaben aktualisieren
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tasks Section */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardList className="h-5 w-5 text-purple-500" />
                Aufträge
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tasks Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <p className="font-medium text-foreground">Aufträge aktiviert</p>
                  <p className="text-xs text-muted-foreground">Nutzer kann Aufträge bearbeiten</p>
                </div>
                <Switch 
                  checked={tasksEnabled}
                  onCheckedChange={handleTaskEnrollmentToggle}
                  disabled={tasksLoading}
                />
              </div>

              {/* Assign Task Button */}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setAssignDialogOpen(true)}
                disabled={!tasksEnabled}
              >
                <Plus className="h-4 w-4 mr-2" />
                Auftrag zuweisen
              </Button>

              {/* Task History */}
              {loadingTasks ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : userTasks.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-4">
                  Keine Aufträge vorhanden.
                </p>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {userTasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-2 rounded bg-muted/30 text-sm">
                      <div>
                        <p className="font-medium text-foreground">{task.template.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatBalance(task.template.compensation)} • {formatDate(task.created_at)}
                        </p>
                      </div>
                      {getTaskStatusBadge(task.status)}
                    </div>
                  ))}
                  {userTasks.length > 5 && (
                    <p className="text-center text-xs text-muted-foreground">
                      + {userTasks.length - 5} weitere Aufträge
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Support Tickets */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                Support Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTickets ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : supportTickets.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-4">
                  Keine Support-Tickets vorhanden.
                </p>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {supportTickets.slice(0, 5).map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-2 rounded bg-muted/30 text-sm">
                      <div>
                        <p className="font-medium text-foreground line-clamp-1">{ticket.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {ticket.category} • {formatDate(ticket.created_at)}
                        </p>
                      </div>
                      {getTicketStatusBadge(ticket.status)}
                    </div>
                  ))}
                  {supportTickets.length > 5 && (
                    <Button 
                      variant="link" 
                      className="w-full text-xs"
                      onClick={() => navigate('/admin/support')}
                    >
                      Alle {supportTickets.length} Tickets anzeigen
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Bots Section */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <SquareTerminal className="h-5 w-5 text-green-500" />
                Aktive Bots ({userBots.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingBots ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : userBots.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-4">
                  Keine aktiven Bots vorhanden.
                </p>
              ) : (
                <div className="space-y-3">
                  {userBots.map((bot) => (
                    <div key={bot.id} className="p-3 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Bitcoin className="h-4 w-4 text-amber-500" />
                          <span className="font-medium text-foreground">{bot.cryptocurrency}</span>
                          <Badge variant="outline" className="text-xs">{bot.symbol}</Badge>
                        </div>
                        <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                          Aktiv
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                        <div>
                          <span className="text-muted-foreground">Startbetrag:</span>
                          <p className="font-medium text-foreground">{formatBalance(bot.start_amount)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Laufzeit:</span>
                          <p className="font-medium text-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {getBotRuntime(bot.created_at)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                        onClick={() => {
                          setSelectedBot(bot);
                          setBotDialogOpen(true);
                        }}
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Manuell Beenden
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Activity, Transactions, Notes */}
        <div className="space-y-6">
          {/* Activity Section */}
          <UserActivitySection userId={user.id} />

          {/* Admin Notes */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <StickyNote className="h-5 w-5 text-yellow-500" />
                Admin-Notizen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Notiz hinzufügen..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="bg-background min-h-[60px]"
                />
              </div>
              <Button
                onClick={handleAddNote}
                disabled={addingNote || !newNote.trim()}
                size="sm"
                className="w-full"
              >
                {addingNote ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Notiz hinzufügen
              </Button>

              {loadingNotes ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : notes.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-4">
                  Keine Notizen vorhanden.
                </p>
              ) : (
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2 pr-4">
                    {notes.map((note) => (
                      <div 
                        key={note.id} 
                        className="p-3 rounded-lg bg-muted/30 border border-border group"
                      >
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {note.content}
                        </p>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(note.created_at)} – {getAdminName(note)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Full Width Transaction History */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              Transaktionsverlauf
            </CardTitle>
            <Tabs value={transactionFilter} onValueChange={(v) => setTransactionFilter(v as any)}>
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-xs h-7">Alle</TabsTrigger>
                <TabsTrigger value="bank" className="text-xs h-7">Bank</TabsTrigger>
                <TabsTrigger value="crypto" className="text-xs h-7">Krypto</TabsTrigger>
                <TabsTrigger value="task" className="text-xs h-7">Aufträge</TabsTrigger>
                <TabsTrigger value="bot" className="text-xs h-7">Bot Trades</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {loadingTransactions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Keine Transaktionen vorhanden.</p>
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Betrag</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Beschreibung</TableHead>
                    <TableHead className="text-right">Neuer Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.slice(0, 20).map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(transaction.created_at)}
                      </TableCell>
                      <TableCell className={`font-medium ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.amount >= 0 ? '+' : ''}{formatBalance(transaction.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {transaction.type === 'credit' ? 'Gutschrift' : 
                           transaction.type === 'debit' ? 'Belastung' : 'Anpassung'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-foreground max-w-xs truncate">
                        {transaction.description}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${transaction.new_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatBalance(transaction.new_balance)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredTransactions.length > 20 && (
                <div className="p-3 text-center border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Zeige 20 von {filteredTransactions.length} Transaktionen
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {user && (
        <TaskAssignDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          userId={user.id}
          onSuccess={() => fetchUserTasks(user.id)}
        />
      )}

      {/* EUR Deposit Detail Dialog */}
      {eurDepositRequest && (
        <EurDepositDetailDialog
          request={eurDepositRequest}
          open={eurDepositDialogOpen}
          onOpenChange={setEurDepositDialogOpen}
          onSuccess={() => {
            if (userId) {
              fetchEurDepositStatus(userId);
            }
          }}
        />
      )}

      {/* Credit Detail Dialog */}
      {creditRequest && (
        <CreditDetailDialog
          request={creditRequest}
          open={creditDialogOpen}
          onOpenChange={setCreditDialogOpen}
          onSuccess={() => {
            if (userId) {
              fetchCreditStatus(userId);
            }
          }}
        />
      )}

      {/* Manual Bot Complete Dialog */}
      <ManualBotCompleteDialog
        bot={selectedBot}
        open={botDialogOpen}
        onOpenChange={setBotDialogOpen}
        onSuccess={() => {
          setBotDialogOpen(false);
          setSelectedBot(null);
          if (userId) {
            fetchUserBots(userId);
            loadUserData();
          }
        }}
      />
    </div>
  );
}
