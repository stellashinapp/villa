import type { PlanType } from '../types';

// ==============================
// 가격 정책
// ==============================

export const PLAN_PRICES: Record<PlanType, number> = {
  small: 30_000,
  popular: 50_000,
  large: 70_000,
};

export const PLAN_LABELS: Record<PlanType, string> = {
  small: '소형',
  popular: '인기',
  large: '대형',
};

export const PLAN_UNIT_RANGES: Record<PlanType, { min: number; max: number }> = {
  small: { min: 6, max: 8 },
  popular: { min: 9, max: 15 },
  large: { min: 16, max: 30 },
};

// 볼륨 할인 티어
export const DISCOUNT_TIERS = [
  { minVillas: 20, rate: 0.4 },  // 40% 할인
  { minVillas: 10, rate: 0.3 },  // 30% 할인
  { minVillas: 5, rate: 0.2 },   // 20% 할인
  { minVillas: 1, rate: 0 },     // 할인 없음
] as const;

// ==============================
// 구독 상태
// ==============================

export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  trialing: '무료체험',
  active: '구독중',
  past_due: '결제실패',
  cancelled: '해지됨',
  pending_cancel: '해지 예정',
};

// ==============================
// 관리비 상태
// ==============================

export const BILL_STATUS_LABELS: Record<string, string> = {
  draft: '작성중',
  published: '발행됨',
  closed: '마감',
};

// ==============================
// 앱 설정
// ==============================

export const APP_NAME = 'ANDNEW';
export const APP_NAME_KR = '빌라톡';
export const COMPANY_NAME = '주식회사 더줌웍스';
export const COMPANY_NAME_EN = 'TheZoomWorks';

export const TRIAL_DAYS = 30;
export const BILLING_RETRY_DAYS = [3, 7] as const;

// 푸시 알림 시나리오
export const PUSH_SCENARIOS = {
  BILL_PUBLISHED: 'bill_published',
  PAYMENT_REMINDER: 'payment_reminder',
  NEW_NOTICE: 'new_notice',
  MESSAGE_REPLY: 'message_reply',
  NEW_MESSAGE: 'new_message',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  VISITOR_PARKING_EXPIRY: 'visitor_parking_expiry',
} as const;
