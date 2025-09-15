import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYMBOLS = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'LINK', 'XRP', 'LTC', 'BCH', 'BNB'];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🚀 Starting crypto price scheduler...');

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get API key from branding
    console.log('🔑 Fetching CoinMarketCap API key...');
    const { data: brandingData, error: brandingError } = await supabase
      .from('brandings')
      .select('coinmarketcap_api_key')
      .not('coinmarketcap_api_key', 'is', null)
      .limit(1)
      .single();

    if (brandingError || !brandingData?.coinmarketcap_api_key) {
      throw new Error('No CoinMarketCap API key found in branding configuration');
    }

    const apiKey = brandingData.coinmarketcap_api_key;
    console.log('✅ API key found');

    // Fetch data from CoinMarketCap
    console.log('📊 Fetching crypto data from CoinMarketCap...');
    const response = await fetch('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
      method: 'GET',
      headers: {
        'X-CMC_PRO_API_KEY': apiKey,
        'Accept': 'application/json',
      },
      params: new URLSearchParams({
        start: '1',
        limit: '10',
        convert: 'EUR'
      })
    });

    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Successfully fetched crypto data');

    // Format and save to database
    if (data?.data && Array.isArray(data.data)) {
      const formattedPrices = data.data.map((coin: any) => ({
        symbol: coin.symbol,
        price: coin.quote.EUR.price,
        change_24h: coin.quote.EUR.percent_change_24h,
        volume: coin.quote.EUR.volume_24h || 0
      }));

      console.log(`💾 Saving ${formattedPrices.length} crypto prices to database...`);

      // Insert prices into crypto_price_history
      const { error: insertError } = await supabase
        .from('crypto_price_history')
        .insert(formattedPrices);

      if (insertError) {
        console.error('❌ Database insert error:', insertError);
        throw insertError;
      }

      console.log('✅ Successfully saved crypto prices to database');

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Saved ${formattedPrices.length} crypto prices`,
          saved_count: formattedPrices.length 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    } else {
      throw new Error('Invalid data format from CoinMarketCap');
    }

  } catch (error) {
    console.error('❌ Crypto price scheduler error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});