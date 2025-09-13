import { supabase } from '@/integrations/supabase/client';

const COINMARKETCAP_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/coinmarketcap`;

export async function fetchCoinMarketCapData(endpoint: string, params: any) {
  const response = await fetch(`${COINMARKETCAP_FUNCTION_URL}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    throw new Error(`CoinMarketCap API error: ${response.status}`);
  }

  return response.json();
}