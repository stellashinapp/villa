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
