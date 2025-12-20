-- Create a new function that allows the service role to credit user balances
-- This is used by the trading bot scheduler to credit profits after bot completion
CREATE OR REPLACE FUNCTION public.credit_balance_from_bot(
  target_user_id uuid,
  amount numeric,
  description text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_balance DECIMAL(10,2);
  new_balance DECIMAL(10,2);
BEGIN
  -- Amount must be positive
  IF amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;
  
  -- Get current balance with row lock
  SELECT balance INTO current_balance 
  FROM public.profiles 
  WHERE id = target_user_id 
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Calculate new balance
  new_balance := current_balance + amount;
  
  -- Update balance
  UPDATE public.profiles 
  SET balance = new_balance, updated_at = now()
  WHERE id = target_user_id;
  
  -- Log transaction
  INSERT INTO public.user_transactions (
    user_id, 
    amount, 
    type, 
    description, 
    previous_balance, 
    new_balance, 
    created_by
  ) VALUES (
    target_user_id,
    amount,
    'credit',
    description,
    current_balance,
    new_balance,
    target_user_id
  );
  
  RETURN TRUE;
END;
$$;