-- Add new notification types for Bank deposits and Bank-KYC
ALTER TABLE telegram_config
ADD COLUMN IF NOT EXISTS notify_bank_deposit_created boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_bank_kyc_submitted boolean DEFAULT true;