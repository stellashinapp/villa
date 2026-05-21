-- ============================================================================
-- 032: 1000+ 관리자 / 1년 데이터 대비 인덱스 보강 (018 후속)
-- ----------------------------------------------------------------------------
-- 018 이 messages/notices/posts/payments(unit) 는 커버했으나 아래 핫패스가 누락.
-- 데이터가 쌓일수록(빌라×12개월 청구서, 수만 입주민) 풀스캔 → 느려짐.
-- 모두 IF NOT EXISTS 로 멱등.
-- ============================================================================

-- bill_months: 홈/집계 = status+최근월, 빌라상세 = villa_id+최근월
CREATE INDEX IF NOT EXISTS idx_bill_months_villa_ym
  ON bill_months (villa_id, year_month DESC);
CREATE INDEX IF NOT EXISTS idx_bill_months_status_ym
  ON bill_months (status, year_month DESC);

-- bill_items / payments: bill_month_id 로 묶어서 조회 (FK 자동 인덱스 없음)
CREATE INDEX IF NOT EXISTS idx_bill_items_month
  ON bill_items (bill_month_id);
CREATE INDEX IF NOT EXISTS idx_payments_bill_month
  ON payments (bill_month_id);

-- residents: 관리자 화면이 unit_id 조인 + status 필터 (pending/active)
CREATE INDEX IF NOT EXISTS idx_residents_unit_status
  ON residents (unit_id, status);
-- 입주민 로그인 매칭: name + phone
CREATE INDEX IF NOT EXISTS idx_residents_name_phone
  ON residents (name, phone);

-- units: villa 단위 조회/조인
CREATE INDEX IF NOT EXISTS idx_units_villa
  ON units (villa_id);

-- subscriptions: billing-cron 이 매일 billing_day+status+billing_key 로 스캔
CREATE INDEX IF NOT EXISTS idx_subscriptions_billing_day
  ON subscriptions (billing_day, status)
  WHERE billing_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_admin
  ON subscriptions (admin_id);

-- 미답변 민원 카운트 (홈 알림): villa_id + is_read=false
CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON messages (villa_id)
  WHERE is_read = false;

-- 로그 테이블: 시간순 조회 + 보관/정리(retention) 효율
-- (admin_access_logs(created_at) 인덱스는 022 에 이미 존재)
CREATE INDEX IF NOT EXISTS idx_login_logs_logged_in_at
  ON login_logs (logged_in_at DESC);
