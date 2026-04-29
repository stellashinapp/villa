import { supabase } from './supabase';

export const TOSS_CLIENT_KEY =
  process.env.EXPO_PUBLIC_TOSS_CLIENT_KEY || 'test_ck_docs_Ovk5rk1EwkEbP0W43n07xlzm';
export const TOSS_BILLING_CLIENT_KEY =
  process.env.EXPO_PUBLIC_TOSS_BILLING_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';

export function buildCheckoutHtml(params: {
  amount: number;
  orderId: string;
  orderName: string;
  customerName?: string;
}) {
  const { amount, orderId, orderName, customerName = '고객' } = params;
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no" />
<title>결제</title>
<script src="https://js.tosspayments.com/v1/payment"></script>
<style>
  body { font-family: -apple-system, 'Noto Sans KR', sans-serif; padding: 40px 20px; background: #F5F6FA; }
  .wrap { text-align: center; }
  h2 { font-size: 18px; margin-bottom: 4px; color: #1A1D26; }
  .amount { font-size: 28px; font-weight: 900; color: #3454D1; margin: 10px 0 20px; }
  button { width: 100%; padding: 14px; font-size: 16px; font-weight: 700; background: #3454D1; color: #fff; border: 0; border-radius: 10px; margin-bottom: 10px; }
  button.sub { background: #F3F4F6; color: #1A1D26; }
</style>
</head>
<body>
<div class="wrap">
  <h2>${orderName}</h2>
  <div class="amount">${amount.toLocaleString()}원</div>
  <button id="card">카드로 결제</button>
  <button id="transfer" class="sub">계좌이체</button>
</div>
<script>
  const tossPayments = TossPayments('${TOSS_CLIENT_KEY}');
  const post = (type, data) => window.ReactNativeWebView.postMessage(JSON.stringify({ type, ...data }));
  function pay(method) {
    tossPayments.requestPayment(method, {
      amount: ${amount},
      orderId: '${orderId}',
      orderName: '${orderName}',
      customerName: '${customerName}',
      successUrl: 'https://villatolk.app/success',
      failUrl: 'https://villatolk.app/fail',
    }).catch(err => post('fail', { message: err.message, code: err.code }));
  }
  document.getElementById('card').onclick = () => pay('카드');
  document.getElementById('transfer').onclick = () => pay('계좌이체');
</script>
</body>
</html>`;
}

export function buildBillingHtml(params: { customerKey: string; customerName?: string }) {
  const { customerKey, customerName = '관리자' } = params;
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no" />
<title>카드 등록</title>
<script src="https://js.tosspayments.com/v1/payment"></script>
<style>
  body { font-family: -apple-system, 'Noto Sans KR', sans-serif; padding: 40px 20px; background: #F5F6FA; text-align: center; }
  h2 { font-size: 18px; color: #1A1D26; margin-bottom: 8px; }
  p { color: #6B7280; margin-bottom: 20px; font-size: 13px; }
  button { width: 100%; padding: 14px; font-size: 16px; font-weight: 700; background: #3454D1; color: #fff; border: 0; border-radius: 10px; }
</style>
</head>
<body>
<h2>정기결제 카드 등록</h2>
<p>매월 자동으로 결제되는 카드를 등록합니다</p>
<button id="reg">카드 등록하기</button>
<script>
  const tossPayments = TossPayments('${TOSS_BILLING_CLIENT_KEY}');
  const post = (type, data) => window.ReactNativeWebView.postMessage(JSON.stringify({ type, ...data }));
  document.getElementById('reg').onclick = () => {
    tossPayments.requestBillingAuth('카드', {
      customerKey: '${customerKey}',
      successUrl: 'https://villatolk.app/billing-success',
      failUrl: 'https://villatolk.app/billing-fail',
    }).catch(err => post('fail', { message: err.message, code: err.code }));
  };
</script>
</body>
</html>`;
}

export async function confirmPaymentOnServer(params: {
  paymentKey: string;
  orderId: string;
  amount: number;
  paymentId?: string;
}) {
  const { data, error } = await supabase.functions.invoke('confirm-payment', { body: params });
  if (error) throw new Error(error.message);
  return data;
}

export async function issueBillingKeyOnServer(params: {
  authKey: string;
  customerKey: string;
  adminId: string;
}) {
  const { data, error } = await supabase.functions.invoke('issue-billing-key', { body: params });
  if (error) throw new Error(error.message);
  return data;
}
