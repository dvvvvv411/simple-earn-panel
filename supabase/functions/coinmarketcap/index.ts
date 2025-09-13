import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Initializing CoinMarketCap API handler...')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Fetching API key from Supabase vault...')
    // Get API key from secrets
    const { data: secrets, error: secretError } = await supabase
      .from('vault.decrypted_secrets')
      .select('decrypted_secret')
      .eq('name', 'COINMARKETCAP_API_KEY')
      .single()

    if (secretError) {
      console.error('Error fetching secret from vault:', secretError)
      throw new Error(`Failed to retrieve API key: ${secretError.message}`)
    }

    if (!secrets?.decrypted_secret) {
      console.error('No secret found with name COINMARKETCAP_API_KEY')
      throw new Error('CoinMarketCap API key not found in vault')
    }

    console.log('API key retrieved successfully')

    const apiKey = secrets.decrypted_secret
    const url = new URL(req.url)
    const pathname = url.pathname

    let cmcEndpoint = ''
    let requestBody: any = {}

    if (req.method === 'POST') {
      requestBody = await req.json()
    }

    // Route to different CMC endpoints
    if (pathname.includes('/listings')) {
      const { start = 1, limit = 10, convert = 'EUR' } = requestBody
      cmcEndpoint = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=${start}&limit=${limit}&convert=${convert}`
    } else if (pathname.includes('/quotes')) {
      const { symbol, convert = 'EUR' } = requestBody
      cmcEndpoint = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbol}&convert=${convert}`
    } else if (pathname.includes('/ohlcv')) {
      const { symbol, convert = 'EUR', count = 24, interval = 'hourly' } = requestBody
      cmcEndpoint = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/ohlcv/historical?symbol=${symbol}&convert=${convert}&count=${count}&interval=${interval}`
    } else {
      throw new Error('Invalid endpoint')
    }

    const response = await fetch(cmcEndpoint, {
      headers: {
        'X-CMC_PRO_API_KEY': apiKey,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.status}`)
    }

    const data = await response.json()

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})