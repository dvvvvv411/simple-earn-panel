-- Update the handle_new_user function to properly extract email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert into profiles with improved email extraction
  INSERT INTO public.profiles (id, first_name, last_name, phone, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.raw_user_meta_data ->> 'phone',
    COALESCE(NEW.email, NEW.raw_user_meta_data ->> 'email')
  );
  
  -- Insert default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;

-- Update existing profiles with missing emails from auth.users
UPDATE public.profiles 
SET email = auth_users.email
FROM auth.users auth_users
WHERE profiles.id = auth_users.id 
AND (profiles.email IS NULL OR profiles.email = '');

-- Drop and recreate the trigger to ensure it works properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();