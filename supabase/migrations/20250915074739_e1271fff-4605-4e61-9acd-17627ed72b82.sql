-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a cron job to run crypto price scheduler every 60 seconds
SELECT cron.schedule(
  'crypto-price-collector',
  '* * * * *', -- every minute
  $$
  SELECT
    net.http_post(
        url:='https://fyloldkiuxtcdiazbtwn.supabase.co/functions/v1/crypto-price-scheduler',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5bG9sZGtpdXh0Y2RpYXpidHduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0OTQyODYsImV4cCI6MjA3MzA3MDI4Nn0.6oNsYsmUSh2I1EJuGfjyi1fzjxdrIX9gxke5Mw0h_ZI"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);