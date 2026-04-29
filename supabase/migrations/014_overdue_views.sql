-- ==============================
-- 누적 미납 금액 집계 view
-- ==============================
-- payments 테이블 + bill_months/units 조인하여 호실/빌라/관리자 단위 미납 합산.
-- draft 월은 제외 (아직 고지 전). published/closed 월의 is_paid=false 만 집계.

-- 1) 호실별 누적 미납
CREATE OR REPLACE VIEW unit_overdue_summary AS
SELECT
  u.id                                AS unit_id,
  u.villa_id                          AS villa_id,
  u.ho_number                         AS ho_number,
  COUNT(p.id) FILTER (
    WHERE p.is_paid = false
      AND bm.status IN ('published', 'closed')
  )                                   AS overdue_count,
  COALESCE(SUM(p.amount) FILTER (
    WHERE p.is_paid = false
      AND bm.status IN ('published', 'closed')
  ), 0)::INTEGER                      AS overdue_amount,
  MIN(bm.due_date) FILTER (
    WHERE p.is_paid = false
      AND bm.status IN ('published', 'closed')
  )                                   AS oldest_due_date
FROM units u
LEFT JOIN payments p     ON p.unit_id = u.id
LEFT JOIN bill_months bm ON bm.id = p.bill_month_id
GROUP BY u.id, u.villa_id, u.ho_number;

-- 2) 빌라별 누적 미납
CREATE OR REPLACE VIEW villa_overdue_summary AS
SELECT
  v.id                  AS villa_id,
  v.admin_id            AS admin_id,
  v.name                AS villa_name,
  COUNT(DISTINCT u.id) FILTER (WHERE us.overdue_count > 0)
                        AS overdue_unit_count,
  COALESCE(SUM(us.overdue_amount), 0)::INTEGER
                        AS overdue_amount_total,
  COALESCE(SUM(us.overdue_count), 0)::INTEGER
                        AS overdue_bill_count
FROM villas v
LEFT JOIN units u                 ON u.villa_id = v.id
LEFT JOIN unit_overdue_summary us ON us.unit_id = u.id
GROUP BY v.id, v.admin_id, v.name;

-- 3) 관리자별 누적 미납 (super admin/대시보드용)
CREATE OR REPLACE VIEW admin_overdue_summary AS
SELECT
  a.id                   AS admin_id,
  a.name                 AS admin_name,
  COUNT(DISTINCT v.id) FILTER (WHERE vos.overdue_amount_total > 0)
                         AS villas_with_overdue,
  COALESCE(SUM(vos.overdue_amount_total), 0)::INTEGER
                         AS overdue_amount_total
FROM admins a
LEFT JOIN villas v                   ON v.admin_id = a.id
LEFT JOIN villa_overdue_summary vos  ON vos.villa_id = v.id
GROUP BY a.id, a.name;

-- view는 RLS 직접 적용 X. 호출 시 SECURITY DEFINER RPC 또는 underlying table RLS 의존.
COMMENT ON VIEW unit_overdue_summary  IS '호실 단위 누적 미납 (published/closed 월만)';
COMMENT ON VIEW villa_overdue_summary IS '빌라 단위 누적 미납 합산';
COMMENT ON VIEW admin_overdue_summary IS '관리자별 누적 미납 합산';
