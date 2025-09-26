import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CryptoPriceData {
  symbol: string;
  price: number;
  change_24h?: number;
  volume?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('💾 Starting crypto price save operation...');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const { prices }: { prices: CryptoPriceData[] } = await req.json();

    if (!prices || !Array.isArray(prices)) {
      throw new Error('Invalid prices data provided');
    }

    console.log(`📊 Saving ${prices.length} crypto prices to database...`);

    // Prepare data for insertion
    const priceRecords = prices.map(price => ({
      symbol: price.symbol,
      price: price.price,
      change_24h: price.change_24h || null,
      volume: price.volume || null,
      timestamp: new Date().toISOString()
    }));

    // Insert price data into crypto_price_history table
    const { data, error } = await supabase
      .from('crypto_price_history')
      .insert(priceRecords);

    if (error) {
      console.error('❌ Failed to save crypto prices:', error);
      throw error;
    }

    console.log('✅ Successfully saved crypto prices to database');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Saved ${prices.length} crypto prices`,
        saved_count: prices.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('💥 Error in save-crypto-prices function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});