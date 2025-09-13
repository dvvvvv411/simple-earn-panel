-- Fix real-time events being blocked by RLS
-- Add policies that allow real-time system context to read data

-- Add policy for real-time to access trading_bots
CREATE POLICY "Enable real-time for trading_bots" 
ON public.trading_bots 
FOR SELECT 
USING (true);

-- Add policy for real-time to access bot_trades  
CREATE POLICY "Enable real-time for bot_trades"
ON public.bot_trades
FOR SELECT 
USING (true);

-- Add policy for real-time to access profiles
CREATE POLICY "Enable real-time for profiles"
ON public.profiles
FOR SELECT 
USING (true);