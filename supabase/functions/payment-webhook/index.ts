// 토스페이먼츠 결제 Webhook
// 결제 성공/실패 처리
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const body = await req.json();
    const { paymentKey, orderId, status, amount } = body;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // TODO: 토스페이먼츠 시크릿키로 Webhook 서명 검증
    // TODO: orderId에서 subscription_id 추출
    // TODO: 결제 성공 시 subscription_payments 기록 + current_period 갱신
    // TODO: 결제 실패 시 status='past_due' + 재시도 스케줄 (D+3, D+7)
    // TODO: FCM 푸시 알림 (결제 성공/실패)

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
