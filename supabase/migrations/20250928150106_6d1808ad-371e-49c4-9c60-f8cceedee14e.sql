-- Fix remaining function security warning
ALTER FUNCTION public.calculate_user_ranking(numeric, numeric) SET search_path = public;