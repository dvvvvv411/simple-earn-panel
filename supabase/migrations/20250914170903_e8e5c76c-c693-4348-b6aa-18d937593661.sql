-- Stop all existing trading bot scheduler jobs to prevent conflicts
DO $$
DECLARE
    job_name text;
BEGIN
    -- Loop through all cron jobs that contain 'trading-bot-scheduler' but are not V2
    FOR job_name IN 
        SELECT jobname 
        FROM cron.job 
        WHERE jobname LIKE '%trading-bot-scheduler%' 
        AND jobname != 'trading-bot-scheduler-v2-job'
    LOOP
        PERFORM cron.unschedule(job_name);
        RAISE NOTICE 'Unscheduled job: %', job_name;
    END LOOP;
END $$;