import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CryptoDeposit {
  id: string;
  user_id: string;
  nowpayments_invoice_id: string | null;
  nowpayments_payment_id: string | null;
  price_amount: number;
  price_currency: string;
  pay_currency: string | null;
  pay_amount: number | null;
  pay_address: string | null;
  expiration_estimate_date: string | null;
  actually_paid: number | null;
  status: string;
  invoice_url: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface CreateDepositResult {
  success: boolean;
  deposit_id: string;
  payment_id: string;
  pay_address: string;
  pay_amount: number;
  pay_currency: string;
  expiration_estimate_date: string;
  payment_status: string;
}

export function useCryptoDeposits() {
  const [deposits, setDeposits] = useState<CryptoDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeposits = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setDeposits([]);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('crypto_deposits')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) {
        throw fetchError;
      }

      setDeposits(data as CryptoDeposit[] || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching deposits:', err);
      setError('Failed to fetch deposits');
    } finally {
      setLoading(false);
    }
  }, []);

  const createDeposit = async (amount: number, payCurrency: string): Promise<CreateDepositResult> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    const { data, error: invokeError } = await supabase.functions.invoke('nowpayments-create-invoice', {
      body: { amount, pay_currency: payCurrency },
    });

    if (invokeError) {
      throw invokeError;
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    // Refresh deposits list
    await fetchDeposits();

    return data as CreateDepositResult;
  };

  const checkStatus = async () => {
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('nowpayments-check-status');

      if (invokeError) {
        throw invokeError;
      }

      if (data?.deposits) {
        setDeposits(data.deposits as CryptoDeposit[]);
      }

      return data;
    } catch (err) {
      console.error('Error checking status:', err);
      throw err;
    }
  };

  const getPendingDeposits = useCallback(() => {
    return deposits.filter(d => 
      ['pending', 'waiting', 'confirming', 'confirmed', 'sending', 'partially_paid'].includes(d.status)
    );
  }, [deposits]);

  useEffect(() => {
    fetchDeposits();
  }, [fetchDeposits]);

  return {
    deposits,
    loading,
    error,
    fetchDeposits,
    createDeposit,
    checkStatus,
    getPendingDeposits,
  };
}
