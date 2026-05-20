-- ============================================================================
-- 030: 관리비 결제 스캐폴딩 — TossPayments 연동 대비
-- ----------------------------------------------------------------------------
-- ① 일회성 결제 (카드/실시간계좌이체): payments 에 PG 거래 추적 컬럼 추가
-- ② 카드 자동결제 (빌링키): resident_billing_keys 테이블 + payments.auto_paid
--
-- 운영키 발급 전까지는 코드가 stub 으로 동작하고, 키가 오면 결제창/빌링 호출만
-- 끼우면 바로 작동하도록 스키마를 미리 준비.
-- 보안 모델: anon(입주민 PWA) permissive — 출시 전 PIPA 단계에서 강화 ([[security-pipa-pending]])
-- ============================================================================

-- ① payments — PG 거래 추적
ALTER TABLE payments ADD COLUMN IF NOT EXISTS pg_provider TEXT;           -- 'toss'
ALTER TABLE payments ADD COLUMN IF NOT EXISTS pg_payment_key TEXT;        -- TossPayments paymentKey
ALTER TABLE payments ADD COLUMN IF NOT EXISTS pg_order_id TEXT;           -- 가맹점 주문번호
ALTER TABLE payments ADD COLUMN IF NOT EXISTS pg_status TEXT;             -- ready/done/canceled/failed
ALTER TABLE payments ADD COLUMN IF NOT EXISTS auto_paid BOOLEAN DEFAULT false; -- 빌링키 자동결제 여부

COMMENT ON COLUMN payments.method IS
  'bank_transfer(수동 계좌이체) / card(카드) / transfer(실시간계좌이체) / auto_card(자동결제) / cash';
COMMENT ON COLUMN payments.pg_payment_key IS 'TossPayments paymentKey — 결제 승인/취소 시 사용';

-- ② 입주민 카드 빌링키 (자동결제용)
CREATE TABLE IF NOT EXISTS resident_billing_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  villa_id UUID REFERENCES villas(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'toss',
  billing_key TEXT NOT NULL,            -- TossPayments billingKey
  customer_key TEXT,                    -- 가맹점 고객 식별키
  card_company TEXT,
  card_last4 TEXT,
  card_expiry TEXT,                     -- 'YYYY-MM'
  auto_pay_enabled BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','disabled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(resident_id)
);

CREATE INDEX IF NOT EXISTS idx_billing_keys_villa ON resident_billing_keys (villa_id);

ALTER TABLE resident_billing_keys ENABLE ROW LEVEL SECURITY;

-- anon(입주민) permissive — 본인 빌링키 관리 (PIPA 단계에서 unit_id 검증 강화 예정)
DROP POLICY IF EXISTS billing_keys_anon_all ON resident_billing_keys;
CREATE POLICY billing_keys_anon_all ON resident_billing_keys
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- 관리자: 자기 빌라 입주민 빌링키 조회 (자동결제 현황 파악)
DROP POLICY IF EXISTS billing_keys_admin_select ON resident_billing_keys;
CREATE POLICY billing_keys_admin_select ON resident_billing_keys
  FOR SELECT TO authenticated
  USING (villa_id IN (SELECT id FROM villas WHERE admin_id = current_admin_id()));
