-- ==============================
-- 카드 만료 추적 + 만료 30일/7일 전 알림
-- ==============================
-- subscriptions 테이블에 카드 만료 정보(YYYY/MM) 저장.
-- card-expiry-cron Edge Function이 매일 KST 09:00 실행되어 D-30/D-7 알림 발송.

-- 1) 카드 만료월 컬럼 (Toss API가 항상 반환하지 않으므로 NULLABLE)
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS card_expiry_year  INTEGER,
  ADD COLUMN IF NOT EXISTS card_expiry_month INTEGER,
  ADD COLUMN IF NOT EXISTS card_expiry_alerted_at TIMESTAMPTZ;

-- 만료월 유효성 (1-12)
ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS card_expiry_month_check;
ALTER TABLE subscriptions
  ADD CONSTRAINT card_expiry_month_check
  CHECK (card_expiry_month IS NULL OR (card_expiry_month BETWEEN 1 AND 12));

-- 만료 임박 카드 조회용 인덱스
CREATE INDEX IF NOT EXISTS idx_subscriptions_card_expiry
  ON subscriptions (card_expiry_year, card_expiry_month)
  WHERE card_expiry_year IS NOT NULL
    AND status IN ('active', 'past_due', 'trialing');

-- 2) 만료 알림 cron (매일 KST 09:00 = UTC 00:00)
DO $$
DECLARE
  job_id BIGINT;
BEGIN
  SELECT jobid INTO job_id FROM cron.job WHERE jobname = 'villatolk-card-expiry-daily';
  IF job_id IS NOT NULL THEN
    PERFORM cron.unschedule(job_id);
  END IF;
END $$;

SELECT cron.schedule(
  'villatolk-card-expiry-daily',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/card-expiry-cron',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);

-- 조회: SELECT jobname, schedule FROM cron.job WHERE jobname LIKE 'villatolk-%';
