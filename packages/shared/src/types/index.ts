// ==============================
// ANDNEW (빌라톡) DB 타입 정의
// 기술명세서 v2.0 Chapter 4 기반
// ==============================

// ---------- admins ----------
export interface Admin {
  id: string;
  auth_id: string;
  name: string;
  phone: string;
  email: string | null;
  role: 'admin' | 'super';
  fcm_token: string | null;
  created_at: string;
  updated_at: string;
}

// ---------- villas ----------
export type VillaStatus = 'active' | 'inactive' | 'transferred';

export interface Villa {
  id: string;
  admin_id: string;
  name: string;
  address: string;
  total_units: number;
  units_per_floor: number;
  account_bank: string | null;
  account_number: string | null;
  account_holder: string | null;
  status: VillaStatus;
  created_at: string;
  updated_at: string;
}

// ---------- units ----------
export interface Unit {
  id: string;
  villa_id: string;
  ho_number: string;
  floor: number | null;
  area_sqm: number | null;
  created_at: string;
}

// ---------- residents ----------
export type ResidentStatus = 'active' | 'moved_out';

export interface Resident {
  id: string;
  unit_id: string;
  name: string;
  phone: string;
  is_owner: boolean;
  move_in_date: string | null;
  move_out_date: string | null;
  status: ResidentStatus;
  fcm_token: string | null;
  last_login_at: string | null;
  created_at: string;
}

// ---------- bill_months ----------
export type BillMonthStatus = 'draft' | 'published' | 'closed';

export interface BillMonth {
  id: string;
  villa_id: string;
  year_month: string; // "2026-03"
  label: string | null;
  due_date: string | null;
  status: BillMonthStatus;
  notification_sent_at: string | null;
  created_at: string;
}

// ---------- bill_items ----------
export interface BillItem {
  id: string;
  bill_month_id: string;
  name: string;
  amount: number;
  sort_order: number;
}

// ---------- payments (관리비 납부) ----------
export interface Payment {
  id: string;
  bill_month_id: string;
  unit_id: string;
  amount: number;
  is_paid: boolean;
  paid_at: string | null;
  confirmed_by: string | null;
  method: string | null;
  memo: string | null;
  created_at: string;
}

// ---------- notices ----------
export interface Notice {
  id: string;
  villa_id: string;
  title: string;
  body: string;
  is_pinned: boolean;
  created_at: string;
}

// ---------- messages ----------
export interface Message {
  id: string;
  villa_id: string;
  unit_id: string | null;
  resident_id: string | null;
  text: string;
  image_url: string | null;
  is_read: boolean;
  category: string;
  created_at: string;
}

// ---------- message_replies ----------
export type AuthorType = 'admin' | 'resident' | 'system';

export interface MessageReply {
  id: string;
  message_id: string;
  text: string;
  author_type: AuthorType;
  author_name: string | null;
  created_at: string;
}

// ---------- posts (커뮤니티) ----------
export interface Post {
  id: string;
  villa_id: string;
  unit_id: string | null;
  resident_id: string | null;
  title: string | null;
  body: string;
  image_url: string | null;
  likes: number;
  created_at: string;
}

// ---------- comments ----------
export interface Comment {
  id: string;
  post_id: string;
  unit_id: string | null;
  resident_id: string | null;
  text: string;
  created_at: string;
}

// ---------- parking ----------
export type VehicleType = 'resident' | 'visitor';

export interface Parking {
  id: string;
  villa_id: string;
  unit_id: string | null;
  plate_number: string;
  vehicle_type: VehicleType;
  memo: string | null;
  expires_at: string | null;
  created_at: string;
}

// ---------- subscriptions ----------
export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'pending_cancel';

export interface Subscription {
  id: string;
  admin_id: string;
  status: SubscriptionStatus;
  billing_key: string | null;
  card_brand: string | null;
  card_last4: string | null;
  billing_day: number;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---------- subscription_items ----------
export type PlanType = 'small' | 'popular' | 'large';

export interface SubscriptionItem {
  id: string;
  subscription_id: string;
  villa_id: string;
  plan: PlanType;
  price: number;
  created_at: string;
}

// ---------- subscription_payments ----------
export type PaymentStatus = 'success' | 'failed' | 'refunded';

export interface SubscriptionPayment {
  id: string;
  subscription_id: string;
  amount: number;
  status: PaymentStatus;
  toss_payment_key: string | null;
  failure_reason: string | null;
  created_at: string;
}

// ---------- villa_transfers ----------
export interface VillaTransfer {
  id: string;
  villa_id: string;
  from_admin_id: string;
  to_admin_id: string;
  reason: string | null;
  transferred_at: string;
}

// ---------- API Error ----------
export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTH_FAILED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'DUPLICATE'
  | 'PAYMENT_FAILED'
  | 'INTERNAL_ERROR';
