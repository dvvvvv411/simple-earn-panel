-- Create ranking_tiers table
CREATE TABLE public.ranking_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  min_balance NUMERIC(12,2) NOT NULL,
  max_balance NUMERIC(12,2) NOT NULL,
  daily_trades INTEGER NOT NULL DEFAULT 0,
  icon_name TEXT NOT NULL,
  gradient_from TEXT NOT NULL,
  gradient_to TEXT NOT NULL,
  text_color TEXT NOT NULL,
  border_color TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add current_ranking_id to profiles table
ALTER TABLE public.profiles 
ADD COLUMN current_ranking_id UUID REFERENCES public.ranking_tiers(id);

-- Enable RLS on ranking_tiers
ALTER TABLE public.ranking_tiers ENABLE ROW LEVEL SECURITY;

-- RLS policies for ranking_tiers
CREATE POLICY "Anyone can view ranking tiers" 
ON public.ranking_tiers 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage ranking tiers" 
ON public.ranking_tiers 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert ranking tiers data with updated structure
INSERT INTO public.ranking_tiers (name, min_balance, max_balance, daily_trades, icon_name, gradient_from, gradient_to, text_color, border_color, sort_order) VALUES
('New', 0.00, 199.99, 0, 'UserPlus', 'hsl(0 0% 60%)', 'hsl(0 0% 80%)', 'text-muted-foreground', 'border-muted', 1),
('Starter', 200.00, 999.99, 1, 'Rocket', 'hsl(142 76% 36%)', 'hsl(142 84% 47%)', 'text-emerald-700', 'border-emerald-300', 2),
('Trader', 1000.00, 4999.99, 2, 'TrendingUp', 'hsl(217 91% 60%)', 'hsl(221 83% 53%)', 'text-blue-700', 'border-blue-300', 3),
('Pro-Trader', 5000.00, 9999.99, 4, 'Target', 'hsl(262 83% 58%)', 'hsl(270 95% 75%)', 'text-purple-700', 'border-purple-300', 4),
('Expert', 10000.00, 49999.99, 6, 'Crown', 'hsl(35 91% 62%)', 'hsl(32 95% 44%)', 'text-amber-700', 'border-amber-300', 5),
('Elite', 50000.00, 99999.99, 8, 'Zap', 'hsl(346 87% 43%)', 'hsl(351 95% 71%)', 'text-rose-700', 'border-rose-300', 6),
('VIP', 100000.00, 99999999.99, 10, 'Gem', 'hsl(200 98% 39%)', 'hsl(195 100% 50%)', 'text-cyan-700', 'border-cyan-300', 7);

-- Function to calculate user ranking based on total wealth
CREATE OR REPLACE FUNCTION public.calculate_user_ranking(user_balance NUMERIC, bot_investments NUMERIC DEFAULT 0)
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT id 
  FROM public.ranking_tiers 
  WHERE (user_balance + bot_investments) >= min_balance 
    AND (user_balance + bot_investments) <= max_balance
  ORDER BY sort_order DESC
  LIMIT 1;
$$;

-- Function to update user ranking
CREATE OR REPLACE FUNCTION public.update_user_ranking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_investments NUMERIC DEFAULT 0;
  new_ranking_id UUID;
BEGIN
  -- Calculate total bot investments for the user
  SELECT COALESCE(SUM(start_amount), 0) INTO total_investments
  FROM trading_bots 
  WHERE user_id = NEW.id AND status = 'active';
  
  -- Calculate new ranking
  SELECT calculate_user_ranking(NEW.balance, total_investments) INTO new_ranking_id;
  
  -- Update user ranking if it changed
  IF new_ranking_id IS DISTINCT FROM NEW.current_ranking_id THEN
    NEW.current_ranking_id = new_ranking_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to automatically update user ranking when balance changes
CREATE TRIGGER update_user_ranking_on_balance_change
  BEFORE UPDATE OF balance ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_ranking();

-- Function to initialize existing users' rankings
CREATE OR REPLACE FUNCTION public.initialize_user_rankings()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_record RECORD;
  total_investments NUMERIC;
  ranking_id UUID;
BEGIN
  FOR user_record IN 
    SELECT id, balance FROM public.profiles WHERE current_ranking_id IS NULL
  LOOP
    -- Calculate total investments for this user
    SELECT COALESCE(SUM(start_amount), 0) INTO total_investments
    FROM trading_bots 
    WHERE user_id = user_record.id AND status = 'active';
    
    -- Get appropriate ranking
    SELECT calculate_user_ranking(user_record.balance, total_investments) INTO ranking_id;
    
    -- Update user ranking
    UPDATE public.profiles 
    SET current_ranking_id = ranking_id 
    WHERE id = user_record.id;
  END LOOP;
END;
$$;

-- Initialize rankings for existing users
SELECT public.initialize_user_rankings();

-- Add trigger for updated_at on ranking_tiers
CREATE TRIGGER update_ranking_tiers_updated_at
  BEFORE UPDATE ON public.ranking_tiers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();