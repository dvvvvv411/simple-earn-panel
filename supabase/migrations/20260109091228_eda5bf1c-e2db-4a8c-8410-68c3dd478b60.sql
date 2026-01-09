-- Create telegram_config table for storing Telegram notification settings
CREATE TABLE public.telegram_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_token text,
  chat_id text,
  enabled boolean NOT NULL DEFAULT false,
  notify_new_user boolean NOT NULL DEFAULT true,
  notify_deposit_created boolean NOT NULL DEFAULT true,
  notify_deposit_paid boolean NOT NULL DEFAULT true,
  notify_withdrawal boolean NOT NULL DEFAULT true,
  notify_support_ticket boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.telegram_config ENABLE ROW LEVEL SECURITY;

-- Only admins can view telegram config
CREATE POLICY "Admins can view telegram config"
ON public.telegram_config
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert telegram config
CREATE POLICY "Admins can insert telegram config"
ON public.telegram_config
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update telegram config
CREATE POLICY "Admins can update telegram config"
ON public.telegram_config
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete telegram config
CREATE POLICY "Admins can delete telegram config"
ON public.telegram_config
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_telegram_config_updated_at
BEFORE UPDATE ON public.telegram_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default row (disabled by default)
INSERT INTO public.telegram_config (enabled) VALUES (false);