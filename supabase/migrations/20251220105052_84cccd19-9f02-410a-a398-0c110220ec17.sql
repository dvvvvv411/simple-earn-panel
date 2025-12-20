-- Allow users to read their own assigned branding
CREATE POLICY "Users can view their own branding"
  ON public.brandings
  FOR SELECT
  USING (
    id IN (
      SELECT branding_id 
      FROM public.profiles 
      WHERE id = auth.uid() AND branding_id IS NOT NULL
    )
  );