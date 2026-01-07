-- Add unlucky_streak column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN unlucky_streak BOOLEAN DEFAULT false;