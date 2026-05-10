// 더미 카드 등록 — 토스 실연동 전 임시. service_role 로 INSERT 해서 RLS 우회.
// JWT 에서 admin_id 를 직접 도출하므로 클라가 임의의 admin_id 를 보낼 수 없음(권한 분리 안전).
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
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: '인증 필요' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // anon 키 + 사용자 JWT 로 인증된 클라이언트 — auth.getUser() 검증용
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: '세션 검증 실패' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const authUserId = userData.user.id;

    // service_role 클라이언트 — RLS 우회해서 admins 조회 + subscriptions 갱신
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: adminRow, error: adminErr } = await admin
      .from('admins')
      .select('id')
      .eq('auth_id', authUserId)
      .maybeSingle();
    if (adminErr || !adminRow) {
      return new Response(JSON.stringify({ error: 'admin 행 없음 — 회원가입 트리거 미완료' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const adminId = adminRow.id;

    const now = Date.now();
    const periodStart = new Date(now).toISOString();
    const periodEnd = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString();

    // 기존 구독 확인 — cancelled 포함 가장 최근 행 update, 없으면 신규 INSERT
    const { data: existing, error: selErr } = await admin
      .from('subscriptions')
      .select('id')
      .eq('admin_id', adminId)
      .order('created_at', { ascending: false })
      .limit(1);
    if (selErr) {
      return new Response(JSON.stringify({ error: `조회 실패: ${selErr.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const dummyKey = `DUMMY_${adminId}_${now}`;
    const payload = {
      card_brand: '더미카드',
      card_last4: '0000',
      billing_key: dummyKey,
      status: 'active' as const,
      current_period_start: periodStart,
      current_period_end: periodEnd,
    };

    if (existing && existing.length > 0) {
      const { error: updErr } = await admin
        .from('subscriptions')
        .update(payload)
        .eq('id', existing[0].id);
      if (updErr) {
        return new Response(JSON.stringify({ error: `업데이트 실패: ${updErr.message}` }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      const { error: insErr } = await admin.from('subscriptions').insert({
        admin_id: adminId,
        billing_day: 1,
        ...payload,
      });
      if (insErr) {
        return new Response(JSON.stringify({ error: `INSERT 실패: ${insErr.message}` }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 클라가 store 를 즉시 갱신할 수 있도록 신규 구독 상태 반환 — 웹에서
    // 직후 SELECT 가 RLS/캐시 이슈로 못 잡는 케이스 대비.
    return new Response(JSON.stringify({
      success: true,
      adminId,
      subscription: {
        status: 'active',
        card_brand: '더미카드',
        card_last4: '0000',
        billing_day: 1,
        current_period_start: periodStart,
        current_period_end: periodEnd,
      },
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
