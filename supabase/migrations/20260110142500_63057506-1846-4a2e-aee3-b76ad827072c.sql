-- Add credit notification columns to telegram_config
ALTER TABLE telegram_config
ADD COLUMN IF NOT EXISTS notify_credit_documents_submitted BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notify_credit_ident_submitted BOOLEAN DEFAULT TRUE;