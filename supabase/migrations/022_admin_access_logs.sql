-- ============================================================================
-- 022: 관리자 콘솔(admin-web) 접근 로그
-- ----------------------------------------------------------------------------
-- 개인정보보호법 제29조 (안전성 확보조치) 의 "접근기록 1년 이상 보관" 의무
-- 충족을 위해 admin-web 의 PII 노출 페이지(/residents, /admins 등) 진입 시
-- 누가 언제 어떤 페이지를 봤는지 기록.
--
-- viewer_email: admin-web 에 로그인한 사용자의 이메일 (cookie 기반)
-- viewer_admin_id: admins 테이블의 id 참조 (식별 가능 시)
-- path: 접근한 페이지 경로
-- payload: 추가 컨텍스트 (reveal 토글 여부, 필터 조건 등)
--
-- service_role 만 INSERT 가능 (admin-web 서버 사이드에서만 기록).
-- 일반 관리자는 자기 자신의 로그만 SELECT 가능.
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_email TEXT,
  viewer_admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
  path TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_access_logs_created_at
  ON admin_access_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_access_logs_viewer
  ON admin_access_logs (viewer_email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_access_logs_path
  ON admin_access_logs (path, created_at DESC);

ALTER TABLE admin_access_logs ENABLE ROW LEVEL SECURITY;

-- 자기 자신의 로그만 조회 가능 (감사 요청 시 자신의 활동 확인용)
DROP POLICY IF EXISTS admin_access_logs_own_select ON admin_access_logs;
CREATE POLICY admin_access_logs_own_select ON admin_access_logs FOR SELECT
  USING (viewer_admin_id = current_admin_id());

-- INSERT/UPDATE/DELETE 는 service_role 만 (admin-web 서버 사이드에서 처리).
-- 정책 없음 = 일반 사용자는 INSERT/UPDATE/DELETE 거부.

COMMENT ON TABLE admin_access_logs IS
  '관리자 콘솔(admin-web) PII 노출 페이지 접근 기록. 개인정보보호법 제29조 접근기록 보관 의무 충족용. 1년 이상 보관.';
