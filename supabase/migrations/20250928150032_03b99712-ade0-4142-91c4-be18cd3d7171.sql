-- Create user login tracking table
CREATE TABLE public.user_login_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  login_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure only one login record per user per day
  UNIQUE(user_id, login_date)
);

-- Enable Row Level Security
ALTER TABLE public.user_login_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies for user login tracking
CREATE POLICY "Users can view their own login tracking" 
ON public.user_login_tracking 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert login tracking" 
ON public.user_login_tracking 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all login tracking" 
ON public.user_login_tracking 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for better performance
CREATE INDEX idx_user_login_tracking_user_date ON public.user_login_tracking(user_id, login_date);
CREATE INDEX idx_user_login_tracking_date ON public.user_login_tracking(login_date);