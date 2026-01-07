import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from 'https://deno.land/std@0.177.0/crypto/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-nowpayments-sig',
}

// Verify HMAC signature from NowPayments
async function verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign']
    );
    
    const data = encoder.encode(payload);
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, data);
    const signatureArray = new Uint8Array(signatureBuffer);
    const expectedSignature = Array.from(signatureArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return expectedSignature === signature.toLowerCase();
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

// Sort object keys for consistent hashing
function sortObject(obj: Record<string, unknown>): Record<string, unknown> {
  const sorted: Record<string, unknown> = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    const value = obj[key];
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      sorted[key] = sortObject(value as Record<string, unknown>);
    } else {
      sorted[key] = value;
    }
  }
  return sorted;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ipnSecret = Deno.env.get('NOWPAYMENTS_IPN_SECRET');
    if (!ipnSecret) {
      console.error('NOWPAYMENTS_IPN_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const signature = req.headers.get('x-nowpayments-sig');
    const rawBody = await req.text();
    
    console.log('Webhook received, signature present:', !!signature);
    console.log('Raw body:', rawBody);

    if (!signature) {
      console.error('Missing signature header');
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and sort the payload for signature verification
    const payload = JSON.parse(rawBody);
    const sortedPayload = sortObject(payload);
    const payloadString = JSON.stringify(sortedPayload);
    
    const isValid = await verifySignature(payloadString, signature, ipnSecret);
    
    if (!isValid) {
      console.error('Invalid signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Signature verified successfully');
    console.log('Payment data:', payload);

    const {
      invoice_id,
      payment_id,
      payment_status,
      pay_currency,
      pay_amount,
      actually_paid,
      price_amount,
      order_id,
    } = payload;

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find the deposit record
    const { data: deposit, error: findError } = await supabaseAdmin
      .from('crypto_deposits')
      .select('*')
      .eq('nowpayments_invoice_id', invoice_id.toString())
      .single();

    if (findError || !deposit) {
      console.error('Deposit not found:', findError, 'Invoice ID:', invoice_id);
      return new Response(
        JSON.stringify({ error: 'Deposit not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found deposit:', deposit.id, 'Current status:', deposit.status);

    // Map NowPayments status to our status
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

    const newStatus = statusMap[payment_status] || payment_status;

    // Update deposit record
    const updateData: Record<string, unknown> = {
      status: newStatus,
      nowpayments_payment_id: payment_id?.toString(),
      pay_currency: pay_currency,
      pay_amount: pay_amount,
      actually_paid: actually_paid,
      updated_at: new Date().toISOString(),
    };

    // If payment is finished, mark as completed
    if (payment_status === 'finished') {
      updateData.completed_at = new Date().toISOString();
    }

    const { error: updateError } = await supabaseAdmin
      .from('crypto_deposits')
      .update(updateData)
      .eq('id', deposit.id);

    if (updateError) {
      console.error('Error updating deposit:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update deposit' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Deposit updated with status:', newStatus);

    // If payment is finished and not already credited, credit the user's balance
    if (payment_status === 'finished' && deposit.status !== 'finished') {
      console.log('Payment finished, crediting user balance:', deposit.user_id, 'Amount:', price_amount);

      const { error: creditError } = await supabaseAdmin.rpc('credit_balance_from_bot', {
        target_user_id: deposit.user_id,
        amount: price_amount,
        description: `Krypto-Einzahlung (${pay_currency?.toUpperCase() || 'CRYPTO'})`,
      });

      if (creditError) {
        console.error('Error crediting balance:', creditError);
        // Don't fail the webhook, log for manual review
      } else {
        console.log('Balance credited successfully');
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
