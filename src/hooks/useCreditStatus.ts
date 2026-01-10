import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CreditRequest {
  id: string;
  user_id: string;
  status: 'documents_pending' | 'documents_submitted' | 'ident_pending' | 'ident_submitted' | 'approved' | 'rejected';
  
  // Phase 1 - Documents
  bank_statements_paths: string[] | null;
  salary_slips_paths: string[] | null;
  health_insurance: string | null;
  tax_number: string | null;
  tax_id: string | null;
  documents_submitted_at: string | null;
  
  // Phase 2 - Ident
  partner_bank: string | null;
  credit_amount: number | null;
  contact_email: string | null;
  contact_phone: string | null;
  identcode: string | null;
  verification_link: string | null;
  sms_code: string | null;
  
  // User confirmation
  user_confirmed_at: string | null;
  
  // Review
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  
  created_at: string;
  updated_at: string;
}

export function useCreditStatus() {
  const [hasCreditRequest, setHasCreditRequest] = useState(false);
  const [creditStatus, setCreditStatus] = useState<CreditRequest['status'] | null>(null);
  const [creditRequest, setCreditRequest] = useState<CreditRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCreditStatus = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('credit_requests')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error loading credit status:', error);
        setLoading(false);
        return;
      }

      if (data) {
        setHasCreditRequest(true);
        setCreditStatus(data.status as CreditRequest['status']);
        setCreditRequest(data as CreditRequest);
      } else {
        setHasCreditRequest(false);
        setCreditStatus(null);
        setCreditRequest(null);
      }
    } catch (err) {
      console.error('Error in loadCreditStatus:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCreditStatus();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('credit_status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'credit_requests',
        },
        () => {
          loadCreditStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadCreditStatus]);

  const confirmIdentVerification = async () => {
    if (!creditRequest) return false;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { error } = await supabase
        .from('credit_requests')
        .update({
          status: 'ident_submitted',
          user_confirmed_at: new Date().toISOString(),
        })
        .eq('id', creditRequest.id);

      if (error) {
        console.error('Error confirming ident verification:', error);
        return false;
      }

      // Send Telegram notification
      try {
        await supabase.functions.invoke('send-telegram-notification', {
          body: {
            event_type: 'credit_ident_submitted',
            data: {
              user_id: session?.user?.id,
              partner_bank: creditRequest.partner_bank,
              credit_amount: creditRequest.credit_amount,
            }
          }
        });
      } catch (telegramError) {
        console.error('Telegram notification error:', telegramError);
      }

      await loadCreditStatus();
      return true;
    } catch (err) {
      console.error('Error in confirmIdentVerification:', err);
      return false;
    }
  };

  // Check if credit is approved
  const isCreditApproved = creditRequest?.status === 'approved';

  return {
    hasCreditRequest,
    creditStatus,
    creditRequest,
    loading,
    confirmIdentVerification,
    refetch: loadCreditStatus,
    isCreditApproved,
  };
}
