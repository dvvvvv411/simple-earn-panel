-- Allow admins to create support tickets for any user
CREATE POLICY "Admins can create tickets for any user"
ON public.support_tickets FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));