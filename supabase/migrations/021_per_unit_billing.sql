-- ============================================================================
-- 021: 세대별 차등 청구 + 단순 금액 모드
-- ============================================================================
-- 기존: bill_items 에 공통 항목(전기료/수도료 등)을 적고 세대수로 균등 분배.
-- 추가:
--   - 단순 금액 모드: 항목 안 쓰고 '세대당 ₩' 만 입력
--   - 세대별 차등: 호실마다 다른 금액 가능 (예: 옥탑 추가, 가게 다른 요율)
--
-- 구현:
--   bill_months 에 두 컬럼 추가
--   - billing_mode: 'equal' (기본/항목별 균등) | 'per_unit' (세대별 직접 입력)
--   - per_unit_amounts: JSONB 매핑 { "101호": 50000, "102호": 60000 }
--
--   billing_mode='per_unit' 일 때 publishBill 은 bill_items 를 무시하고
--   per_unit_amounts 의 값을 그대로 payments.amount 로 INSERT.
-- ============================================================================

ALTER TABLE bill_months
  ADD COLUMN IF NOT EXISTS billing_mode TEXT DEFAULT 'equal'
  CHECK (billing_mode IN ('equal', 'per_unit'));

ALTER TABLE bill_months
  ADD COLUMN IF NOT EXISTS per_unit_amounts JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN bill_months.billing_mode IS
  'equal: bill_items 기반 균등 분배 / per_unit: per_unit_amounts 직접 사용';
COMMENT ON COLUMN bill_months.per_unit_amounts IS
  '호실 → 금액 매핑 (per_unit 모드에서 사용). 예: {"101호": 50000, "201호": 60000}';
