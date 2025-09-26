import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'account' | 'trading' | 'general';
  admin_response?: string;
  admin_user_id?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface CreateTicketData {
  subject: string;
  message: string;
  category: 'technical' | 'account' | 'trading' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export function useSupportTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets((data || []) as SupportTicket[]);
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast({
        title: "Fehler",
        description: "Support-Tickets konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async (ticketData: CreateTicketData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('support_tickets')
        .insert([{ ...ticketData, user_id: user.id }]);

      if (error) throw error;

      toast({
        title: "Ticket erstellt",
        description: "Ihr Support-Ticket wurde erfolgreich erstellt.",
      });

      await loadTickets();
      return true;
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: "Fehler",
        description: "Ticket konnte nicht erstellt werden.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateTicketStatus = async (ticketId: string, status: SupportTicket['status'], adminResponse?: string) => {
    try {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      };
      
      if (adminResponse) {
        updateData.admin_response = adminResponse;
        updateData.admin_user_id = (await supabase.auth.getUser()).data.user?.id;
      }
      
      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: "Ticket aktualisiert",
        description: "Das Support-Ticket wurde erfolgreich aktualisiert.",
      });

      await loadTickets();
      return true;
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast({
        title: "Fehler",
        description: "Ticket konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    loadTickets();

    // Real-time updates
    const channel = supabase
      .channel('support_tickets_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets'
        },
        () => {
          loadTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    tickets,
    loading,
    createTicket,
    updateTicketStatus,
    refetch: loadTickets
  };
}