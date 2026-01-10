import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BankDepositRequest {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  reference_code: string;
  user_confirmed_at: string | null;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useBankDeposits() {
  const [deposits, setDeposits] = useState<BankDepositRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDeposits = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('bank_deposit_requests')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading bank deposits:', error);
        setLoading(false);
        return;
      }

      setDeposits(data as BankDepositRequest[] || []);
    } catch (err) {
      console.error('Error in loadDeposits:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeposits();

    // Set up realtime subscription
    const channel = supabase
      .channel('bank_deposits_status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bank_deposit_requests',
        },
        () => {
          loadDeposits();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadDeposits]);

  const createDeposit = async (amount: number): Promise<BankDepositRequest | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      // Generate a unique reference code
      const referenceCode = `EINZ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const { data, error } = await supabase
        .from('bank_deposit_requests')
        .insert({
          user_id: session.user.id,
          amount,
          reference_code: referenceCode,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating bank deposit:', error);
        return null;
      }

      await loadDeposits();
      return data as BankDepositRequest;
    } catch (err) {
      console.error('Error in createDeposit:', err);
      return null;
    }
  };

  const confirmDeposit = async (depositId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('bank_deposit_requests')
        .update({
          user_confirmed_at: new Date().toISOString(),
        })
        .eq('id', depositId);

      if (error) {
        console.error('Error confirming deposit:', error);
        return false;
      }

      await loadDeposits();
      return true;
    } catch (err) {
      console.error('Error in confirmDeposit:', err);
      return false;
    }
  };

  const getPendingDeposits = () => deposits.filter(d => d.status === 'pending');
  
  const getConfirmedPendingDeposits = () => 
    deposits.filter(d => d.status === 'pending' && d.user_confirmed_at !== null);

  return {
    deposits,
    loading,
    createDeposit,
    confirmDeposit,
    getPendingDeposits,
    getConfirmedPendingDeposits,
    refetch: loadDeposits,
  };
}
