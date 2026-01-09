-- Create kyc_submissions table
CREATE TABLE public.kyc_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Personal data
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  birth_place TEXT NOT NULL,
  street TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  city TEXT NOT NULL,
  nationality TEXT NOT NULL,
  
  -- Employment & Finances
  employment_status TEXT NOT NULL,
  monthly_income TEXT NOT NULL,
  source_of_funds TEXT[] NOT NULL,
  
  -- Documents (Supabase Storage paths)
  id_front_path TEXT NOT NULL,
  id_back_path TEXT NOT NULL,
  
  -- Status management
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add kyc_required column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_required BOOLEAN DEFAULT false;

-- Enable RLS on kyc_submissions
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for kyc_submissions
CREATE POLICY "Users can view their own submissions"
ON public.kyc_submissions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own submissions"
ON public.kyc_submissions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all submissions"
ON public.kyc_submissions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update submissions"
ON public.kyc_submissions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for kyc-documents bucket
CREATE POLICY "Users can upload their own KYC documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own KYC documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all KYC documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'kyc-documents' AND has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger for kyc_submissions
CREATE TRIGGER update_kyc_submissions_updated_at
BEFORE UPDATE ON public.kyc_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();