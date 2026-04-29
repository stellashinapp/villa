-- ==============================
-- bill_months 자동 마감 cron
-- ==============================
-- due_date + 30일 경과한 published 월을 자동으로 closed 처리.
-- 매일 KST 03:00 (UTC 18:00) 실행. closeBillMonth 수동 액션과 공존 가능.

CREATE OR REPLACE FUNCTION auto_close_bill_months()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  closed_count INTEGER;
BEGIN
  WITH updated AS (
    UPDATE bill_months
       SET status = 'closed'
     WHERE status = 'published'
       AND due_date IS NOT NULL
       AND due_date + INTERVAL '30 days' < now()
    RETURNING id
  )
  SELECT COUNT(*) INTO closed_count FROM updated;

  RETURN closed_count;
END;
$$;

-- 기존 스케줄 제거 (멱등)
DO $$
DECLARE
  job_id BIGINT;
BEGIN
  SELECT jobid INTO job_id FROM cron.job WHERE jobname = 'villatolk-bill-auto-close';
  IF job_id IS NOT NULL THEN
    PERFORM cron.unschedule(job_id);
  END IF;
END $$;

-- 매일 KST 03:00 (UTC 18:00) 실행
SELECT cron.schedule(
  'villatolk-bill-auto-close',
  '0 18 * * *',
  $$ SELECT auto_close_bill_months(); $$
);

-- 조회: SELECT jobname, schedule FROM cron.job WHERE jobname LIKE 'villatolk-%';
