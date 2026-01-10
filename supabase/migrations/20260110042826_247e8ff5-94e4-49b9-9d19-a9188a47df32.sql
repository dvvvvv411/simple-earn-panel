-- Add notify_kyc_submitted column to telegram_config table
ALTER TABLE telegram_config 
ADD COLUMN IF NOT EXISTS notify_kyc_submitted BOOLEAN DEFAULT true;