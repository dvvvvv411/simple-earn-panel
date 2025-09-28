-- Update VIP rank to have correct balance range and daily trades
UPDATE public.ranking_tiers 
SET max_balance = 500000.00, daily_trades = 10
WHERE name = 'VIP';

-- Add new ranking tier: Platinum (500k - 1M, 15 trades)
INSERT INTO public.ranking_tiers (
  name, 
  min_balance, 
  max_balance, 
  daily_trades, 
  icon_name, 
  gradient_from, 
  gradient_to, 
  text_color, 
  border_color, 
  sort_order
) VALUES (
  'Platinum',
  500000.00,
  1000000.00,
  15,
  'Star',
  '#94a3b8',
  '#64748b',
  '#475569',
  '#94a3b8',
  8
);

-- Add new ranking tier: Diamond (1M+, 20 trades)
INSERT INTO public.ranking_tiers (
  name, 
  min_balance, 
  max_balance, 
  daily_trades, 
  icon_name, 
  gradient_from, 
  gradient_to, 
  text_color, 
  border_color, 
  sort_order
) VALUES (
  'Diamond',
  1000000.00,
  99999999.99,
  20,
  'Gem',
  '#3b82f6',
  '#1d4ed8',
  '#1e40af',
  '#3b82f6',
  9
);