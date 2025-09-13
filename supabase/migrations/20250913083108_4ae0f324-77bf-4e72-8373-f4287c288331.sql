-- Add CoinMarketCap API key column to brandings table
ALTER TABLE public.brandings 
ADD COLUMN coinmarketcap_api_key TEXT;