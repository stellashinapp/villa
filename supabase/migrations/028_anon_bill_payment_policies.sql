-- ============================================================================
-- 028: anon (입주민 PWA) 의 청구서·납부 RLS 정책 보강
-- ----------------------------------------------------------------------------
-- 025 에서 admin 정책은 복원되었으나, anon (입주민) 의 청구서 조회/납부 INSERT
-- 정책이 없어서 PWA 입주민 관리비 페이지가 빈 화면으로 표시됨.
--
-- 데이터 흐름 종단 테스트 결과:
--   admin1 시점 bill_months 2건 / anon 시점 0건 → resident bills 페이지 깨짐
--   anon 으로 payments INSERT 시도 → RLS 차단 (42501)
--
-- 보안 모델 (security_pipa_pending 메모와 동일):
--   - anon 키 + 클라이언트 측 villa_id/unit_id 필터링
--   - 입주민이 다른 빌라 청구서를 보지 못하게 하려면 향후 SECURITY DEFINER 함수
--     또는 JWT 기반 정책 필요 (출시 전 PIPA 단계에서 처리)
--   - 현재는 messages / posts / parking 와 동일한 permissive 모델 적용
-- ============================================================================

-- bill_months: anon SELECT (published 또는 closed 만)
DROP POLICY IF EXISTS bill_months_anon_select ON bill_months;
CREATE POLICY bill_months_anon_select ON bill_months
  FOR SELECT TO anon
  USING (status IN ('published','closed'));

-- bill_items: anon SELECT (소속 bill_month 가 anon 에게 보이면 OK)
DROP POLICY IF EXISTS bill_items_anon_select ON bill_items;
CREATE POLICY bill_items_anon_select ON bill_items
  FOR SELECT TO anon
  USING (bill_month_id IN (
    SELECT id FROM bill_months WHERE status IN ('published','closed')
  ));

-- payments: anon SELECT + INSERT + UPDATE
DROP POLICY IF EXISTS payments_anon_select ON payments;
DROP POLICY IF EXISTS payments_anon_insert ON payments;
DROP POLICY IF EXISTS payments_anon_update ON payments;
CREATE POLICY payments_anon_select ON payments
  FOR SELECT TO anon
  USING (true);
CREATE POLICY payments_anon_insert ON payments
  FOR INSERT TO anon
  WITH CHECK (true);
CREATE POLICY payments_anon_update ON payments
  FOR UPDATE TO anon
  USING (true);

-- villas / units: anon SELECT (입주민 페이지가 villa 이름, 계좌, 호실 표시 필요)
-- 이미 020 에서 허용된 경우 idempotent
DROP POLICY IF EXISTS villas_anon_select ON villas;
DROP POLICY IF EXISTS units_anon_select ON units;
CREATE POLICY villas_anon_select ON villas FOR SELECT TO anon USING (true);
CREATE POLICY units_anon_select ON units FOR SELECT TO anon USING (true);
