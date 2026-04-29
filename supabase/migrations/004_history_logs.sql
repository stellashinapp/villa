-- ==============================
-- 이력/로그 테이블 3개
-- ==============================

-- 1. 로그인 기록
CREATE TABLE login_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_type TEXT NOT NULL CHECK (user_type IN ('admin', 'resident')),
  user_id UUID,
  user_name TEXT,
  user_phone TEXT,
  villa_id UUID REFERENCES villas(id) ON DELETE SET NULL,
  ip_address TEXT,
  device_info TEXT,
  logged_in_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 관리비 변경 이력
CREATE TABLE bill_change_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_month_id UUID REFERENCES bill_months(id) ON DELETE CASCADE,
  villa_id UUID REFERENCES villas(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN (
    'month_created', 'month_published', 'month_closed',
    'item_added', 'item_removed', 'item_updated',
    'payment_confirmed', 'payment_cancelled',
    'notification_sent'
  )),
  detail TEXT,
  old_value TEXT,
  new_value TEXT,
  performed_by UUID REFERENCES admins(id),
  performed_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 알림 발송 이력
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  villa_id UUID REFERENCES villas(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'bill_published', 'payment_reminder', 'new_notice',
    'message_reply', 'new_message', 'payment_success',
    'payment_failed', 'visitor_parking_expiry'
  )),
  title TEXT NOT NULL,
  body TEXT,
  target_type TEXT CHECK (target_type IN ('all_residents', 'single_resident', 'admin')),
  target_count INTEGER DEFAULT 0,
  target_ho TEXT,
  success_count INTEGER DEFAULT 0,
  fail_count INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================
-- 인덱스
-- ==============================
CREATE INDEX idx_login_logs_user ON login_logs(user_type, user_id);
CREATE INDEX idx_login_logs_time ON login_logs(logged_in_at);
CREATE INDEX idx_login_logs_villa ON login_logs(villa_id);

CREATE INDEX idx_bill_change_month ON bill_change_logs(bill_month_id);
CREATE INDEX idx_bill_change_villa ON bill_change_logs(villa_id);
CREATE INDEX idx_bill_change_time ON bill_change_logs(performed_at);
CREATE INDEX idx_bill_change_action ON bill_change_logs(action);

CREATE INDEX idx_noti_logs_villa ON notification_logs(villa_id);
CREATE INDEX idx_noti_logs_type ON notification_logs(type);
CREATE INDEX idx_noti_logs_time ON notification_logs(sent_at);

-- ==============================
-- RLS
-- ==============================
ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_change_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- 로그인 기록: 관리자는 자기 빌라 관련만
CREATE POLICY login_logs_admin ON login_logs FOR SELECT
  USING (
    villa_id IN (SELECT id FROM villas WHERE admin_id = (SELECT id FROM admins WHERE auth_id = auth.uid()))
    OR user_id = (SELECT id FROM admins WHERE auth_id = auth.uid())
  );

-- 관리비 변경 이력: 자기 빌라만
CREATE POLICY bill_change_admin ON bill_change_logs FOR ALL
  USING (villa_id IN (SELECT id FROM villas WHERE admin_id = (SELECT id FROM admins WHERE auth_id = auth.uid())));

-- 알림 이력: 자기 빌라만
CREATE POLICY noti_logs_admin ON notification_logs FOR ALL
  USING (villa_id IN (SELECT id FROM villas WHERE admin_id = (SELECT id FROM admins WHERE auth_id = auth.uid())));
