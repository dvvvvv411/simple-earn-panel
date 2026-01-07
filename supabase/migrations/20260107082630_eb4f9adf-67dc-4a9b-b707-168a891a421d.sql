-- Create withdrawal_requests table
CREATE TABLE public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  btc_wallet_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  processed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own withdrawal requests" 
ON public.withdrawal_requests FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own withdrawal requests" 
ON public.withdrawal_requests FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all withdrawal requests" 
ON public.withdrawal_requests FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update withdrawal requests" 
ON public.withdrawal_requests FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- Function to process withdrawal request (approve/reject)
CREATE OR REPLACE FUNCTION public.process_withdrawal_request(
  request_id UUID,
  new_status TEXT,
  admin_note_text TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_record RECORD;
  current_balance NUMERIC;
  new_balance NUMERIC;
  admin_id UUID;
BEGIN
  admin_id := auth.uid();
  
  -- Verify admin role
  IF NOT has_role(admin_id, 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can process withdrawal requests';
  END IF;
  
  -- Validate status
  IF new_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status. Must be approved or rejected';
  END IF;
  
  -- Get request details with lock
  SELECT * INTO request_record
  FROM public.withdrawal_requests
  WHERE id = request_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal request not found';
  END IF;
  
  IF request_record.status != 'pending' THEN
    RAISE EXCEPTION 'Request already processed';
  END IF;
  
  -- If approving, check and deduct balance
  IF new_status = 'approved' THEN
    SELECT balance INTO current_balance
    FROM public.profiles
    WHERE id = request_record.user_id
    FOR UPDATE;
    
    IF current_balance < request_record.amount THEN
      RAISE EXCEPTION 'Insufficient balance';
    END IF;
    
    new_balance := current_balance - request_record.amount;
    
    -- Update user balance
    UPDATE public.profiles
    SET balance = new_balance, updated_at = now()
    WHERE id = request_record.user_id;
    
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
      request_record.user_id,
      -request_record.amount,
      'debit',
      'Auszahlung genehmigt - BTC: ' || LEFT(request_record.btc_wallet_address, 10) || '...',
      current_balance,
      new_balance,
      admin_id
    );
  END IF;
  
  -- Update request status
  UPDATE public.withdrawal_requests
  SET 
    status = new_status,
    admin_note = admin_note_text,
    processed_by = admin_id,
    processed_at = NOW()
  WHERE id = request_id;
  
  RETURN TRUE;
END;
$$;