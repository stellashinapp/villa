// 토스페이먼츠 Webhook 수신
// 결제 상태 변경 시 DB 갱신 + 알림
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const body = await req.json();

    const eventType: string = body.eventType ?? '';
    const data = body.data ?? body;
    const paymentKey: string = data.paymentKey ?? '';
    const orderId: string = data.orderId ?? '';
    const status: string = data.status ?? '';
    const amount: number = data.totalAmount ?? data.amount ?? 0;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const isSubscription = orderId.startsWith('sub_');
    const subscriptionId = isSubscription ? orderId.split('_')[1] : null;

    if (status === 'DONE') {
      if (isSubscription && subscriptionId) {
        const { data: existing } = await supabase
          .from('subscription_payments')
          .select('id')
          .eq('toss_payment_key', paymentKey)
          .maybeSingle();

        if (!existing) {
          await supabase.from('subscription_payments').insert({
            subscription_id: subscriptionId,
            amount,
            status: 'success',
            toss_payment_key: paymentKey,
          });
        }
      }
    } else if (status === 'CANCELED' || status === 'PARTIAL_CANCELED') {
      if (paymentKey) {
        await supabase
          .from('subscription_payments')
          .update({ status: 'refunded' })
          .eq('toss_payment_key', paymentKey);
      }
    } else if (status === 'ABORTED' || status === 'EXPIRED') {
      if (isSubscription && subscriptionId) {
        await supabase.from('subscription_payments').insert({
          subscription_id: subscriptionId,
          amount,
          status: 'failed',
          failure_reason: `webhook_${status}`,
        });
      }
    }

    console.log('[webhook]', { eventType, status, orderId, paymentKey });

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[webhook error]', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
