-- ==============================
-- 인덱스 22개 (기술명세서 v2.0 Chapter 4.15)
-- ==============================

CREATE INDEX idx_villas_admin ON villas(admin_id);
CREATE INDEX idx_units_villa ON units(villa_id);
CREATE INDEX idx_residents_unit ON residents(unit_id);
CREATE INDEX idx_residents_phone ON residents(phone);
CREATE INDEX idx_residents_name_phone ON residents(name, phone);
CREATE INDEX idx_bill_months_villa ON bill_months(villa_id);
CREATE INDEX idx_bill_months_ym ON bill_months(villa_id, year_month);
CREATE INDEX idx_bill_items_month ON bill_items(bill_month_id);
CREATE INDEX idx_payments_month ON payments(bill_month_id);
CREATE INDEX idx_payments_unit ON payments(unit_id);
CREATE INDEX idx_payments_paid ON payments(bill_month_id, is_paid);
CREATE INDEX idx_notices_villa ON notices(villa_id);
CREATE INDEX idx_messages_villa ON messages(villa_id);
CREATE INDEX idx_messages_read ON messages(villa_id, is_read);
CREATE INDEX idx_msg_replies ON message_replies(message_id);
CREATE INDEX idx_posts_villa ON posts(villa_id);
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_parking_villa ON parking(villa_id);
CREATE INDEX idx_subs_admin ON subscriptions(admin_id);
CREATE INDEX idx_subs_status ON subscriptions(status);
CREATE INDEX idx_subs_billing ON subscriptions(billing_day, status);
CREATE INDEX idx_sub_pay ON subscription_payments(subscription_id);
