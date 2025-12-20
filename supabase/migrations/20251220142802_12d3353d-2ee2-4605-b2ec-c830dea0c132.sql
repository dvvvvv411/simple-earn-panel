-- Fix user balance for vogel@vogel.de who had 3 completed bots but balance not credited
-- Total: 1262.66 + 638.14 + 632.55 = 2533.35 EUR

-- Update the balance
UPDATE public.profiles 
SET balance = 2533.35, updated_at = now()
WHERE id = '037d9fad-c01e-45b5-894d-2e67bf1a9634';

-- Insert the missing credit transactions for the completed bots
INSERT INTO public.user_transactions (user_id, amount, type, description, previous_balance, new_balance, created_by)
VALUES 
  ('037d9fad-c01e-45b5-894d-2e67bf1a9634', 1262.66, 'credit', 'Trading Bot abgeschlossen - Bitcoin (Korrektur)', 0.00, 1262.66, '037d9fad-c01e-45b5-894d-2e67bf1a9634'),
  ('037d9fad-c01e-45b5-894d-2e67bf1a9634', 638.14, 'credit', 'Trading Bot abgeschlossen - Bitcoin (Korrektur)', 1262.66, 1900.80, '037d9fad-c01e-45b5-894d-2e67bf1a9634'),
  ('037d9fad-c01e-45b5-894d-2e67bf1a9634', 632.55, 'credit', 'Trading Bot abgeschlossen - Ethereum (Korrektur)', 1900.80, 2533.35, '037d9fad-c01e-45b5-894d-2e67bf1a9634');