-- ============================================================================
-- 025: 누락된 RLS 정책 복원 (출시 차단급)
-- ----------------------------------------------------------------------------
-- 020 마이그레이션이 운영에 부분 적용된 상태.
--   admins, villas, units 의 정책은 정상 생성됨.
--   residents, bill_months, bill_items, payments, notices, messages,
--   message_replies, posts, comments, parking, subscriptions,
--   subscription_items, subscription_payments, villa_transfers 정책 없음.
-- RLS ON + 정책 0개 = 모든 SELECT/INSERT/UPDATE/DELETE 가 default deny.
-- 결과: 입주민 로그인·청구서 조회·민원 작성 등 핵심 흐름 전부 차단.
--
-- 020 SQL 의 누락분만 idempotent 하게 재생성. current_admin_id() 함수는
-- 020 에서 이미 생성되어 있음 (확인 완료).
-- ============================================================================

-- residents
DROP POLICY IF EXISTS residents_admin_select ON residents;
DROP POLICY IF EXISTS residents_admin_insert ON residents;
DROP POLICY IF EXISTS residents_admin_update ON residents;
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
DROP POLICY IF EXISTS bill_months_admin ON bill_months;
DROP POLICY IF EXISTS bill_items_admin ON bill_items;
DROP POLICY IF EXISTS payments_admin ON payments;
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
DROP POLICY IF EXISTS notices_admin ON notices;
DROP POLICY IF EXISTS messages_admin ON messages;
DROP POLICY IF EXISTS message_replies_admin ON message_replies;
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
DROP POLICY IF EXISTS posts_admin ON posts;
DROP POLICY IF EXISTS comments_admin ON comments;
CREATE POLICY posts_admin ON posts FOR ALL
  USING (villa_id IN (SELECT id FROM villas WHERE admin_id = current_admin_id()));
CREATE POLICY comments_admin ON comments FOR ALL
  USING (post_id IN (
    SELECT p.id FROM posts p JOIN villas v ON p.villa_id = v.id
    WHERE v.admin_id = current_admin_id()
  ));

-- parking
DROP POLICY IF EXISTS parking_admin ON parking;
CREATE POLICY parking_admin ON parking FOR ALL
  USING (villa_id IN (SELECT id FROM villas WHERE admin_id = current_admin_id()));

-- subscriptions / subscription_items / subscription_payments
DROP POLICY IF EXISTS subs_admin ON subscriptions;
DROP POLICY IF EXISTS sub_items_admin ON subscription_items;
DROP POLICY IF EXISTS sub_payments_admin ON subscription_payments;
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
DROP POLICY IF EXISTS transfers_admin ON villa_transfers;
CREATE POLICY transfers_admin ON villa_transfers FOR SELECT
  USING (
    from_admin_id = current_admin_id()
    OR to_admin_id = current_admin_id()
  );
