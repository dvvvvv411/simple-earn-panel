-- Add status tracking columns to leads table
ALTER TABLE public.leads 
ADD COLUMN status text DEFAULT 'new' NOT NULL,
ADD COLUMN status_updated_at timestamp with time zone DEFAULT now();

-- Update existing leads to have proper timestamps
UPDATE public.leads SET status_updated_at = created_at WHERE status_updated_at IS NULL;