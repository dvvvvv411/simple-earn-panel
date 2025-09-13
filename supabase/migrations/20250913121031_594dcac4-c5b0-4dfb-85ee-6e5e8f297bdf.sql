-- Update the trading_bots status check constraint to include 'completed' and 'stopped'
ALTER TABLE public.trading_bots 
DROP CONSTRAINT IF EXISTS trading_bots_status_check;

ALTER TABLE public.trading_bots 
ADD CONSTRAINT trading_bots_status_check 
CHECK (status IN ('active', 'paused', 'stopped', 'completed'));