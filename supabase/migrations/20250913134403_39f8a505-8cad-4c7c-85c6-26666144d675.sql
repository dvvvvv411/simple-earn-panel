-- Add missing trading data columns to trading_bots table
ALTER TABLE public.trading_bots 
ADD COLUMN IF NOT EXISTS buy_price DECIMAL(20,8),
ADD COLUMN IF NOT EXISTS sell_price DECIMAL(20,8),
ADD COLUMN IF NOT EXISTS leverage INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS position_type TEXT DEFAULT 'LONG';