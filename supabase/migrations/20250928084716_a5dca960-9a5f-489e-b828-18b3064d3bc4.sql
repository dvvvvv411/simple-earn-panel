-- Add referral code to profiles table
ALTER TABLE public.profiles ADD COLUMN referral_code TEXT UNIQUE;

-- Create user_referrals table to track referral relationships
CREATE TABLE public.user_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'qualified', 'rewarded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  qualified_at TIMESTAMPTZ NULL,
  rewarded_at TIMESTAMPTZ NULL,
  UNIQUE(referred_id), -- Ein User kann nur einmal geworben werden
  UNIQUE(referrer_id, referred_id) -- Keine doppelten Referrals
);

-- Create referral_rewards table for reward history
CREATE TABLE public.referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID NOT NULL REFERENCES public.user_referrals(id) ON DELETE CASCADE,
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_amount DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  transaction_id UUID REFERENCES public.user_transactions(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_referrals
CREATE POLICY "Users can view their own referrals as referrer"
ON public.user_referrals
FOR SELECT
USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view their own referrals as referred"
ON public.user_referrals
FOR SELECT
USING (auth.uid() = referred_id);

CREATE POLICY "Admins can view all referrals"
ON public.user_referrals
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can create referrals"
ON public.user_referrals
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update referrals"
ON public.user_referrals
FOR UPDATE
USING (true);

-- RLS Policies for referral_rewards
CREATE POLICY "Users can view their own rewards as referrer"
ON public.referral_rewards
FOR SELECT
USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view their own rewards as referred"
ON public.referral_rewards
FOR SELECT
USING (auth.uid() = referred_id);

CREATE POLICY "Admins can view all rewards"
ON public.referral_rewards
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can create rewards"
ON public.referral_rewards
FOR INSERT
WITH CHECK (true);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = code) INTO code_exists;
    
    -- Exit loop if code is unique
    IF NOT code_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Function to check and process referral rewards
CREATE OR REPLACE FUNCTION public.check_referral_rewards()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  starter_rank_id UUID;
  referral_record RECORD;
  transaction_id UUID;
BEGIN
  -- Only process if ranking changed and new ranking exists
  IF OLD.current_ranking_id IS DISTINCT FROM NEW.current_ranking_id AND NEW.current_ranking_id IS NOT NULL THEN
    
    -- Get the "Starter" rank ID (min_balance = 200)
    SELECT id INTO starter_rank_id 
    FROM public.ranking_tiers 
    WHERE min_balance = 200 
    LIMIT 1;
    
    -- Check if user reached Starter rank or higher
    IF NEW.current_ranking_id = starter_rank_id OR 
       EXISTS (SELECT 1 FROM public.ranking_tiers WHERE id = NEW.current_ranking_id AND min_balance > 200) THEN
      
      -- Check if this user was referred and hasn't been rewarded yet
      SELECT * INTO referral_record
      FROM public.user_referrals
      WHERE referred_id = NEW.id 
        AND status = 'pending';
      
      IF FOUND THEN
        -- Create transaction for referrer
        INSERT INTO public.user_transactions (
          user_id,
          amount,
          type,
          description,
          previous_balance,
          new_balance,
          created_by
        )
        SELECT 
          referral_record.referrer_id,
          50.00,
          'credit',
          'Referral-Bonus: Freund hat Starter-Rang erreicht',
          p.balance,
          p.balance + 50.00,
          NEW.id
        FROM public.profiles p
        WHERE p.id = referral_record.referrer_id
        RETURNING id INTO transaction_id;
        
        -- Update referrer's balance
        UPDATE public.profiles
        SET balance = balance + 50.00
        WHERE id = referral_record.referrer_id;
        
        -- Create reward record
        INSERT INTO public.referral_rewards (
          referral_id,
          referrer_id,
          referred_id,
          reward_amount,
          transaction_id
        ) VALUES (
          referral_record.id,
          referral_record.referrer_id,
          referral_record.referred_id,
          50.00,
          transaction_id
        );
        
        -- Update referral status
        UPDATE public.user_referrals
        SET 
          status = 'rewarded',
          qualified_at = NOW(),
          rewarded_at = NOW()
        WHERE id = referral_record.id;
        
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for referral rewards
CREATE TRIGGER check_referral_rewards_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_referral_rewards();

-- Update handle_new_user function to generate referral code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_referral_code TEXT;
  referrer_id UUID;
BEGIN
  -- Generate unique referral code
  new_referral_code := public.generate_referral_code();
  
  -- Insert into profiles with referral code
  INSERT INTO public.profiles (id, first_name, last_name, phone, email, balance, referral_code)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.raw_user_meta_data ->> 'phone',
    COALESCE(NEW.email, NEW.raw_user_meta_data ->> 'email'),
    0.00,
    new_referral_code
  );
  
  -- Insert default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Check if user was referred
  IF NEW.raw_user_meta_data ->> 'referral_code' IS NOT NULL THEN
    -- Find referrer by referral code
    SELECT id INTO referrer_id
    FROM public.profiles
    WHERE referral_code = NEW.raw_user_meta_data ->> 'referral_code'
    LIMIT 1;
    
    -- Create referral relationship if referrer found
    IF referrer_id IS NOT NULL THEN
      INSERT INTO public.user_referrals (
        referrer_id,
        referred_id,
        referral_code,
        status
      ) VALUES (
        referrer_id,
        NEW.id,
        NEW.raw_user_meta_data ->> 'referral_code',
        'pending'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;