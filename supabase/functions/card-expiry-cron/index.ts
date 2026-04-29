// 카드 만료 임박 알림 (매일 KST 09:00 실행)
// D-30, D-7 시점에 관리자에게 푸시 알림 발송.
// card_expiry_alerted_at 으로 중복 발송 방지 (월 1회).
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Sub = {
  id: string;
  admin_id: string;
  status: string;
  card_brand: string | null;
  card_last4: string | null;
  card_expiry_year: number;
  card_expiry_month: number;
  card_expiry_alerted_at: string | null;
};

const ALERT_THRESHOLDS = [30, 7];

function daysUntilExpiry(year: number, month: number, today: Date): number {
  // 카드는 만료월의 마지막 날 23:59:59까지 유효
  const expiryDate = new Date(year, month, 0, 23, 59, 59);
  const diff = expiryDate.getTime() - today.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

async function notifyAdmin(
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
    console.warn('[card-expiry-cron] notify failed', err);
  }
}

serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: subs, error } = await supabase
    .from('subscriptions')
    .select('id, admin_id, status, card_brand, card_last4, card_expiry_year, card_expiry_month, card_expiry_alerted_at')
    .in('status', ['active', 'past_due', 'trialing'])
    .not('card_expiry_year', 'is', null)
    .not('card_expiry_month', 'is', null)
    .returns<Sub[]>();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const today = new Date();
  const results: Array<{ sub: string; daysLeft: number; alerted: boolean }> = [];

  for (const sub of subs ?? []) {
    const daysLeft = daysUntilExpiry(sub.card_expiry_year, sub.card_expiry_month, today);
    const threshold = ALERT_THRESHOLDS.find((t) => daysLeft >= 0 && daysLeft <= t);
    if (threshold === undefined) {
      results.push({ sub: sub.id, daysLeft, alerted: false });
      continue;
    }

    // 같은 임계치(threshold)로 이미 알림을 보냈으면 스킵
    // 카드 갱신 시 issue-billing-key가 alerted_at을 NULL로 리셋하므로 자연스럽게 재알림 가능
    if (sub.card_expiry_alerted_at) {
      const lastAlert = new Date(sub.card_expiry_alerted_at);
      const daysSinceAlert = Math.floor((today.getTime() - lastAlert.getTime()) / (1000 * 60 * 60 * 24));
      // D-30 알림 후 23일 이내면 D-7까지 재알림 X. D-7 알림은 항상 1회만.
      if (threshold === 30 && daysSinceAlert < 23) {
        results.push({ sub: sub.id, daysLeft, alerted: false });
        continue;
      }
      if (threshold === 7 && daysSinceAlert < 7) {
        results.push({ sub: sub.id, daysLeft, alerted: false });
        continue;
      }
    }

    const cardLabel = sub.card_brand
      ? `${sub.card_brand} ····${sub.card_last4 ?? ''}`
      : '등록된 카드';
    const expiryLabel = `${String(sub.card_expiry_month).padStart(2, '0')}/${String(sub.card_expiry_year).slice(-2)}`;

    const title = daysLeft <= 7
      ? `⚠️ 카드 만료 임박 (D-${daysLeft})`
      : `카드 만료 ${daysLeft}일 전 안내`;
    const body = `${cardLabel}이(가) ${expiryLabel}에 만료됩니다. 결제수단을 갱신해주세요.`;

    await notifyAdmin(sub.admin_id, {
      title,
      body,
      data: { kind: 'card_expiry_warning', subscriptionId: sub.id, daysLeft },
    });

    await supabase
      .from('subscriptions')
      .update({ card_expiry_alerted_at: new Date().toISOString() })
      .eq('id', sub.id);

    results.push({ sub: sub.id, daysLeft, alerted: true });
  }

  return new Response(JSON.stringify({ checked: subs?.length ?? 0, results }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
