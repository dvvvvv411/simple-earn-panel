-- Add domain column to brandings table
ALTER TABLE public.brandings 
ADD COLUMN domain TEXT;

-- Add api_key column to branding_resend_configs table
ALTER TABLE public.branding_resend_configs 
ADD COLUMN api_key TEXT;