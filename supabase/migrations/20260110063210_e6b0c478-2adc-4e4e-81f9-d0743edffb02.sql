-- Create EUR deposit requests table
CREATE TABLE public.eur_deposit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Admin-defined fields when activating
  partner_bank TEXT NOT NULL,
  verification_type TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  verification_link TEXT NOT NULL,
  
  -- Status tracking: pending, submitted, approved, rejected
  status TEXT NOT NULL DEFAULT 'pending',
  
  -- After user confirmation
  user_confirmed_at TIMESTAMPTZ,
  
  -- After admin review
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.eur_deposit_requests ENABLE ROW LEVEL SECURITY;

-- Admin policies
CREATE POLICY "Admins can manage all EUR deposit requests"
  ON public.eur_deposit_requests FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- User policies
CREATE POLICY "Users can view their own EUR deposit requests"
  ON public.eur_deposit_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending EUR deposit requests"
  ON public.eur_deposit_requests FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status IN ('pending', 'submitted'));

-- Indexes for performance
CREATE INDEX idx_eur_deposit_requests_user_id ON public.eur_deposit_requests(user_id);
CREATE INDEX idx_eur_deposit_requests_status ON public.eur_deposit_requests(status);
CREATE INDEX idx_eur_deposit_requests_created_at ON public.eur_deposit_requests(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_eur_deposit_requests_updated_at
  BEFORE UPDATE ON public.eur_deposit_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();