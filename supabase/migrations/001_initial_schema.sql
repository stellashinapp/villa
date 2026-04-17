-- ==============================
-- ANDNEW (빌라톡) DB 스키마
-- 기술명세서 v2.0 Chapter 4 기반
-- 16개 테이블 + 트리거
-- ==============================

-- 1. admins
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin','super')),
  fcm_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. villas
CREATE TABLE villas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  total_units INTEGER NOT NULL DEFAULT 0,
  units_per_floor INTEGER NOT NULL DEFAULT 2,
  account_bank TEXT,
  account_number TEXT,
  account_holder TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','transferred')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. units
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  villa_id UUID NOT NULL REFERENCES villas(id) ON DELETE CASCADE,
  ho_number TEXT NOT NULL,
  floor INTEGER,
  area_sqm NUMERIC(6,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(villa_id, ho_number)
);

-- 4. residents
CREATE TABLE residents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  is_owner BOOLEAN DEFAULT false,
  move_in_date DATE,
  move_out_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','moved_out')),
  fcm_token TEXT,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(unit_id, phone)
);

-- 5. bill_months
CREATE TABLE bill_months (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  villa_id UUID NOT NULL REFERENCES villas(id) ON DELETE CASCADE,
  year_month TEXT NOT NULL,
  label TEXT,
  due_date DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','published','closed')),
  notification_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(villa_id, year_month)
);

-- 6. bill_items
CREATE TABLE bill_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_month_id UUID NOT NULL REFERENCES bill_months(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- 7. payments (관리비 납부)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_month_id UUID NOT NULL REFERENCES bill_months(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMPTZ,
  confirmed_by TEXT,
  method TEXT,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(bill_month_id, unit_id)
);

-- 8. notices
CREATE TABLE notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  villa_id UUID NOT NULL REFERENCES villas(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  villa_id UUID NOT NULL REFERENCES villas(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id),
  resident_id UUID REFERENCES residents(id),
  text TEXT NOT NULL,
  image_url TEXT,
  is_read BOOLEAN DEFAULT false,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. message_replies
CREATE TABLE message_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  author_type TEXT NOT NULL CHECK (author_type IN ('admin','resident','system')),
  author_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. posts (입주민 커뮤니티)
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  villa_id UUID NOT NULL REFERENCES villas(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id),
  resident_id UUID REFERENCES residents(id),
  title TEXT,
  body TEXT NOT NULL,
  image_url TEXT,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id),
  resident_id UUID REFERENCES residents(id),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. parking
CREATE TABLE parking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  villa_id UUID NOT NULL REFERENCES villas(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id),
  plate_number TEXT NOT NULL,
  vehicle_type TEXT DEFAULT 'resident' CHECK (vehicle_type IN ('resident','visitor')),
  memo TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'trialing'
    CHECK (status IN ('trialing','active','past_due','cancelled','pending_cancel')),
  billing_key TEXT,
  card_brand TEXT,
  card_last4 TEXT,
  billing_day INTEGER DEFAULT 1,
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 15. subscription_items (빌라별 구독)
CREATE TABLE subscription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  villa_id UUID NOT NULL REFERENCES villas(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('small','popular','large')),
  price INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(subscription_id, villa_id)
);

-- 관리자당 활성 구독 1개만 허용
CREATE UNIQUE INDEX idx_subscriptions_active_admin ON subscriptions(admin_id)
  WHERE status IN ('trialing','active','past_due','pending_cancel');

-- 16. subscription_payments
CREATE TABLE subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success','failed','refunded')),
  toss_payment_key TEXT,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 17. villa_transfers (관사 테이블)
CREATE TABLE villa_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  villa_id UUID NOT NULL REFERENCES villas(id) ON DELETE CASCADE,
  from_admin_id UUID NOT NULL REFERENCES admins(id),
  to_admin_id UUID NOT NULL REFERENCES admins(id),
  reason TEXT,
  transferred_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================
-- updated_at 자동 갱신 트리거
-- ==============================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_admins BEFORE UPDATE ON admins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_villas BEFORE UPDATE ON villas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_subs BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
