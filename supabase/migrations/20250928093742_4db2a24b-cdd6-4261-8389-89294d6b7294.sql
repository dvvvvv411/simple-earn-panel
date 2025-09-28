-- Add settings fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN wallet_password_hash text,
ADD COLUMN email_notifications boolean DEFAULT true;