-- Delete all active trading bots and their related trades
DELETE FROM bot_trades 
WHERE bot_id IN (
  SELECT id FROM trading_bots WHERE status = 'active'
);

-- Delete all active trading bots
DELETE FROM trading_bots 
WHERE status = 'active';