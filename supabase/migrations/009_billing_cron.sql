-- ==============================
-- pg_cron 기반 매일 정기결제 스케줄
-- ==============================
-- 1) Supabase Dashboard → Database → Extensions 에서 pg_cron, pg_net 활성화 필요
-- 2) 배포 전 아래 설정값 교체:
--    - ALTER DATABASE postgres SET "app.settings.supabase_url" TO 'https://<project>.supabase.co';
--    - ALTER DATABASE postgres SET "app.settings.service_role_key" TO 'sb_secret_...';
--    또는 Vault 사용 권장 (프로덕션)

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 기존 스케줄 제거 (멱등)
DO $$
DECLARE
  job_id BIGINT;
BEGIN
  SELECT jobid INTO job_id FROM cron.job WHERE jobname = 'villatolk-billing-daily';
  IF job_id IS NOT NULL THEN
    PERFORM cron.unschedule(job_id);
  END IF;
END $$;

-- 매일 KST 01:00 (UTC 16:00) 실행 — billing-cron Edge Function 호출
SELECT cron.schedule(
  'villatolk-billing-daily',
  '0 16 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/billing-cron',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);

-- 실패 결제 재시도 (D+3, D+7) — past_due 상태의 구독을 매일 09:00 KST에 재시도
DO $$
DECLARE
  job_id BIGINT;
BEGIN
  SELECT jobid INTO job_id FROM cron.job WHERE jobname = 'villatolk-retry-past-due';
  IF job_id IS NOT NULL THEN
    PERFORM cron.unschedule(job_id);
  END IF;
END $$;

SELECT cron.schedule(
  'villatolk-retry-past-due',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/billing-cron',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('retry', true),
    timeout_milliseconds := 60000
  );
  $$
);

-- 조회: 등록된 크론 확인
-- SELECT jobname, schedule, command FROM cron.job;
