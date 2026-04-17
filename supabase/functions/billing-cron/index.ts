// 정기결제 크론 (매일 00:00 실행)
// 당일 결제 대상 조회 → 빌링키 자동결제
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const today = new Date().getDate();

  // 당일 결제 대상 조회
  const { data: subs } = await supabase
    .from('subscriptions')
    .select('*, subscription_items(*)')
    .eq('billing_day', today)
    .in('status', ['active', 'past_due']);

  if (!subs?.length) {
    return new Response(JSON.stringify({ processed: 0 }), { status: 200 });
  }

  // TODO: 각 구독에 대해
  // 1. subscription_items의 price 합계 계산
  // 2. 빌라 수 기반 볼륨 할인 적용
  // 3. billingKey로 토스 자동결제 승인 API 호출
  // 4. 성공 → subscription_payments 기록 + current_period 갱신
  // 5. 실패 → status='past_due' + 재시도 (D+3, D+7)

  return new Response(JSON.stringify({ processed: subs.length }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
