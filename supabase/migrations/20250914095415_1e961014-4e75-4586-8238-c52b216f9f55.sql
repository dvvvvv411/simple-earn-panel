-- Add expected_completion_time column to trading_bots table
ALTER TABLE public.trading_bots 
ADD COLUMN expected_completion_time TIMESTAMP WITH TIME ZONE;

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create cron job that runs every 5 minutes to check for completed bots
SELECT cron.schedule(
  'trading-bot-scheduler',
  '*/5 * * * *', -- every 5 minutes
  $$
  SELECT
    net.http_post(
        url:='https://fyloldkiuxtcdiazbtwn.supabase.co/functions/v1/trading-bot-scheduler',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5bG9sZGtpdXh0Y2RpYXpidHduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0OTQyODYsImV4cCI6MjA3MzA3MDI4Nn0.6oNsYsmUSh2I1EJuGfjyi1fzjxdrIX9gxke5Mw0h_ZI"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);