-- Add country field to kyc_submissions table
ALTER TABLE public.kyc_submissions ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Deutschland';