-- Add balance column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN balance DECIMAL(10,2) DEFAULT 0.00 NOT NULL;

-- Set existing users to 0.00 balance
UPDATE public.profiles SET balance = 0.00;

-- Create user_transactions table for transaction log
CREATE TABLE public.user_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'adjustment')),
  description TEXT NOT NULL,
  previous_balance DECIMAL(10,2) NOT NULL,
  new_balance DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS on transactions table
ALTER TABLE public.user_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for user_transactions
CREATE POLICY "Admins can view all transactions" 
ON public.user_transactions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own transactions" 
ON public.user_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can create transactions" 
ON public.user_transactions 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Update handle_new_user function to set initial balance
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles with improved email extraction and initial balance
  INSERT INTO public.profiles (id, first_name, last_name, phone, email, balance)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.raw_user_meta_data ->> 'phone',
    COALESCE(NEW.email, NEW.raw_user_meta_data ->> 'email'),
    0.00
  );
  
  -- Insert default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Create function to update user balance with transaction log
CREATE OR REPLACE FUNCTION public.update_user_balance(
  target_user_id UUID,
  amount_change DECIMAL(10,2),
  transaction_type TEXT,
  transaction_description TEXT,
  admin_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance DECIMAL(10,2);
  new_balance DECIMAL(10,2);
BEGIN
  -- Check if admin
  IF NOT has_role(admin_user_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can update balances';
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
  new_balance := current_balance + amount_change;
  
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
    amount_change,
    transaction_type,
    transaction_description,
    current_balance,
    new_balance,
    admin_user_id
  );
  
  RETURN TRUE;
END;
$$;