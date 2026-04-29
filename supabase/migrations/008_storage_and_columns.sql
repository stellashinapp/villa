-- ==============================
-- 사진/파일 저장을 위한 추가 컬럼 + Storage 정책
-- ==============================

-- 1. 빌라 대표 사진
ALTER TABLE villas ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. 공지사항 첨부 이미지
ALTER TABLE notices ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 3. 관리자 프로필 사진
ALTER TABLE admins ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 4. 관리비 고지서 PDF
ALTER TABLE bill_months ADD COLUMN IF NOT EXISTS document_url TEXT;

-- 5. 알림 발송 이력 테이블
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  villa_id UUID REFERENCES villas(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  target_count INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- 6. 관리비 변경 이력
CREATE TABLE IF NOT EXISTS bill_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_month_id UUID REFERENCES bill_months(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  detail TEXT,
  performed_by UUID REFERENCES admins(id),
  performed_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_notification_logs_villa ON notification_logs(villa_id);
CREATE INDEX IF NOT EXISTS idx_bill_audit_villa ON bill_audit_logs(bill_month_id);

-- RLS
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY notification_logs_admin ON notification_logs FOR ALL
  USING (villa_id IN (SELECT id FROM villas WHERE admin_id = (SELECT id FROM admins WHERE auth_id = auth.uid())));

CREATE POLICY bill_audit_admin ON bill_audit_logs FOR ALL
  USING (bill_month_id IN (
    SELECT bm.id FROM bill_months bm JOIN villas v ON bm.villa_id = v.id
    WHERE v.admin_id = (SELECT id FROM admins WHERE auth_id = auth.uid())
  ));
