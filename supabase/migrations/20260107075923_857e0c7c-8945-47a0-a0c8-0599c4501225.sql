-- Update check_referral_rewards function to correctly check when user LEAVES the "New" rank
-- This handles edge cases like users depositing €5000 and skipping directly to Pro-Trader

CREATE OR REPLACE FUNCTION public.check_referral_rewards()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_rank_min_balance NUMERIC;
  new_rank_min_balance NUMERIC;
  referral_record RECORD;
  transaction_id UUID;
BEGIN
  -- Only process if ranking changed
  IF OLD.current_ranking_id IS DISTINCT FROM NEW.current_ranking_id THEN
    
    -- Get old rank min_balance (NULL means no rank yet = New user)
    SELECT min_balance INTO old_rank_min_balance
    FROM public.ranking_tiers 
    WHERE id = OLD.current_ranking_id;
    
    -- Get new rank min_balance
    SELECT min_balance INTO new_rank_min_balance
    FROM public.ranking_tiers 
    WHERE id = NEW.current_ranking_id;
    
    -- Check if user LEFT the "New" rank
    -- Condition: Was in New rank (min_balance < 200 or NULL) AND now in higher rank (min_balance >= 200)
    IF (old_rank_min_balance IS NULL OR old_rank_min_balance < 200) 
       AND (new_rank_min_balance IS NOT NULL AND new_rank_min_balance >= 200) THEN
      
      -- Check if this user was referred and hasn't been rewarded yet
      SELECT * INTO referral_record
      FROM public.user_referrals
      WHERE referred_id = NEW.id 
        AND status = 'pending';
      
      IF FOUND THEN
        -- Create transaction for referrer (documented as credit/deposit)
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
          'Referral-Bonus: Freund hat New-Rang verlassen',
          p.balance,
          p.balance + 50.00,
          NEW.id
        FROM public.profiles p
        WHERE p.id = referral_record.referrer_id
        RETURNING id INTO transaction_id;
        
        -- Update referrer's balance (+50€)
        UPDATE public.profiles
        SET balance = balance + 50.00
        WHERE id = referral_record.referrer_id;
        
        -- Create reward record (for tracking in ReferralSystemCard)
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
        
        -- Update referral status to rewarded
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