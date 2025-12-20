-- Allow public read access to brandings for domain-based branding loading on auth page
CREATE POLICY "Public can read brandings for domain lookup"
  ON public.brandings
  FOR SELECT
  USING (true);