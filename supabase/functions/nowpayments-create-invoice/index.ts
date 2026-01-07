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

    console.log('Creating payment for user:', user.id);

    const { amount, pay_currency } = await req.json();

    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // pay_currency is now REQUIRED
    if (!pay_currency) {
      return new Response(
        JSON.stringify({ error: 'pay_currency is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('NOWPAYMENTS_API_KEY');
    if (!apiKey) {
      console.error('NOWPAYMENTS_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Payment service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique order ID
    const orderId = `deposit_${user.id}_${Date.now()}`;

    // Create payment with NowPayments Payment API (NOT Invoice API)
    // This returns pay_address directly for internal display
    const paymentPayload = {
      price_amount: amount,
      price_currency: 'eur',
      pay_currency: pay_currency.toLowerCase(),
      order_id: orderId,
      order_description: `Krypto-Einzahlung: ${amount} EUR`,
      ipn_callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/nowpayments-webhook`,
    };

    console.log('Creating NowPayments payment:', paymentPayload);

    const paymentResponse = await fetch('https://api.nowpayments.io/v1/payment', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentPayload),
    });

    const paymentData = await paymentResponse.json();

    if (!paymentResponse.ok) {
      console.error('NowPayments API error:', paymentData);
      return new Response(
        JSON.stringify({ error: 'Failed to create payment', details: paymentData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('NowPayments payment created:', paymentData);

    // Use service role to insert deposit record
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Save deposit to database with all payment details
    const { data: deposit, error: depositError } = await supabaseAdmin
      .from('crypto_deposits')
      .insert({
        user_id: user.id,
        nowpayments_payment_id: String(paymentData.payment_id),
        price_amount: amount,
        price_currency: 'eur',
        pay_currency: pay_currency.toLowerCase(),
        pay_amount: paymentData.pay_amount,
        pay_address: paymentData.pay_address,
        expiration_estimate_date: paymentData.expiration_estimate_date,
        status: paymentData.payment_status || 'waiting',
      })
      .select()
      .single();

    if (depositError) {
      console.error('Error saving deposit:', depositError);
      return new Response(
        JSON.stringify({ error: 'Failed to save deposit record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Deposit record created:', deposit.id);

    // Return all payment details for internal display
    return new Response(
      JSON.stringify({
        success: true,
        deposit_id: deposit.id,
        payment_id: paymentData.payment_id,
        pay_address: paymentData.pay_address,
        pay_amount: paymentData.pay_amount,
        pay_currency: pay_currency.toLowerCase(),
        expiration_estimate_date: paymentData.expiration_estimate_date,
        payment_status: paymentData.payment_status,
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
