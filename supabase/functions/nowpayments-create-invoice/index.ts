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

    console.log('Creating invoice for user:', user.id);

    const { amount, pay_currency } = await req.json();

    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
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

    // Create invoice with NowPayments
    const invoicePayload: Record<string, unknown> = {
      price_amount: amount,
      price_currency: 'eur',
      order_id: orderId,
      order_description: `Krypto-Einzahlung: ${amount} EUR`,
      ipn_callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/nowpayments-webhook`,
      success_url: `${req.headers.get('origin') || 'https://lovable.dev'}/kryptotrading/wallet?deposit=success`,
      cancel_url: `${req.headers.get('origin') || 'https://lovable.dev'}/kryptotrading/wallet?deposit=cancelled`,
    };

    // Add pay_currency if specified
    if (pay_currency) {
      invoicePayload.pay_currency = pay_currency.toLowerCase();
    }

    console.log('Creating NowPayments invoice:', invoicePayload);

    const invoiceResponse = await fetch('https://api.nowpayments.io/v1/invoice', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoicePayload),
    });

    const invoiceData = await invoiceResponse.json();

    if (!invoiceResponse.ok) {
      console.error('NowPayments API error:', invoiceData);
      return new Response(
        JSON.stringify({ error: 'Failed to create payment invoice', details: invoiceData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('NowPayments invoice created:', invoiceData);

    // Use service role to insert deposit record
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Save deposit to database
    const { data: deposit, error: depositError } = await supabaseAdmin
      .from('crypto_deposits')
      .insert({
        user_id: user.id,
        nowpayments_invoice_id: invoiceData.id,
        price_amount: amount,
        price_currency: 'eur',
        pay_currency: pay_currency?.toLowerCase() || null,
        status: 'pending',
        invoice_url: invoiceData.invoice_url,
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

    return new Response(
      JSON.stringify({
        success: true,
        deposit_id: deposit.id,
        invoice_url: invoiceData.invoice_url,
        invoice_id: invoiceData.id,
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
