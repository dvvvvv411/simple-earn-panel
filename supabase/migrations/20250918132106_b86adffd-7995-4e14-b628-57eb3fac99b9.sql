-- Add entry_price and exit_price columns to bot_trades table
ALTER TABLE public.bot_trades 
ADD COLUMN entry_price numeric,
ADD COLUMN exit_price numeric;

-- Update existing records to set entry_price and exit_price based on trade_type
-- For LONG trades: entry_price = buy_price, exit_price = sell_price
-- For SHORT trades: entry_price = sell_price, exit_price = buy_price (fix the logic)
UPDATE public.bot_trades 
SET 
  entry_price = CASE 
    WHEN trade_type = 'LONG' THEN buy_price
    WHEN trade_type = 'SHORT' THEN sell_price
    ELSE buy_price
  END,
  exit_price = CASE 
    WHEN trade_type = 'LONG' THEN sell_price
    WHEN trade_type = 'SHORT' THEN buy_price
    ELSE sell_price
  END
WHERE entry_price IS NULL OR exit_price IS NULL;