-- Check existing cron jobs first
SELECT jobname, schedule, command FROM cron.job;

-- Create the profitable V2 scheduler cron job
SELECT cron.schedule(
  'trading-bot-scheduler-v2-job',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT
    net.http_post(
        url:='https://fyloldkiuxtcdiazbtwn.supabase.co/functions/v1/trading-bot-scheduler-v2',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5bG9sZGtpdXh0Y2RpYXpidHduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0OTQyODYsImV4cCI6MjA3MzA3MDI4Nn0.6oNsYsmUSh2I1EJuGfjyi1fzjxdrIX9gxke5Mw0h_ZI"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);