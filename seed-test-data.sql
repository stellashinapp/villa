-- 빌라톡 테스트 시딩 데이터
-- 회사·관리자·입주민 시뮬레이션

-- 1. 관리자 (auth.users는 별도. admins 테이블만 시딩)
INSERT INTO admins (id, auth_id, email, name, phone, role, created_at) VALUES
  ('11111111-1111-1111-1111-111111111111', '11111111-aaaa-1111-1111-111111111111', 'kim@villa.kr', '김철수', '01012340001', 'admin', NOW() - INTERVAL '3 months'),
  ('22222222-2222-2222-2222-222222222222', '22222222-aaaa-2222-2222-222222222222', 'park@villa.kr', '박영희', '01012340002', 'admin', NOW() - INTERVAL '2 months'),
  ('33333333-3333-3333-3333-333333333333', '33333333-aaaa-3333-3333-333333333333', 'lee@villa.kr', '이민호', '01012340003', 'admin', NOW() - INTERVAL '1 month')
ON CONFLICT (id) DO NOTHING;

-- 2. 빌라 5개
INSERT INTO villas (id, admin_id, name, address, total_units, units_per_floor, account_bank, account_number, account_holder, status, created_at) VALUES
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '선릉파크빌', '서울 강남구 선릉로 123', 8, 2, '국민은행', '123-456-789012', '김철수', 'active', NOW() - INTERVAL '3 months'),
  ('a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '역삼그린빌', '서울 강남구 역삼동 456', 12, 2, '신한은행', '110-987-654321', '김철수', 'active', NOW() - INTERVAL '2 months'),
  ('b1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '잠실리버뷰', '서울 송파구 잠실동 789', 15, 3, '우리은행', '1002-456-7890', '박영희', 'active', NOW() - INTERVAL '2 months'),
  ('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '강남힐스테이트', '서울 강남구 논현동 11', 20, 2, '하나은행', '234-567-890123', '박영희', 'active', NOW() - INTERVAL '1 month'),
  ('c1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', '성북아트빌', '서울 성북구 성북동 88', 6, 2, '농협', '301-1234-5678', '이민호', 'active', NOW() - INTERVAL '20 days')
ON CONFLICT (id) DO NOTHING;

-- 3. 세대 자동 생성 (각 빌라당)
DO $$
DECLARE
  v RECORD;
  i INT;
  floor_num INT;
  unit_num INT;
BEGIN
  FOR v IN SELECT id, total_units, units_per_floor FROM villas WHERE id IN (
    'a1111111-1111-1111-1111-111111111111',
    'a2222222-2222-2222-2222-222222222222',
    'b1111111-1111-1111-1111-111111111111',
    'b2222222-2222-2222-2222-222222222222',
    'c1111111-1111-1111-1111-111111111111'
  ) LOOP
    FOR i IN 1..v.total_units LOOP
      floor_num := ((i - 1) / v.units_per_floor) + 1;
      unit_num := ((i - 1) % v.units_per_floor) + 1;
      INSERT INTO units (villa_id, ho_number, floor) VALUES (
        v.id,
        floor_num || LPAD(unit_num::text, 2, '0'),
        floor_num
      ) ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- 4. 입주민 (각 빌라 첫 4세대만 입주)
INSERT INTO residents (unit_id, name, phone, is_owner, status)
SELECT
  u.id,
  CASE
    WHEN ROW_NUMBER() OVER (PARTITION BY u.villa_id ORDER BY u.ho_number) = 1 THEN '홍길동'
    WHEN ROW_NUMBER() OVER (PARTITION BY u.villa_id ORDER BY u.ho_number) = 2 THEN '김순자'
    WHEN ROW_NUMBER() OVER (PARTITION BY u.villa_id ORDER BY u.ho_number) = 3 THEN '이영자'
    ELSE '박철수'
  END,
  '010' || LPAD((1000 + (ROW_NUMBER() OVER ())::int)::text, 4, '0') || LPAD((2000 + (ROW_NUMBER() OVER ())::int)::text, 4, '0'),
  true,
  'active'
FROM units u
WHERE u.villa_id IN (
  'a1111111-1111-1111-1111-111111111111',
  'a2222222-2222-2222-2222-222222222222',
  'b1111111-1111-1111-1111-111111111111',
  'b2222222-2222-2222-2222-222222222222',
  'c1111111-1111-1111-1111-111111111111'
)
AND ROW_NUMBER() OVER (PARTITION BY u.villa_id ORDER BY u.ho_number) <= 4
ON CONFLICT DO NOTHING;

-- 5. 구독
INSERT INTO subscriptions (id, admin_id, status, billing_day, current_period_start, current_period_end, card_brand, card_last4) VALUES
  ('51111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'active', 15, NOW() - INTERVAL '15 days', NOW() + INTERVAL '15 days', '신한카드', '4512'),
  ('52222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'active', 1, NOW() - INTERVAL '5 days', NOW() + INTERVAL '25 days', '국민카드', '1234'),
  ('53333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'trialing', 28, NOW(), NOW() + INTERVAL '30 days', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- 6. 구독 아이템 (빌라별 플랜)
INSERT INTO subscription_items (subscription_id, villa_id, plan, price)
SELECT
  CASE
    WHEN v.admin_id = '11111111-1111-1111-1111-111111111111' THEN '51111111-1111-1111-1111-111111111111'::uuid
    WHEN v.admin_id = '22222222-2222-2222-2222-222222222222' THEN '52222222-2222-2222-2222-222222222222'::uuid
    ELSE '53333333-3333-3333-3333-333333333333'::uuid
  END,
  v.id,
  CASE
    WHEN v.total_units <= 8 THEN 'small'
    WHEN v.total_units <= 15 THEN 'popular'
    ELSE 'large'
  END,
  CASE
    WHEN v.total_units <= 8 THEN 30000
    WHEN v.total_units <= 15 THEN 50000
    ELSE 70000
  END
FROM villas v WHERE v.id IN (
  'a1111111-1111-1111-1111-111111111111',
  'a2222222-2222-2222-2222-222222222222',
  'b1111111-1111-1111-1111-111111111111',
  'b2222222-2222-2222-2222-222222222222',
  'c1111111-1111-1111-1111-111111111111'
)
ON CONFLICT DO NOTHING;

-- 7. 청구서 (이번달)
INSERT INTO bill_months (id, villa_id, year_month, label, status, created_at)
SELECT
  gen_random_uuid(),
  v.id,
  TO_CHAR(NOW(), 'YYYY-MM'),
  TO_CHAR(NOW(), 'YYYY년 MM월'),
  'published',
  NOW() - INTERVAL '5 days'
FROM villas v WHERE v.id IN (
  'a1111111-1111-1111-1111-111111111111',
  'b1111111-1111-1111-1111-111111111111'
)
ON CONFLICT DO NOTHING;

-- 8. 청구 항목
INSERT INTO bill_items (bill_month_id, name, amount)
SELECT bm.id, '공용전기', 180000 FROM bill_months bm
UNION ALL
SELECT bm.id, '상하수도', 220000 FROM bill_months bm
UNION ALL
SELECT bm.id, '청소용역', 150000 FROM bill_months bm
UNION ALL
SELECT bm.id, '소독/방역', 50000 FROM bill_months bm;

-- 9. 결제 레코드 (모든 세대 미납 상태로)
INSERT INTO payments (bill_month_id, unit_id, amount, is_paid)
SELECT
  bm.id,
  u.id,
  ROUND((SELECT SUM(amount) FROM bill_items WHERE bill_month_id = bm.id) / (SELECT COUNT(*) FROM units WHERE villa_id = bm.villa_id))::int,
  CASE WHEN RANDOM() < 0.6 THEN true ELSE false END
FROM bill_months bm
JOIN units u ON u.villa_id = bm.villa_id
ON CONFLICT DO NOTHING;

-- 10. 공지사항
INSERT INTO notices (villa_id, title, body, is_pinned)
SELECT
  'a1111111-1111-1111-1111-111111111111',
  '4월 정기 청소 안내',
  '4월 30일(수) 오전 9시부터 외부 정기 청소가 진행됩니다. 차량 이동 부탁드립니다.',
  true
UNION ALL
SELECT
  'a1111111-1111-1111-1111-111111111111',
  '4월 관리비 청구',
  '4월 관리비가 청구되었습니다. 25일까지 납부 부탁드립니다.',
  false
UNION ALL
SELECT
  'b1111111-1111-1111-1111-111111111111',
  '엘리베이터 정기점검',
  '5월 5일(월) 14:00~16:00 엘리베이터 정기점검이 예정되어 있습니다.',
  false;

-- 11. 메시지(민원)
INSERT INTO messages (villa_id, unit_id, text, is_read, category)
SELECT
  'a1111111-1111-1111-1111-111111111111',
  (SELECT id FROM units WHERE villa_id = 'a1111111-1111-1111-1111-111111111111' AND ho_number = '101' LIMIT 1),
  '복도 전등이 깜빡거립니다. 수리 부탁드립니다.',
  false,
  'maintenance'
UNION ALL
SELECT
  'b1111111-1111-1111-1111-111111111111',
  (SELECT id FROM units WHERE villa_id = 'b1111111-1111-1111-1111-111111111111' AND ho_number = '102' LIMIT 1),
  '주차장 위층에서 물이 새는 것 같아요. 확인 부탁드립니다.',
  false,
  'maintenance';

-- 12. 결제 내역 (구독료)
INSERT INTO subscription_payments (subscription_id, amount, status, toss_payment_key, created_at)
SELECT
  '51111111-1111-1111-1111-111111111111',
  80000,
  'success',
  'toss_test_001',
  NOW() - INTERVAL '15 days'
UNION ALL
SELECT
  '51111111-1111-1111-1111-111111111111',
  80000,
  'success',
  'toss_test_002',
  NOW() - INTERVAL '45 days'
UNION ALL
SELECT
  '52222222-2222-2222-2222-222222222222',
  120000,
  'success',
  'toss_test_003',
  NOW() - INTERVAL '5 days'
UNION ALL
SELECT
  '52222222-2222-2222-2222-222222222222',
  120000,
  'failed',
  NULL,
  NOW() - INTERVAL '35 days';

SELECT '=== 시딩 완료 ===' as message,
  (SELECT COUNT(*) FROM admins) as admins,
  (SELECT COUNT(*) FROM villas) as villas,
  (SELECT COUNT(*) FROM units) as units,
  (SELECT COUNT(*) FROM residents) as residents,
  (SELECT COUNT(*) FROM bill_months) as bills;
