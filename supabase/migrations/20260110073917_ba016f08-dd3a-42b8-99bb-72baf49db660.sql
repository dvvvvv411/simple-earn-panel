-- Add bank data columns to eur_deposit_requests table
ALTER TABLE public.eur_deposit_requests 
  ADD COLUMN IF NOT EXISTS bank_account_holder TEXT,
  ADD COLUMN IF NOT EXISTS bank_iban TEXT,
  ADD COLUMN IF NOT EXISTS bank_bic TEXT,
  ADD COLUMN IF NOT EXISTS bank_name TEXT;

-- Create bank_deposit_requests table for SEPA transfers
CREATE TABLE public.bank_deposit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reference_code TEXT NOT NULL,
  user_confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add constraint for status values using trigger instead of check
CREATE OR REPLACE FUNCTION public.validate_bank_deposit_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'completed', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status value. Must be pending, completed, or cancelled.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_bank_deposit_status_trigger
  BEFORE INSERT OR UPDATE ON public.bank_deposit_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_bank_deposit_status();

-- Enable RLS
ALTER TABLE public.bank_deposit_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own bank deposits
CREATE POLICY "Users can view own bank deposits" 
ON public.bank_deposit_requests 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Users can create their own bank deposits
CREATE POLICY "Users can create own bank deposits" 
ON public.bank_deposit_requests 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending bank deposits
CREATE POLICY "Users can update own pending bank deposits" 
ON public.bank_deposit_requests 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id AND status = 'pending');

-- Admins can view all bank deposits
CREATE POLICY "Admins can view all bank deposits" 
ON public.bank_deposit_requests 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update all bank deposits
CREATE POLICY "Admins can update all bank deposits" 
ON public.bank_deposit_requests 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create updated_at trigger
CREATE TRIGGER update_bank_deposit_requests_updated_at
  BEFORE UPDATE ON public.bank_deposit_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to process bank deposit and credit balance
CREATE OR REPLACE FUNCTION public.process_bank_deposit(
  p_request_id UUID,
  p_admin_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_amount NUMERIC;
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  -- Get the deposit request details
  SELECT user_id, amount INTO v_user_id, v_amount
  FROM public.bank_deposit_requests
  WHERE id = p_request_id AND status = 'pending';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Bank deposit request not found or not pending';
  END IF;
  
  -- Get current balance
  SELECT balance INTO v_current_balance
  FROM public.profiles
  WHERE id = v_user_id;
  
  v_new_balance := v_current_balance + v_amount;
  
  -- Update user balance
  UPDATE public.profiles
  SET balance = v_new_balance, updated_at = now()
  WHERE id = v_user_id;
  
  -- Create transaction record
  INSERT INTO public.user_transactions (
    user_id,
    type,
    amount,
    previous_balance,
    new_balance,
    description,
    created_by
  ) VALUES (
    v_user_id,
    'credit',
    v_amount,
    v_current_balance,
    v_new_balance,
    'Banküberweisung Einzahlung',
    p_admin_id
  );
  
  -- Update deposit request status
  UPDATE public.bank_deposit_requests
  SET 
    status = 'completed',
    completed_at = now(),
    completed_by = p_admin_id,
    updated_at = now()
  WHERE id = p_request_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enable realtime for bank_deposit_requests
ALTER PUBLICATION supabase_realtime ADD TABLE bank_deposit_requests;