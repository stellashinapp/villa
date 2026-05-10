-- ============================================================================
-- 016: admins INSERT 정책 추가
-- ----------------------------------------------------------------------------
-- 002_rls_policies.sql에서 admins 테이블 SELECT/UPDATE 정책만 정의되고
-- INSERT 정책이 누락되어, 회원가입 시 신규 admin row 삽입이 RLS에 의해
-- 차단되는 문제(`new row violates row-level security policy for table
-- "admins"`)를 해결한다.
--
-- 정책: 본인의 auth.uid()와 일치하는 auth_id로만 INSERT 가능.
-- 타인 명의로 admin row를 만들 수는 없도록 보호.
-- ============================================================================

CREATE POLICY admins_insert ON admins FOR INSERT
  WITH CHECK (auth_id = auth.uid());
