-- Create a new function that allows users to deduct their own balance for bot creation
CREATE OR REPLACE FUNCTION public.deduct_balance_for_bot(
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
  user_id uuid;
BEGIN
  -- Get current user
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Amount must be positive (we will subtract it)
  IF amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;
  
  -- Get current balance with row lock
  SELECT balance INTO current_balance 
  FROM public.profiles 
  WHERE id = user_id 
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Check sufficient balance
  IF current_balance < amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  -- Calculate new balance
  new_balance := current_balance - amount;
  
  -- Update balance
  UPDATE public.profiles 
  SET balance = new_balance, updated_at = now()
  WHERE id = user_id;
  
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
    user_id,
    -amount,
    'debit',
    description,
    current_balance,
    new_balance,
    user_id
  );
  
  RETURN TRUE;
END;
$$;