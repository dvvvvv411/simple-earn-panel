import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  btc_wallet_address: string;
  status: string;
  admin_note: string | null;
  processed_by: string | null;
  created_at: string;
  processed_at: string | null;
  user_email?: string;
  user_name?: string;
}

export function useWithdrawalRequests() {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserRequests = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRequests = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const userIds = [...new Set((data || []).map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]));
      
      const enrichedData = (data || []).map(request => {
        const profile = profileMap.get(request.user_id);
        return {
          ...request,
          user_email: profile?.email || 'Unbekannt',
          user_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unbekannt' : 'Unbekannt'
        };
      });

      setRequests(enrichedData);
    } catch (error) {
      console.error('Error fetching all withdrawal requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRequest = async (amount: number, btcWalletAddress: string): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      const { data: profile } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', session.user.id)
        .single();

      if (!profile || profile.balance < amount) {
        toast({ title: "Unzureichendes Guthaben", variant: "destructive" });
        return false;
      }

      const { error } = await supabase
        .from('withdrawal_requests')
        .insert({ user_id: session.user.id, amount, btc_wallet_address: btcWalletAddress });

      if (error) throw error;

      toast({ title: "Auszahlungsanfrage erstellt", description: "Ihre Anfrage wird geprüft." });
      await fetchUserRequests();
      return true;
    } catch (error) {
      toast({ title: "Fehler", variant: "destructive" });
      return false;
    }
  };

  const processRequest = async (requestId: string, status: 'approved' | 'rejected', adminNote?: string): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc('process_withdrawal_request', {
        request_id: requestId,
        new_status: status,
        admin_note_text: adminNote || null,
      });

      if (error) throw error;
      toast({ title: status === 'approved' ? "Genehmigt" : "Abgelehnt" });
      await fetchAllRequests();
      return true;
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
      return false;
    }
  };

  return { requests, loading, fetchUserRequests, fetchAllRequests, createRequest, processRequest };
}
