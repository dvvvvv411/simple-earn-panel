-- Create crypto_deposits table for NowPayments integration
CREATE TABLE public.crypto_deposits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nowpayments_invoice_id TEXT UNIQUE,
  nowpayments_payment_id TEXT,
  price_amount NUMERIC NOT NULL,
  price_currency TEXT NOT NULL DEFAULT 'eur',
  pay_currency TEXT,
  pay_amount NUMERIC,
  actually_paid NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending',
  invoice_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.crypto_deposits ENABLE ROW LEVEL SECURITY;

-- Users can view their own deposits
CREATE POLICY "Users can view their own deposits"
ON public.crypto_deposits
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own deposits
CREATE POLICY "Users can create their own deposits"
ON public.crypto_deposits
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- System can update deposits (for webhook)
CREATE POLICY "System can update deposits"
ON public.crypto_deposits
FOR UPDATE
USING (true);

-- Admins can view all deposits
CREATE POLICY "Admins can view all deposits"
ON public.crypto_deposits
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_crypto_deposits_updated_at
BEFORE UPDATE ON public.crypto_deposits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_crypto_deposits_user_id ON public.crypto_deposits(user_id);
CREATE INDEX idx_crypto_deposits_status ON public.crypto_deposits(status);
CREATE INDEX idx_crypto_deposits_invoice_id ON public.crypto_deposits(nowpayments_invoice_id);