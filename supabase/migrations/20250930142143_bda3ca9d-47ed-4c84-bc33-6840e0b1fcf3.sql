-- Create storage bucket for consultant images
INSERT INTO storage.buckets (id, name, public)
VALUES ('consultant-images', 'consultant-images', true);

-- Create consultants table
CREATE TABLE public.consultants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  image_path TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on consultants
ALTER TABLE public.consultants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for consultants
CREATE POLICY "Admins can manage consultants"
ON public.consultants
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view consultants"
ON public.consultants
FOR SELECT
USING (true);

-- Storage policies for consultant images
CREATE POLICY "Public can view consultant images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'consultant-images');

CREATE POLICY "Admins can upload consultant images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'consultant-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update consultant images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'consultant-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete consultant images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'consultant-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Add consultant_id to profiles
ALTER TABLE public.profiles
ADD COLUMN consultant_id UUID REFERENCES public.consultants(id);

-- Trigger for updated_at on consultants
CREATE TRIGGER update_consultants_updated_at
BEFORE UPDATE ON public.consultants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default consultant (Fabian Schmidt)
INSERT INTO public.consultants (name, phone, is_default)
VALUES ('Fabian Schmidt', '0800123123', true);