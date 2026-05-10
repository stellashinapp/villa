-- ============================================================================
-- 020: RLS 성능 최적화 — 10만+ 사용자 대비
-- ============================================================================
-- 기존 002 의 정책은 매 row 마다 nested SELECT 가 실행되어 부하가 큼.
--
-- 적용 기법:
-- 1) auth.uid() 를 (SELECT auth.uid()) 로 감싸 InitPlan 캐싱 유도
--    → Postgres 가 쿼리당 1회만 실행 (Supabase 공식 권장)
-- 2) admin id 룩업을 STABLE SECURITY DEFINER 함수로 추출
--    → 같은 쿼리 안에서 자동 메모이즈, RLS 재귀 회피
--
-- 참고: https://supabase.com/docs/guides/database/postgres/row-level-security
-- ============================================================================

-- ── 헬퍼 함수: 현재 인증된 admin 의 id ─────────────────────────────────────
-- STABLE: 같은 트랜잭션 안에서 결과 변하지 않음 (쿼리당 1회 실행)
-- SECURITY DEFINER: admins 테이블 RLS 우회 (재귀 방지)
-- search_path 고정: SQL injection / 검색경로 하이재킹 방어

CREATE OR REPLACE FUNCTION public.current_admin_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM admins WHERE auth_id = (SELECT auth.uid())
$$;

GRANT EXECUTE ON FUNCTION public.current_admin_id() TO authenticated, anon;

-- ── 기존 정책 모두 DROP ────────────────────────────────────────────────────

DROP POLICY IF EXISTS admins_select ON admins;
DROP POLICY IF EXISTS admins_update ON admins;

DROP POLICY IF EXISTS villas_admin_select ON villas;
DROP POLICY IF EXISTS villas_admin_insert ON villas;
DROP POLICY IF EXISTS villas_admin_update ON villas;
DROP POLICY IF EXISTS villas_admin_delete ON villas;

DROP POLICY IF EXISTS units_admin_select ON units;
DROP POLICY IF EXISTS units_admin_insert ON units;
DROP POLICY IF EXISTS units_admin_update ON units;
DROP POLICY IF EXISTS units_admin_delete ON units;

DROP POLICY IF EXISTS residents_admin_select ON residents;
DROP POLICY IF EXISTS residents_admin_insert ON residents;
DROP POLICY IF EXISTS residents_admin_update ON residents;

DROP POLICY IF EXISTS bill_months_admin ON bill_months;
DROP POLICY IF EXISTS bill_items_admin ON bill_items;
DROP POLICY IF EXISTS payments_admin ON payments;

DROP POLICY IF EXISTS notices_admin ON notices;
DROP POLICY IF EXISTS messages_admin ON messages;
DROP POLICY IF EXISTS message_replies_admin ON message_replies;

DROP POLICY IF EXISTS posts_admin ON posts;
DROP POLICY IF EXISTS comments_admin ON comments;

DROP POLICY IF EXISTS parking_admin ON parking;

DROP POLICY IF EXISTS subs_admin ON subscriptions;
DROP POLICY IF EXISTS sub_items_admin ON subscription_items;
DROP POLICY IF EXISTS sub_payments_admin ON subscription_payments;

DROP POLICY IF EXISTS transfers_admin ON villa_transfers;

-- ── 재생성: (SELECT auth.uid()) + current_admin_id() 사용 ───────────────────

-- admins
CREATE POLICY admins_select ON admins FOR SELECT
  USING (auth_id = (SELECT auth.uid()));
CREATE POLICY admins_update ON admins FOR UPDATE
  USING (auth_id = (SELECT auth.uid()));

-- villas
CREATE POLICY villas_admin_select ON villas FOR SELECT
  USING (admin_id = current_admin_id());
CREATE POLICY villas_admin_insert ON villas FOR INSERT
  WITH CHECK (admin_id = current_admin_id());
CREATE POLICY villas_admin_update ON villas FOR UPDATE
  USING (admin_id = current_admin_id());
CREATE POLICY villas_admin_delete ON villas FOR DELETE
  USING (admin_id = current_admin_id());

-- units
CREATE POLICY units_admin_select ON units FOR SELECT
  USING (villa_id IN (SELECT id FROM villas WHERE admin_id = current_admin_id()));
