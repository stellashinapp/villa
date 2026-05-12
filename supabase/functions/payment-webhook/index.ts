// 토스페이먼츠 Webhook 수신
// - signature 검증 (TOSS_WEBHOOK_SECRET 등록 시 strict, 미등록 시 경고만 출력하고 통과)
// - DONE 상태는 UNIQUE 인덱스(026)와 함께 멱등 INSERT
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// HMAC-SHA256 base64 — 토스 webhook signature 검증용
async function hmacSha256Base64(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

// 상수 시간 비교 — timing attack 방어
function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

serve(async (req) => {
  try {
    // 1) body 텍스트 그대로 받음 — signature 계산은 raw body 기준
    const rawBody = await req.text();

    // 2) signature 검증 (secret 등록되어 있을 때만 strict)
    const secret = Deno.env.get('TOSS_WEBHOOK_SECRET');
    if (secret) {
      const sigHeader = req.headers.get('TossPayments-Signature') ?? req.headers.get('tosspayments-signature') ?? '';
      // 헤더 형식 예: "keyId=...,signature=BASE64" 또는 그냥 base64. 둘 다 대응.
      const sigMatch = sigHeader.match(/signature=([^,;\s]+)/i);
      const presented = sigMatch ? sigMatch[1] : sigHeader;
      if (!presented) {
        console.warn('[webhook] missing TossPayments-Signature header');
        return new Response(JSON.stringify({ error: 'missing signature' }), { status: 401 });
      }
      const expected = await hmacSha256Base64(secret, rawBody);
      if (!constantTimeEquals(expected, presented)) {
        console.warn('[webhook] invalid signature');
        return new Response(JSON.stringify({ error: 'invalid signature' }), { status: 401 });
      }
    } else {
      console.warn('[webhook] TOSS_WEBHOOK_SECRET not configured — skipping signature verification (DEV ONLY)');
    }

    const body = JSON.parse(rawBody);
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
        // 026 UNIQUE 인덱스 + onConflict='do nothing' 으로 race-safe 멱등 INSERT
        const { error } = await supabase
          .from('subscription_payments')
          .upsert(
            {
              subscription_id: subscriptionId,
              amount,
              status: 'success',
              toss_payment_key: paymentKey,
            },
            { onConflict: 'toss_payment_key', ignoreDuplicates: true },
          );
        if (error && !/duplicate|conflict/i.test(error.message)) {
          console.error('[webhook] DONE upsert failed:', error);
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
