-- Create crypto_price_history table to store all API responses
CREATE TABLE public.crypto_price_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  price NUMERIC NOT NULL,
  change_24h NUMERIC,
  volume NUMERIC,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast queries by symbol and timestamp
CREATE INDEX idx_crypto_price_history_symbol_timestamp 
ON public.crypto_price_history (symbol, timestamp DESC);

-- Enable RLS
ALTER TABLE public.crypto_price_history ENABLE ROW LEVEL SECURITY;

-- Create policies for crypto price history
CREATE POLICY "Anyone can view crypto price history" 
ON public.crypto_price_history 
FOR SELECT 
USING (true);

CREATE POLICY "System can insert crypto price history" 
ON public.crypto_price_history 
FOR INSERT 
WITH CHECK (true);

-- Enable real-time for crypto price history
ALTER TABLE public.crypto_price_history REPLICA IDENTITY FULL;