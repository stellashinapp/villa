-- ============================================================================
-- 018: 10만명 규모 대비 제약/인덱스 보강
-- ============================================================================

-- ── 1. admins 식별자 중복 방지 ──────────────────────────────────────────────
-- 같은 이메일 / 전화번호로 여러 admin 계정 만드는 것 차단.
-- 빈 문자열은 unique 위반에서 제외(NOT NULL 도 부재).
-- partial unique index 로 NULL/빈문자 허용.

CREATE UNIQUE INDEX IF NOT EXISTS admins_email_unique
  ON admins (LOWER(email))
  WHERE email IS NOT NULL AND email <> '';

CREATE UNIQUE INDEX IF NOT EXISTS admins_phone_unique
  ON admins (phone)
  WHERE phone IS NOT NULL AND phone <> '';

-- ── 2. 시간순 정렬 핵심 쿼리용 복합 인덱스 ────────────────────────────────
-- messages/notices/posts 는 빌라당 최신 N건 노출이 기본 사용 패턴.
-- (villa_id, created_at DESC) 복합 인덱스로 인덱스만으로 정렬 처리.

CREATE INDEX IF NOT EXISTS idx_messages_villa_created
  ON messages (villa_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notices_villa_created
  ON notices (villa_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_villa_created
  ON posts (villa_id, created_at DESC);

-- ── 3. parking 만료 처리 cron 효율 ────────────────────────────────────────
-- cleanup_expired_parking() 매 시간 실행 시 expires_at 인덱스 필요.

CREATE INDEX IF NOT EXISTS idx_parking_expires
  ON parking (expires_at)
  WHERE expires_at IS NOT NULL;

-- ── 4. residents 전화번호 정규화 보장 ─────────────────────────────────────
-- 입주민 로그인 시 phone+name 매칭. 전화번호 형식 통일 필수.
-- 트리거로 자동 정규화 (하이픈/공백 제거).

CREATE OR REPLACE FUNCTION normalize_resident_phone()
RETURNS TRIGGER AS $$
BEGIN
  NEW.phone = REGEXP_REPLACE(COALESCE(NEW.phone, ''), '\D', '', 'g');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_residents_phone_normalize ON residents;
CREATE TRIGGER tr_residents_phone_normalize
  BEFORE INSERT OR UPDATE OF phone ON residents
  FOR EACH ROW EXECUTE FUNCTION normalize_resident_phone();

-- admins 도 같은 정규화
DROP TRIGGER IF EXISTS tr_admins_phone_normalize ON admins;
CREATE TRIGGER tr_admins_phone_normalize
  BEFORE INSERT OR UPDATE OF phone ON admins
  FOR EACH ROW EXECUTE FUNCTION normalize_resident_phone();

-- ── 5. payments 조회 최적화 ───────────────────────────────────────────────
-- 입주민 본인 납부 이력 조회: WHERE unit_id = ? AND is_paid = true ORDER BY paid_at DESC.

CREATE INDEX IF NOT EXISTS idx_payments_unit_paid
  ON payments (unit_id, is_paid, paid_at DESC);
