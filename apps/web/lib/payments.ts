/**
 * 관리비 결제 — TossPayments 연동 레이어 (스캐폴딩)
 *
 * 운영키 발급 전까지는 STUB 모드로 동작:
 *   - 결제창/빌링 호출 대신 즉시 성공으로 처리해 흐름(UI·DB)을 검증할 수 있게 함
 * 운영키가 셋업되면(NEXT_PUBLIC_TOSS_CLIENT_KEY 존재) 실제 SDK 호출로 전환.
 *
 * TossPayments 클라이언트키: 환경변수 NEXT_PUBLIC_TOSS_CLIENT_KEY
 * (가맹점 심사·운영키 발급은 [[pending-tier2-tier3]] 참고)
 */

export type PaymentMethod = 'card' | 'transfer'; // 카드 / 실시간계좌이체
export type PaymentResult = {
  ok: boolean;
  stub: boolean;
  method: PaymentMethod;
  pgProvider: 'toss';
  pgPaymentKey: string | null;
  pgOrderId: string;
  message?: string;
};
export type BillingKeyResult = {
  ok: boolean;
  stub: boolean;
  billingKey: string | null;
  cardCompany: string | null;
  cardLast4: string | null;
  cardExpiry: string | null;
  customerKey: string;
  message?: string;
};

export const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? '';
export const isTossLive = TOSS_CLIENT_KEY.length > 0;

function genOrderId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 일회성 결제 (① 카드 / 실시간계좌이체)
 * - LIVE: TossPayments 결제창 호출 → 리다이렉트/승인 (운영키 셋업 후 구현)
 * - STUB: 즉시 성공 (DB 흐름 검증용)
 */
export async function requestPayment(params: {
  method: PaymentMethod;
  amount: number;
  orderName: string;        // 예: "2026년 5월 관리비 - 101호"
  customerName?: string;
}): Promise<PaymentResult> {
  const orderId = genOrderId('vt');

  if (!isTossLive) {
    // STUB — 운영키 없으면 즉시 성공으로 처리
    await new Promise(r => setTimeout(r, 400));
    return {
      ok: true, stub: true, method: params.method, pgProvider: 'toss',
      pgPaymentKey: null, pgOrderId: orderId,
      message: '테스트 모드 — 실제 결제 없이 납부 처리됨 (운영키 셋업 후 실결제)',
    };
  }

  // LIVE — TODO(운영키): @tosspayments/tosspayments-sdk 로 결제창 호출
  // const toss = await loadTossPayments(TOSS_CLIENT_KEY);
  // const payment = toss.payment({ customerKey });
  // await payment.requestPayment({ method: ..., amount, orderId, orderName, successUrl, failUrl });
  // 승인은 successUrl 콜백에서 서버가 confirm. 여기서는 리다이렉트되므로 도달 안 함.
  throw new Error('LIVE 결제는 운영키 셋업 후 구현 예정');
}

/**
 * 카드 자동결제 등록 (② 빌링키 발급)
 * - LIVE: TossPayments 카드 등록창 → billingKey 발급 (운영키 셋업 후 구현)
 * - STUB: 더미 빌링키 반환
 */
export async function registerBillingKey(params: {
  residentId: string;
  customerName?: string;
}): Promise<BillingKeyResult> {
  const customerKey = `cust_${params.residentId}`;

  if (!isTossLive) {
    await new Promise(r => setTimeout(r, 400));
    return {
      ok: true, stub: true,
      billingKey: `stub_bk_${params.residentId.slice(0, 8)}`,
      cardCompany: '테스트카드', cardLast4: '1234', cardExpiry: '2030-12',
      customerKey,
      message: '테스트 모드 — 더미 카드 등록 (운영키 셋업 후 실제 카드 등록)',
    };
  }

  // LIVE — TODO(운영키): toss.requestBillingAuth('카드', { customerKey, successUrl, failUrl })
  // 발급된 authKey 를 서버가 billingKey 로 교환 → 매월 자동 청구.
  throw new Error('LIVE 빌링키 발급은 운영키 셋업 후 구현 예정');
}
