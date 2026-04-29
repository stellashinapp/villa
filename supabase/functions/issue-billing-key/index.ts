// 토스페이먼츠 빌링키 발급 (정기결제용)
// 관리자가 카드 등록 후 authKey → billingKey 교환
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { authKey, customerKey, adminId, cardExpiryYear, cardExpiryMonth } = await req.json();

    if (!authKey || !customerKey || !adminId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 카드 만료월 정규화 (프론트에서 "MM/YY" 또는 숫자로 받음)
    let expiryYear: number | null = null;
    let expiryMonth: number | null = null;
    if (cardExpiryYear != null && cardExpiryMonth != null) {
      const y = Number(cardExpiryYear);
      const m = Number(cardExpiryMonth);
      if (Number.isFinite(y) && Number.isFinite(m) && m >= 1 && m <= 12) {
        expiryYear = y < 100 ? 2000 + y : y;
        expiryMonth = m;
      }
    }

    const secretKey = Deno.env.get('TOSS_BILLING_SECRET_KEY') ?? Deno.env.get('TOSS_SECRET_KEY')!;
    const auth = btoa(`${secretKey}:`);

    const tossRes = await fetch('https://api.tosspayments.com/v1/billing/authorizations/issue', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ authKey, customerKey }),
    });

    const tossData = await tossRes.json();

    if (!tossRes.ok) {
      return new Response(JSON.stringify({ error: tossData.message ?? 'Billing key issue failed', code: tossData.code }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('admin_id', adminId)
      .in('status', ['trialing', 'active', 'past_due', 'pending_cancel'])
      .maybeSingle();

    const cardNumber: string = tossData.card?.number ?? '';
    const cardLast4 = cardNumber.slice(-4);
    const cardBrand = tossData.card?.issuerName ?? tossData.card?.company ?? null;

    if (existingSub) {
      await supabase
        .from('subscriptions')
        .update({
          billing_key: tossData.billingKey,
          card_brand: cardBrand,
          card_last4: cardLast4,
          card_expiry_year: expiryYear,
          card_expiry_month: expiryMonth,
          card_expiry_alerted_at: null,
          status: existingSub.status === 'trialing' ? 'active' : existingSub.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSub.id);
    } else {
      await supabase.from('subscriptions').insert({
        admin_id: adminId,
        billing_key: tossData.billingKey,
        card_brand: cardBrand,
        card_last4: cardLast4,
        card_expiry_year: expiryYear,
        card_expiry_month: expiryMonth,
        status: 'active',
        billing_day: new Date().getDate(),
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
      });
    }

    return new Response(JSON.stringify({
      success: true,
      cardLast4,
      cardBrand,
      billingKey: tossData.billingKey,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
