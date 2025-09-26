-- Create support_ticket_messages table for chat functionality
CREATE TABLE public.support_ticket_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_admin_message BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for support ticket messages
CREATE POLICY "Users can view messages for their tickets" 
ON public.support_ticket_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.support_tickets 
    WHERE support_tickets.id = support_ticket_messages.ticket_id 
    AND support_tickets.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages for their tickets" 
ON public.support_ticket_messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.support_tickets 
    WHERE support_tickets.id = support_ticket_messages.ticket_id 
    AND support_tickets.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all messages" 
ON public.support_ticket_messages 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can create messages" 
ON public.support_ticket_messages 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update messages" 
ON public.support_ticket_messages 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable real-time for support ticket messages
CREATE POLICY "Enable real-time for support ticket messages" 
ON public.support_ticket_messages 
FOR SELECT 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_support_ticket_messages_updated_at
BEFORE UPDATE ON public.support_ticket_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance
CREATE INDEX idx_support_ticket_messages_ticket_id ON public.support_ticket_messages(ticket_id);
CREATE INDEX idx_support_ticket_messages_created_at ON public.support_ticket_messages(created_at);