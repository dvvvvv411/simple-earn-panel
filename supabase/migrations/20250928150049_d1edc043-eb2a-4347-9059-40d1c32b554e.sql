-- Fix security warnings by setting search_path for functions
ALTER FUNCTION public.generate_referral_code() SET search_path = public;
ALTER FUNCTION public.check_referral_rewards() SET search_path = public;