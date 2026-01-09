import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface KYCStatus {
  kycRequired: boolean;
  kycStatus: 'none' | 'pending' | 'approved' | 'rejected';
  loading: boolean;
}

export function useKYCStatus() {
  const [status, setStatus] = useState<KYCStatus>({
    kycRequired: false,
    kycStatus: 'none',
    loading: true
  });

  useEffect(() => {
    const checkKYCStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setStatus({ kycRequired: false, kycStatus: 'none', loading: false });
          return;
        }

        // Check if KYC is required for this user
        const { data: profile } = await supabase
          .from('profiles')
          .select('kyc_required')
          .eq('id', session.user.id)
          .single();

        if (!profile?.kyc_required) {
          setStatus({ kycRequired: false, kycStatus: 'none', loading: false });
          return;
        }

        // Check latest KYC submission status
        const { data: submission } = await supabase
          .from('kyc_submissions')
          .select('status')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        setStatus({
          kycRequired: true,
          kycStatus: submission?.status as KYCStatus['kycStatus'] || 'none',
          loading: false
        });
      } catch (error) {
        console.error('Error checking KYC status:', error);
        setStatus({ kycRequired: false, kycStatus: 'none', loading: false });
      }
    };

    checkKYCStatus();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('kyc_status_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kyc_submissions'
        },
        () => {
          checkKYCStatus();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          checkKYCStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return status;
}
