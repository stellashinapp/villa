// 정기결제 크론 (매일 실행)
// 오늘 결제일인 구독을 찾아 빌링키로 자동결제
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PLAN_PRICE: Record<string, number> = {
  small: 30000,
  popular: 50000,
  large: 70000,
};

function volumeDiscount(villaCount: number): number {
  if (villaCount >= 10) return 0.15;
  if (villaCount >= 5) return 0.1;
  if (villaCount >= 3) return 0.05;
  return 0;
}

// 관리자 알림: push-notify Edge Function 호출
async function notifyAdmin(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  adminId: string,
  payload: { title: string; body: string; data?: Record<string, unknown> },
) {
  try {
    const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/push-notify`;
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        type: 'payment_result',
        adminId,
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
      }),
    });
  } catch (err) {
    console.warn('[billing-cron] notifyAdmin failed', err);
  }
  void supabase; // not used directly, reserved for fallback
}

serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const today = new Date().getDate();
  const secretKey = Deno.env.get('TOSS_BILLING_SECRET_KEY') ?? Deno.env.get('TOSS_SECRET_KEY')!;
  const auth = btoa(`${secretKey}:`);

  const { data: subs, error } = await supabase
    .from('subscriptions')
    .select('*, subscription_items(*), admins(id, email, name)')
    .eq('billing_day', today)
    .in('status', ['active', 'past_due'])
    .not('billing_key', 'is', null);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  if (!subs?.length) {
    return new Response(JSON.stringify({ processed: 0 }), { status: 200 });
  }

  const results: Array<{ sub: string; ok: boolean; amount?: number; error?: string }> = [];

  for (const sub of subs) {
    try {
      const items = sub.subscription_items ?? [];
      if (items.length === 0) {
        results.push({ sub: sub.id, ok: false, error: 'No items' });
        continue;
      }

      const basePrice = items.reduce((sum: number, it: { plan: string; price: number }) =>
        sum + (it.price ?? PLAN_PRICE[it.plan] ?? 0), 0);
      const discount = volumeDiscount(items.length);
      const amount = Math.round(basePrice * (1 - discount));

      const orderId = `sub_${sub.id}_${Date.now()}`;
      const orderName = `빌라톡 구독료 (빌라 ${items.length}개)`;

      const tossRes = await fetch(`https://api.tosspayments.com/v1/billing/${sub.billing_key}`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerKey: sub.admin_id,
          amount,
          orderId,
          orderName,
          taxFreeAmount: 0,
        }),
      });

      const tossData = await tossRes.json();

      const wasPastDue = sub.status === 'past_due';

      if (tossRes.ok) {
        await supabase.from('subscription_payments').insert({
          subscription_id: sub.id,
          amount,
          status: 'success',
          toss_payment_key: tossData.paymentKey,
        });

        const nextPeriodEnd = new Date();
        nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);

        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: nextPeriodEnd.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', sub.id);

        // 결제 복구 알림 (past_due → active 전환 시에만)
        if (wasPastDue) {
          await notifyAdmin(supabase, sub.admin_id, {
            title: '결제가 정상 처리되었습니다',
            body: `구독료 ${amount.toLocaleString()}원 결제 완료. 서비스가 정상 이용 가능합니다.`,
            data: { kind: 'payment_recovered', subscriptionId: sub.id },
          });
        }

        results.push({ sub: sub.id, ok: true, amount });
      } else {
        await supabase.from('subscription_payments').insert({
          subscription_id: sub.id,
          amount,
          status: 'failed',
          failure_reason: tossData.message ?? tossData.code ?? 'Unknown',
        });
        await supabase
          .from('subscriptions')
          .update({ status: 'past_due', updated_at: new Date().toISOString() })
          .eq('id', sub.id);

        // 결제 실패 알림
        await notifyAdmin(supabase, sub.admin_id, {
          title: '⚠️ 구독료 결제 실패',
          body: `${amount.toLocaleString()}원 결제가 실패했습니다. 카드를 확인하거나 다시 시도해주세요.\n사유: ${tossData.message ?? tossData.code ?? '알 수 없음'}`,
          data: { kind: 'payment_failed', subscriptionId: sub.id, reason: tossData.code ?? null },
        });

        results.push({ sub: sub.id, ok: false, error: tossData.message });
      }
    } catch (err) {
      results.push({ sub: sub.id, ok: false, error: String(err) });
    }
  }

  return new Response(JSON.stringify({ processed: subs.length, results }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
