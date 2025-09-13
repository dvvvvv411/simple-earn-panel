-- Create trading_bots table
CREATE TABLE public.trading_bots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cryptocurrency TEXT NOT NULL,
  symbol TEXT NOT NULL,
  start_amount DECIMAL(10,2) NOT NULL,
  current_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'stopped')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bot_trades table
CREATE TABLE public.bot_trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id UUID NOT NULL REFERENCES public.trading_bots(id) ON DELETE CASCADE,
  trade_type TEXT NOT NULL CHECK (trade_type IN ('long', 'short')),
  buy_price DECIMAL(12,4) NOT NULL,
  sell_price DECIMAL(12,4),
  leverage DECIMAL(4,2) NOT NULL DEFAULT 1.0,
  amount DECIMAL(10,2) NOT NULL,
  profit_amount DECIMAL(10,2),
  profit_percentage DECIMAL(5,2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.trading_bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_trades ENABLE ROW LEVEL SECURITY;

-- Create policies for trading_bots
CREATE POLICY "Users can view their own bots" 
ON public.trading_bots 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bots" 
ON public.trading_bots 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bots" 
ON public.trading_bots 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bots" 
ON public.trading_bots 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bots" 
ON public.trading_bots 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create policies for bot_trades
CREATE POLICY "Users can view trades for their bots" 
ON public.bot_trades 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.trading_bots 
  WHERE trading_bots.id = bot_trades.bot_id 
  AND trading_bots.user_id = auth.uid()
));

CREATE POLICY "System can create bot trades" 
ON public.bot_trades 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update bot trades" 
ON public.bot_trades 
FOR UPDATE 
USING (true);

CREATE POLICY "Admins can view all trades" 
ON public.bot_trades 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates on trading_bots
CREATE TRIGGER update_trading_bots_updated_at
BEFORE UPDATE ON public.trading_bots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_trading_bots_user_id ON public.trading_bots(user_id);
CREATE INDEX idx_trading_bots_status ON public.trading_bots(status);
CREATE INDEX idx_bot_trades_bot_id ON public.bot_trades(bot_id);
CREATE INDEX idx_bot_trades_status ON public.bot_trades(status);