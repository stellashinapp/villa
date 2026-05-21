-- ============================================================================
-- 033: 로그 보관기간 정리 (login_logs / admin_access_logs 무한증가 방지)
-- ----------------------------------------------------------------------------
-- PIPA 접근기록 1년 이상 보관 의무 → 안전하게 2년 초과분만 삭제.
-- 1000명×일일로그인이면 연 수십만 행 → 주기적 정리로 테이블 비대 방지.
-- 012(parking cleanup) 와 동일하게 pg_cron 사용.
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  n INTEGER;
BEGIN
  DELETE FROM login_logs WHERE logged_in_at < now() - interval '2 years';
  GET DIAGNOSTICS n = ROW_COUNT; deleted_count := deleted_count + n;

  DELETE FROM admin_access_logs WHERE created_at < now() - interval '2 years';
  GET DIAGNOSTICS n = ROW_COUNT; deleted_count := deleted_count + n;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 기존 스케줄 제거(멱등)
DO $$
DECLARE job_id BIGINT;
BEGIN
  SELECT jobid INTO job_id FROM cron.job WHERE jobname = 'villatolk-log-retention';
  IF job_id IS NOT NULL THEN PERFORM cron.unschedule(job_id); END IF;
END $$;

-- 매주 일요일 03:00 실행
SELECT cron.schedule('villatolk-log-retention', '0 3 * * 0', $$ SELECT cleanup_old_logs(); $$);