CREATE POLICY units_admin_insert ON units FOR INSERT
  WITH CHECK (villa_id IN (SELECT id FROM villas WHERE admin_id = current_admin_id()));
CREATE POLICY units_admin_update ON units FOR UPDATE
  USING (villa_id IN (SELECT id FROM villas WHERE admin_id = current_admin_id()));
CREATE POLICY units_admin_delete ON units FOR DELETE
  USING (villa_id IN (SELECT id FROM villas WHERE admin_id = current_admin_id()));

-- residents
CREATE POLICY residents_admin_select ON residents FOR SELECT
  USING (unit_id IN (
    SELECT u.id FROM units u JOIN villas v ON u.villa_id = v.id
    WHERE v.admin_id = current_admin_id()
  ));
CREATE POLICY residents_admin_insert ON residents FOR INSERT
  WITH CHECK (unit_id IN (
    SELECT u.id FROM units u JOIN villas v ON u.villa_id = v.id
    WHERE v.admin_id = current_admin_id()
  ));
CREATE POLICY residents_admin_update ON residents FOR UPDATE
  USING (unit_id IN (
    SELECT u.id FROM units u JOIN villas v ON u.villa_id = v.id
    WHERE v.admin_id = current_admin_id()
  ));

-- bill_months / bill_items / payments
CREATE POLICY bill_months_admin ON bill_months FOR ALL
  USING (villa_id IN (SELECT id FROM villas WHERE admin_id = current_admin_id()));

CREATE POLICY bill_items_admin ON bill_items FOR ALL
  USING (bill_month_id IN (
    SELECT bm.id FROM bill_months bm JOIN villas v ON bm.villa_id = v.id
    WHERE v.admin_id = current_admin_id()
  ));

CREATE POLICY payments_admin ON payments FOR ALL
  USING (bill_month_id IN (
    SELECT bm.id FROM bill_months bm JOIN villas v ON bm.villa_id = v.id
    WHERE v.admin_id = current_admin_id()
  ));

-- notices / messages / message_replies
CREATE POLICY notices_admin ON notices FOR ALL
  USING (villa_id IN (SELECT id FROM villas WHERE admin_id = current_admin_id()));

CREATE POLICY messages_admin ON messages FOR ALL
  USING (villa_id IN (SELECT id FROM villas WHERE admin_id = current_admin_id()));

CREATE POLICY message_replies_admin ON message_replies FOR ALL
  USING (message_id IN (
    SELECT m.id FROM messages m JOIN villas v ON m.villa_id = v.id
    WHERE v.admin_id = current_admin_id()
  ));

-- posts / comments
CREATE POLICY posts_admin ON posts FOR ALL
  USING (villa_id IN (SELECT id FROM villas WHERE admin_id = current_admin_id()));

CREATE POLICY comments_admin ON comments FOR ALL
  USING (post_id IN (
    SELECT p.id FROM posts p JOIN villas v ON p.villa_id = v.id
    WHERE v.admin_id = current_admin_id()
  ));

-- parking
CREATE POLICY parking_admin ON parking FOR ALL
  USING (villa_id IN (SELECT id FROM villas WHERE admin_id = current_admin_id()));

-- subscriptions
CREATE POLICY subs_admin ON subscriptions FOR ALL
  USING (admin_id = current_admin_id());

CREATE POLICY sub_items_admin ON subscription_items FOR ALL
  USING (subscription_id IN (
    SELECT id FROM subscriptions WHERE admin_id = current_admin_id()
  ));

CREATE POLICY sub_payments_admin ON subscription_payments FOR ALL
  USING (subscription_id IN (
    SELECT id FROM subscriptions WHERE admin_id = current_admin_id()
  ));

-- villa_transfers
CREATE POLICY transfers_admin ON villa_transfers FOR SELECT
  USING (
    from_admin_id = current_admin_id()
    OR to_admin_id = current_admin_id()
  );

-- ── 016 의 admins_insert 정책도 동일하게 wrap ────────────────────────────
DROP POLICY IF EXISTS admins_insert ON admins;
CREATE POLICY admins_insert ON admins FOR INSERT
  WITH CHECK (auth_id = (SELECT auth.uid()));
