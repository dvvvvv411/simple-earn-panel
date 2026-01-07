-- Add new columns for internal payment display (Payment API instead of Invoice API)
ALTER TABLE crypto_deposits 
ADD COLUMN IF NOT EXISTS pay_address TEXT,
ADD COLUMN IF NOT EXISTS expiration_estimate_date TIMESTAMPTZ;