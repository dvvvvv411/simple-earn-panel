import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('NOWPAYMENTS_API_KEY');
    
    if (!apiKey) {
      console.error('NOWPAYMENTS_API_KEY not configured');
      throw new Error('Payment service not configured');
    }

    console.log('Fetching available currencies from NowPayments...');

    const response = await fetch('https://api.nowpayments.io/v1/currencies', {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NowPayments API error:', response.status, errorText);
      throw new Error(`Failed to fetch currencies: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Successfully fetched ${data.currencies?.length || 0} currencies`);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in nowpayments-currencies:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
