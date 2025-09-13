-- Update existing bot to active status
UPDATE trading_bots SET status = 'active' WHERE status = 'stopped';