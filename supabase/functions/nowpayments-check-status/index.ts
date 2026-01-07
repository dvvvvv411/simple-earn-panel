import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the user from the request
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Checking deposit status for user:', user.id);

    const apiKey = Deno.env.get('NOWPAYMENTS_API_KEY');
    if (!apiKey) {
      console.error('NOWPAYMENTS_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Payment service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get pending deposits for this user
    const { data: deposits, error: fetchError } = await supabaseClient
      .from('crypto_deposits')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['pending', 'waiting', 'confirming', 'confirmed', 'sending', 'partially_paid'])
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching deposits:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch deposits' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found pending deposits:', deposits?.length || 0);

    const updatedDeposits = [];

    for (const deposit of deposits || []) {
      if (!deposit.nowpayments_payment_id && !deposit.nowpayments_invoice_id) {
        continue;
      }

      try {
        // Check payment status via NowPayments API
        let statusData;
        
        if (deposit.nowpayments_payment_id) {
          // Check by payment ID
          const response = await fetch(
            `https://api.nowpayments.io/v1/payment/${deposit.nowpayments_payment_id}`,
            {
              headers: { 'x-api-key': apiKey },
            }
          );
          statusData = await response.json();
        } else {
          // For pending invoices, we can't check status via API directly
          // They need to wait for webhook or user action
          continue;
        }

        console.log('Payment status from API:', statusData);

        if (statusData.payment_status) {
          const statusMap: Record<string, string> = {
            'waiting': 'waiting',
            'confirming': 'confirming',
            'confirmed': 'confirmed',
            'sending': 'sending',
            'partially_paid': 'partially_paid',
            'finished': 'finished',
            'failed': 'failed',
            'refunded': 'refunded',
            'expired': 'expired',
          };

          const newStatus = statusMap[statusData.payment_status] || statusData.payment_status;

          if (newStatus !== deposit.status) {
            const updateData: Record<string, unknown> = {
              status: newStatus,
              pay_currency: statusData.pay_currency,
              pay_amount: statusData.pay_amount,
              actually_paid: statusData.actually_paid,
              updated_at: new Date().toISOString(),
            };

            if (statusData.payment_status === 'finished') {
              updateData.completed_at = new Date().toISOString();

              // Credit balance if finished
              if (deposit.status !== 'finished') {
                const { error: creditError } = await supabaseAdmin.rpc('credit_balance_from_bot', {
                  target_user_id: deposit.user_id,
                  amount: deposit.price_amount,
                  description: `Krypto-Einzahlung (${statusData.pay_currency?.toUpperCase() || 'CRYPTO'})`,
                });

                if (creditError) {
                  console.error('Error crediting balance:', creditError);
                }
              }
            }

            await supabaseAdmin
              .from('crypto_deposits')
              .update(updateData)
              .eq('id', deposit.id);

            updatedDeposits.push({ ...deposit, ...updateData });
          }
        }
      } catch (error) {
        console.error('Error checking deposit status:', deposit.id, error);
      }
    }

    // Fetch all deposits for return
    const { data: allDeposits } = await supabaseClient
      .from('crypto_deposits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    return new Response(
      JSON.stringify({
        success: true,
        deposits: allDeposits || [],
        updated_count: updatedDeposits.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
