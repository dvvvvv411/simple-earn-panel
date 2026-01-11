-- Add notify_task_started column to telegram_config
ALTER TABLE telegram_config 
ADD COLUMN IF NOT EXISTS notify_task_started boolean DEFAULT true;