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

    // Get the authorization header to determine the user
    const authHeader = req.headers.get('Authorization')
    let apiKey = null

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      
      // Get user from token
      const { data: userData } = await supabase.auth.getUser(token)
      
      if (userData.user) {
        console.log('Fetching API key from user branding...')
        
        // First get user's profile to get branding_id
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('branding_id')
          .eq('id', userData.user.id)
          .single()

        if (profileError) {
          console.error('Error fetching user profile:', profileError)
        } else if (profile?.branding_id) {
          console.log('User branding_id found:', profile.branding_id)
          
          // Then get the branding with API key
          const { data: branding, error: brandingError } = await supabase
            .from('brandings')
            .select('coinmarketcap_api_key')
            .eq('id', profile.branding_id)
            .single()

          if (brandingError) {
            console.error('Error fetching branding:', brandingError)
          } else if (branding?.coinmarketcap_api_key) {
            apiKey = branding.coinmarketcap_api_key
            console.log('API key found in user branding')
          } else {
            console.log('No API key found in user branding')
          }
        } else {
          console.log('User has no branding_id set')
        }
      }
    }

    // Fallback: try to get from first branding that has an API key
    if (!apiKey) {
      console.log('No user-specific API key found, checking for any available branding API key...')
      
      const { data: branding } = await supabase
        .from('brandings')
        .select('coinmarketcap_api_key')
        .not('coinmarketcap_api_key', 'is', null)
        .limit(1)
        .single()

      if (branding?.coinmarketcap_api_key) {
        apiKey = branding.coinmarketcap_api_key
        console.log('Fallback API key found in branding')
      }
    }

    if (!apiKey) {
      console.error('No CoinMarketCap API key found in any branding')
      throw new Error('CoinMarketCap API key not configured')
    }
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