-- Add new notification columns to telegram_config for task events
ALTER TABLE telegram_config 
ADD COLUMN IF NOT EXISTS notify_task_enrolled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_task_assigned BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_task_submitted BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_task_approved BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_task_rejected BOOLEAN DEFAULT true;