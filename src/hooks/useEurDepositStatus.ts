import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  user_confirmed_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export function useEurDepositStatus() {
  const [hasEurDepositRequest, setHasEurDepositRequest] = useState(false);
  const [eurDepositStatus, setEurDepositStatus] = useState<string | null>(null);
  const [eurDepositRequest, setEurDepositRequest] = useState<EurDepositRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEurDepositStatus();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('eur_deposit_status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'eur_deposit_requests',
        },
        () => {
          loadEurDepositStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadEurDepositStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('eur_deposit_requests')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error loading EUR deposit status:', error);
        setLoading(false);
        return;
      }

      if (data) {
        setHasEurDepositRequest(true);
        setEurDepositStatus(data.status);
        setEurDepositRequest(data as EurDepositRequest);
      } else {
        setHasEurDepositRequest(false);
        setEurDepositStatus(null);
        setEurDepositRequest(null);
      }
    } catch (err) {
      console.error('Error in loadEurDepositStatus:', err);
    } finally {
      setLoading(false);
    }
  };

  const confirmVerification = async () => {
    if (!eurDepositRequest) return false;

    try {
      const { error } = await supabase
        .from('eur_deposit_requests')
        .update({
          status: 'submitted',
          user_confirmed_at: new Date().toISOString(),
        })
        .eq('id', eurDepositRequest.id);

      if (error) {
        console.error('Error confirming verification:', error);
        return false;
      }

      await loadEurDepositStatus();
      return true;
    } catch (err) {
      console.error('Error in confirmVerification:', err);
      return false;
    }
  };

  return {
    hasEurDepositRequest,
    eurDepositStatus,
    eurDepositRequest,
    loading,
    confirmVerification,
    refetch: loadEurDepositStatus,
  };
}
