-- Create function to process bank deposits
CREATE OR REPLACE FUNCTION public.process_bank_deposit(p_request_id UUID, p_admin_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_amount NUMERIC;
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  -- Get the deposit request details
  SELECT user_id, amount INTO v_user_id, v_amount
  FROM bank_deposit_requests
  WHERE id = p_request_id AND status = 'pending';

  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Get current user balance
  SELECT balance INTO v_current_balance
  FROM profiles
  WHERE id = v_user_id;

  v_new_balance := v_current_balance + v_amount;

  -- Update deposit status
  UPDATE bank_deposit_requests
  SET status = 'completed',
      completed_at = now(),
      completed_by = p_admin_id,
      updated_at = now()
  WHERE id = p_request_id;

  -- Update user balance
  UPDATE profiles
  SET balance = v_new_balance,
      updated_at = now()
  WHERE id = v_user_id;

  -- Create transaction record
  INSERT INTO user_transactions (user_id, type, amount, description, previous_balance, new_balance, created_by)
  VALUES (v_user_id, 'credit', v_amount, 'Banküberweisung Einzahlung', v_current_balance, v_new_balance, p_admin_id);

  RETURN TRUE;
END;
$$;