-- ==============================
-- RLS 정책 (기술명세서 v2.0 Chapter 5)
-- ==============================

-- 모든 테이블 RLS 활성화
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE villas ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_months ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE villa_transfers ENABLE ROW LEVEL SECURITY;

-- ==============================
-- 관리자(admin) 정책: 자기 데이터만
-- ==============================

-- admins: 본인 정보만
CREATE POLICY admins_select ON admins FOR SELECT
  USING (auth_id = auth.uid());
CREATE POLICY admins_update ON admins FOR UPDATE
  USING (auth_id = auth.uid());

-- villas: 본인 빌라만
CREATE POLICY villas_admin_select ON villas FOR SELECT
  USING (admin_id = (SELECT id FROM admins WHERE auth_id = auth.uid()));
CREATE POLICY villas_admin_insert ON villas FOR INSERT
  WITH CHECK (admin_id = (SELECT id FROM admins WHERE auth_id = auth.uid()));
CREATE POLICY villas_admin_update ON villas FOR UPDATE
  USING (admin_id = (SELECT id FROM admins WHERE auth_id = auth.uid()));
CREATE POLICY villas_admin_delete ON villas FOR DELETE
  USING (admin_id = (SELECT id FROM admins WHERE auth_id = auth.uid()));

-- units: 본인 빌라의 세대만
CREATE POLICY units_admin_select ON units FOR SELECT
  USING (villa_id IN (SELECT id FROM villas WHERE admin_id = (SELECT id FROM admins WHERE auth_id = auth.uid())));
CREATE POLICY units_admin_insert ON units FOR INSERT
  WITH CHECK (villa_id IN (SELECT id FROM villas WHERE admin_id = (SELECT id FROM admins WHERE auth_id = auth.uid())));
CREATE POLICY units_admin_update ON units FOR UPDATE
  USING (villa_id IN (SELECT id FROM villas WHERE admin_id = (SELECT id FROM admins WHERE auth_id = auth.uid())));
CREATE POLICY units_admin_delete ON units FOR DELETE
  USING (villa_id IN (SELECT id FROM villas WHERE admin_id = (SELECT id FROM admins WHERE auth_id = auth.uid())));

-- residents: 본인 빌라 세대의 입주민만
CREATE POLICY residents_admin_select ON residents FOR SELECT
  USING (unit_id IN (
    SELECT u.id FROM units u JOIN villas v ON u.villa_id = v.id
    WHERE v.admin_id = (SELECT id FROM admins WHERE auth_id = auth.uid())
  ));
CREATE POLICY residents_admin_insert ON residents FOR INSERT
  WITH CHECK (unit_id IN (
    SELECT u.id FROM units u JOIN villas v ON u.villa_id = v.id
    WHERE v.admin_id = (SELECT id FROM admins WHERE auth_id = auth.uid())
  ));
CREATE POLICY residents_admin_update ON residents FOR UPDATE
  USING (unit_id IN (
    SELECT u.id FROM units u JOIN villas v ON u.villa_id = v.id
    WHERE v.admin_id = (SELECT id FROM admins WHERE auth_id = auth.uid())
  ));

-- bill_months, bill_items, payments: 본인 빌라 관련만
CREATE POLICY bill_months_admin ON bill_months FOR ALL
  USING (villa_id IN (SELECT id FROM villas WHERE admin_id = (SELECT id FROM admins WHERE auth_id = auth.uid())));

CREATE POLICY bill_items_admin ON bill_items FOR ALL
  USING (bill_month_id IN (
    SELECT bm.id FROM bill_months bm JOIN villas v ON bm.villa_id = v.id
    WHERE v.admin_id = (SELECT id FROM admins WHERE auth_id = auth.uid())
  ));

CREATE POLICY payments_admin ON payments FOR ALL
  USING (bill_month_id IN (
    SELECT bm.id FROM bill_months bm JOIN villas v ON bm.villa_id = v.id
    WHERE v.admin_id = (SELECT id FROM admins WHERE auth_id = auth.uid())
  ));

-- notices, messages, message_replies: 본인 빌라 관련
CREATE POLICY notices_admin ON notices FOR ALL
  USING (villa_id IN (SELECT id FROM villas WHERE admin_id = (SELECT id FROM admins WHERE auth_id = auth.uid())));

CREATE POLICY messages_admin ON messages FOR ALL
  USING (villa_id IN (SELECT id FROM villas WHERE admin_id = (SELECT id FROM admins WHERE auth_id = auth.uid())));

CREATE POLICY message_replies_admin ON message_replies FOR ALL
  USING (message_id IN (
    SELECT m.id FROM messages m JOIN villas v ON m.villa_id = v.id
    WHERE v.admin_id = (SELECT id FROM admins WHERE auth_id = auth.uid())
  ));

-- posts, comments: 본인 빌라 관련
CREATE POLICY posts_admin ON posts FOR ALL
  USING (villa_id IN (SELECT id FROM villas WHERE admin_id = (SELECT id FROM admins WHERE auth_id = auth.uid())));

CREATE POLICY comments_admin ON comments FOR ALL
  USING (post_id IN (
    SELECT p.id FROM posts p JOIN villas v ON p.villa_id = v.id
    WHERE v.admin_id = (SELECT id FROM admins WHERE auth_id = auth.uid())
  ));

-- parking: 본인 빌라 관련
CREATE POLICY parking_admin ON parking FOR ALL
  USING (villa_id IN (SELECT id FROM villas WHERE admin_id = (SELECT id FROM admins WHERE auth_id = auth.uid())));

-- subscriptions: 본인 구독만
CREATE POLICY subs_admin ON subscriptions FOR ALL
  USING (admin_id = (SELECT id FROM admins WHERE auth_id = auth.uid()));

CREATE POLICY sub_items_admin ON subscription_items FOR ALL
  USING (subscription_id IN (
    SELECT id FROM subscriptions WHERE admin_id = (SELECT id FROM admins WHERE auth_id = auth.uid())
  ));

CREATE POLICY sub_payments_admin ON subscription_payments FOR ALL
  USING (subscription_id IN (
    SELECT id FROM subscriptions WHERE admin_id = (SELECT id FROM admins WHERE auth_id = auth.uid())
  ));

-- villa_transfers: 본인 관련 이전만 조회
CREATE POLICY transfers_admin ON villa_transfers FOR SELECT
  USING (
    from_admin_id = (SELECT id FROM admins WHERE auth_id = auth.uid())
    OR to_admin_id = (SELECT id FROM admins WHERE auth_id = auth.uid())
  );

-- ==============================
-- 입주민 RLS: Edge Function에서 service_role로 처리
-- (입주민은 Supabase Auth를 사용하지 않음)
-- ==============================
