-- ==============================
-- 만료된 방문차량 자동 정리
-- ==============================
-- parking.expires_at < now() 인 visitor 차량을 매시간 삭제

-- 인덱스: expires_at 조회 최적화
CREATE INDEX IF NOT EXISTS idx_parking_expires_at
  ON parking (expires_at)
  WHERE vehicle_type = 'visitor' AND expires_at IS NOT NULL;

-- 정리 함수
CREATE OR REPLACE FUNCTION cleanup_expired_parking()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM parking
  WHERE vehicle_type = 'visitor'
    AND expires_at IS NOT NULL
    AND expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 기존 스케줄 제거 (멱등)
DO $$
DECLARE
  job_id BIGINT;
BEGIN
  SELECT jobid INTO job_id FROM cron.job WHERE jobname = 'villatolk-parking-cleanup';
  IF job_id IS NOT NULL THEN
    PERFORM cron.unschedule(job_id);
  END IF;
END $$;

-- 매시간 정시 실행
SELECT cron.schedule(
  'villatolk-parking-cleanup',
  '0 * * * *',
  $$ SELECT cleanup_expired_parking(); $$
);

-- 조회: SELECT jobname, schedule FROM cron.job WHERE jobname LIKE 'villatolk-%';
