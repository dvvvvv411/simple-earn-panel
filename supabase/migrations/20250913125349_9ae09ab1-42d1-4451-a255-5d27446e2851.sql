-- Enable realtime for trading_bots table
ALTER TABLE public.trading_bots REPLICA IDENTITY FULL;

-- Add trading_bots to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.trading_bots;