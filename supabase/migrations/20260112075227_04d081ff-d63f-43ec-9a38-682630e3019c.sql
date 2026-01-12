-- Create table to document earned streak bot rewards
CREATE TABLE public.streak_bot_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  streak_day INTEGER NOT NULL,
  reward_date DATE NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint: Only one reward per user per day
ALTER TABLE public.streak_bot_rewards 
ADD CONSTRAINT unique_user_reward_date UNIQUE (user_id, reward_date);

-- Enable RLS
ALTER TABLE public.streak_bot_rewards ENABLE ROW LEVEL SECURITY;

-- Users can view their own rewards
CREATE POLICY "Users can view own streak rewards" 
ON public.streak_bot_rewards FOR SELECT 
USING (auth.uid() = user_id);

-- Admins can view all rewards
CREATE POLICY "Admins can view all streak rewards" 
ON public.streak_bot_rewards FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can insert (via edge function)
CREATE POLICY "Service role can insert streak rewards"
ON public.streak_bot_rewards FOR INSERT
WITH CHECK (true);

-- Manually grant missing rewards for vogel@vogel.de (user_id: 037d9fad-c01e-45b5-894d-2e67bf1a9634)
-- They missed rewards on streak day 3 (2026-01-09) and day 6 (2026-01-12)
INSERT INTO public.streak_bot_rewards (user_id, streak_day, reward_date)
VALUES 
  ('037d9fad-c01e-45b5-894d-2e67bf1a9634', 3, '2026-01-09'),
  ('037d9fad-c01e-45b5-894d-2e67bf1a9634', 6, '2026-01-12');

-- Grant the 2 missing free bots
SELECT update_user_free_bots(
  '037d9fad-c01e-45b5-894d-2e67bf1a9634'::uuid,
  2,
  'add'
);