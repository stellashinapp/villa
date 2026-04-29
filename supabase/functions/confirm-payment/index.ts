// 토스페이먼츠 일회성 결제 승인 (관리비 납부용)
// 프론트엔드에서 결제 성공 후 이 함수로 승인 요청
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
    const { paymentKey, orderId, amount, paymentId } = await req.json();

    if (!paymentKey || !orderId || !amount) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const secretKey = Deno.env.get('TOSS_SECRET_KEY')!;
    const auth = btoa(`${secretKey}:`);

    const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    const tossData = await tossRes.json();

    if (!tossRes.ok) {
      return new Response(JSON.stringify({ error: tossData.message ?? 'Toss confirm failed', code: tossData.code }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    if (paymentId) {
      await supabase
        .from('payments')
        .update({
          is_paid: true,
          paid_at: new Date().toISOString(),
          method: tossData.method ?? 'card',
          memo: `tossPaymentKey:${paymentKey}`,
        })
        .eq('id', paymentId);
    }

    return new Response(JSON.stringify({ success: true, toss: tossData }), {
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
