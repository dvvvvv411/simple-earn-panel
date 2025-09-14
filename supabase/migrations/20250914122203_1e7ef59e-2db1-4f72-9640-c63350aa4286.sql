-- Clean up unrealistic trades and reset affected bots
DELETE FROM bot_trades 
WHERE id IN (
  SELECT bt.id 
  FROM bot_trades bt
  JOIN trading_bots tb ON bt.bot_id = tb.id
  WHERE 
    ABS(bt.buy_price - 3953) / 3953 > 0.05 OR  -- ETH: Remove trades >5% from current price (3953 EUR)
    ABS(bt.sell_price - 3953) / 3953 > 0.05 OR
    ABS(bt.buy_price - 97800) / 97800 > 0.05 OR  -- BTC: Remove trades >5% from current price (97800 EUR)
    ABS(bt.sell_price - 97800) / 97800 > 0.05 OR
    ABS(bt.buy_price - 238) / 238 > 0.05 OR  -- SOL: Remove trades >5% from current price (238 EUR)
    ABS(bt.sell_price - 238) / 238 > 0.05 OR
    ABS(bt.buy_price - 0.41) / 0.41 > 0.05 OR  -- DOGE: Remove trades >5% from current price (0.41 EUR)
    ABS(bt.sell_price - 0.41) / 0.41 > 0.05 OR
    ABS(bt.buy_price - 1.08) / 1.08 > 0.05 OR  -- ADA: Remove trades >5% from current price (1.08 EUR)
    ABS(bt.sell_price - 1.08) / 1.08 > 0.05 OR
    ABS(bt.buy_price - 2.38) / 2.38 > 0.05 OR  -- XRP: Remove trades >5% from current price (2.38 EUR)
    ABS(bt.sell_price - 2.38) / 2.38 > 0.05
);

-- Reset affected trading bots to active status so they can be processed again with realistic prices
UPDATE trading_bots 
SET status = 'active', 
    current_balance = start_amount,
    buy_price = NULL,
    sell_price = NULL,
    leverage = NULL,
    position_type = NULL,
    updated_at = now()
WHERE status = 'completed' 
AND id NOT IN (
  SELECT DISTINCT bot_id 
  FROM bot_trades 
  WHERE status = 'completed'
);