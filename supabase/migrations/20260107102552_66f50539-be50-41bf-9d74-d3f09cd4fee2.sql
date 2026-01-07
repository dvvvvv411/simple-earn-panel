-- Atomare Funktion für Trading-Bot Erstellung
-- Verhindert Race Conditions durch FOR UPDATE Lock
CREATE OR REPLACE FUNCTION public.create_trading_bot_atomic(
  p_cryptocurrency TEXT,
  p_symbol TEXT,
  p_start_amount NUMERIC,
  p_expected_completion_time TIMESTAMPTZ
) 
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
  v_bot_id uuid;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Nicht authentifiziert';
  END IF;
  
  -- Amount must be positive
  IF p_start_amount <= 0 THEN
    RAISE EXCEPTION 'Betrag muss positiv sein';
  END IF;
  
  -- Lock the user row to prevent concurrent bot creation
  -- This is the key security mechanism!
  SELECT balance INTO v_current_balance 
  FROM public.profiles 
  WHERE id = v_user_id 
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Benutzer nicht gefunden';
  END IF;
  
  -- Check sufficient balance
  IF v_current_balance < p_start_amount THEN
    RAISE EXCEPTION 'Unzureichendes Guthaben';
  END IF;
  
  -- Calculate new balance
  v_new_balance := v_current_balance - p_start_amount;
  
  -- Update balance FIRST (before creating bot)
  UPDATE public.profiles 
  SET balance = v_new_balance, updated_at = now()
  WHERE id = v_user_id;
  
  -- Create the trading bot
  INSERT INTO public.trading_bots (
    user_id,
    cryptocurrency,
    symbol,
    start_amount,
    current_balance,
    status,
    expected_completion_time
  ) VALUES (
    v_user_id,
    p_cryptocurrency,
    p_symbol,
    p_start_amount,
    p_start_amount,
    'active',
    p_expected_completion_time
  ) RETURNING id INTO v_bot_id;
  
  -- Log the transaction
  INSERT INTO public.user_transactions (
    user_id, 
    amount, 
    type, 
    description, 
    previous_balance, 
    new_balance, 
    created_by
  ) VALUES (
    v_user_id,
    -p_start_amount,
    'debit',
    'Trading-Bot Erstellung: ' || p_cryptocurrency,
    v_current_balance,
    v_new_balance,
    v_user_id
  );
  
  RETURN v_bot_id;
END;
$$;