-- Create branding type enum
CREATE TYPE public.branding_type AS ENUM ('kryptotrading', 'festgeld', 'sonstiges');

-- Create brandings table
CREATE TABLE public.brandings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type public.branding_type NOT NULL,
  logo_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create branding resend configs table
CREATE TABLE public.branding_resend_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branding_id UUID NOT NULL REFERENCES public.brandings(id) ON DELETE CASCADE UNIQUE,
  from_name TEXT NOT NULL,
  from_email TEXT NOT NULL,
  reply_to TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.brandings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branding_resend_configs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for brandings (admin only)
CREATE POLICY "Admins can view all brandings" 
ON public.brandings 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create brandings" 
ON public.brandings 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update brandings" 
ON public.brandings 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete brandings" 
ON public.brandings 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- Create RLS policies for branding_resend_configs (admin only)
CREATE POLICY "Admins can view all branding resend configs" 
ON public.branding_resend_configs 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create branding resend configs" 
ON public.branding_resend_configs 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update branding resend configs" 
ON public.branding_resend_configs 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete branding resend configs" 
ON public.branding_resend_configs 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- Create triggers for updated_at
CREATE TRIGGER update_brandings_updated_at
BEFORE UPDATE ON public.brandings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_branding_resend_configs_updated_at
BEFORE UPDATE ON public.branding_resend_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for branding logos
INSERT INTO storage.buckets (id, name, public) VALUES ('branding-logos', 'branding-logos', true);

-- Create storage policies
CREATE POLICY "Branding logos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'branding-logos');

CREATE POLICY "Admins can upload branding logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'branding-logos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update branding logos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'branding-logos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete branding logos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'branding-logos' AND public.has_role(auth.uid(), 'admin'));