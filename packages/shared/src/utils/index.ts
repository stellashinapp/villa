import type { PlanType, SubscriptionItem } from '../types';
import { PLAN_PRICES, DISCOUNT_TIERS } from '../constants';

/**
 * 세대수에 따라 적합한 플랜을 반환.
 *
 * 가격 정책 (2026-05-11 갱신):
 * - 6~8세대:  소형  30,000
 * - 9~15세대: 중형  50,000
 * - 16~19세대: 대형  70,000
 * - 20세대 이상: 10세대 단위로 5만원 증가 — 20=10만, 30=15만, 40=20만, 50=25만, 60=30만, ...
 *
 * 20세대 이상은 plan 컬럼은 'large' 로 통일 (DB 의 CHECK 제약 호환).
 * 가격은 동적으로 계산.
 */
export function planFor(units: number): { plan: PlanType; price: number; name: string; range: string } {
  if (units <= 8) return { plan: 'small', price: PLAN_PRICES.small, name: '소형', range: '6~8세대' };
  if (units <= 15) return { plan: 'popular', price: PLAN_PRICES.popular, name: '중형', range: '9~15세대' };
  if (units <= 19) return { plan: 'large', price: PLAN_PRICES.large, name: '대형', range: '16~19세대' };
  // 20+ : 10단위 가격 계산. 20s→10만, 30s→15만, 40s→20만, ...
  const tens = Math.floor((units - 20) / 10) + 2;
  const price = tens * 50_000;
  const lowerBound = 20 + (tens - 2) * 10;
  const upperBound = lowerBound + 9;
  return { plan: 'large', price, name: '특대형', range: `${lowerBound}~${upperBound}세대` };
}

/**
 * 빌라 개수에 따른 할인율 반환 (0~0.4)
 */
export function discountRate(villaCount: number): number {
  for (const tier of DISCOUNT_TIERS) {
    if (villaCount >= tier.minVillas) return tier.rate;
  }
  return 0;
}

/**
 * 할인 적용 후 실제 지불 비율 (1 = 할인없음, 0.6 = 40% 할인)
 */
export function payRate(villaCount: number): number {
  return 1 - discountRate(villaCount);
}

/**
 * 구독 아이템 목록으로 MRR 계산 (할인 적용)
 */
export function calcMRR(items: Pick<SubscriptionItem, 'price'>[]): number {
  const rawTotal = items.reduce((sum, item) => sum + item.price, 0);
  const rate = payRate(items.length);
  return Math.round(rawTotal * rate);
}

/**
 * 구독 아이템 목록으로 할인 전 합계
 */
export function calcRawTotal(items: Pick<SubscriptionItem, 'price'>[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

/**
 * 금액 포맷 (한국 원화)
 */
export function formatKRW(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원';
}

/**
 * 전화번호 포맷 (010-1234-5678)
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

/**
 * year_month 키 생성 ("2026-03")
 */
export function toYearMonth(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * year_month를 읽기용 라벨로 ("2026년 3월")
 */
export function yearMonthLabel(yearMonth: string): string {
  const [y, m] = yearMonth.split('-');
  return `${y}년 ${parseInt(m)}월`;
}
