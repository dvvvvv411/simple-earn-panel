-- Add free_bots column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS free_bots INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN profiles.free_bots IS 'Bonus-Bots die nicht zum täglichen Limit zählen und nach Nutzung verbraucht werden';

-- Create function to use a free bot (decrements counter)
CREATE OR REPLACE FUNCTION use_free_bot(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_free_bots INTEGER;
BEGIN
  SELECT free_bots INTO v_free_bots
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;
  
  IF v_free_bots > 0 THEN
    UPDATE profiles
    SET free_bots = free_bots - 1, updated_at = now()
    WHERE id = p_user_id;
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Create function for admin to update free bots
CREATE OR REPLACE FUNCTION update_user_free_bots(
  target_user_id uuid,
  amount_change integer,
  operation_type text -- 'add' or 'set'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF operation_type = 'add' THEN
    UPDATE profiles
    SET free_bots = GREATEST(0, free_bots + amount_change), updated_at = now()
    WHERE id = target_user_id;
  ELSIF operation_type = 'set' THEN
    UPDATE profiles
    SET free_bots = GREATEST(0, amount_change), updated_at = now()
    WHERE id = target_user_id;
  ELSE
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;