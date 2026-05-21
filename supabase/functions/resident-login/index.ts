// 입주민 로그인 + 빌라 데이터 일괄 반환
// - residents 매칭 (service_role 로 RLS 우회)
// - 매칭 성공 시 빌라 전체 데이터 (units / bill_months / notices / messages / posts / parking / payments) 동봉
// - mobile 측은 이 함수 한 번 호출로 입주민 화면 전체 데이터 받음
//   → mobile sync 가 RLS 막혀 데이터 0건이던 이슈 해결
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { create } from 'https://deno.land/x/djwt@v3.0.1/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RECENT_LIMIT = 20;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { name, phone } = await req.json();
    if (!name || !phone) {
      return new Response(
        JSON.stringify({ error: { code: 'VALIDATION_ERROR', message: '이름과 전화번호를 입력하세요' } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: residents, error } = await supabase
      .from('residents')
      .select('id, name, phone, unit_id, units(id, ho_number, villa_id, villas(id, name, address))')
      .eq('name', name)
      .eq('phone', phone.replace(/\D/g, ''))
      .eq('status', 'active');

    if (error || !residents?.length) {
      return new Response(
        JSON.stringify({ error: { code: 'AUTH_FAILED', message: '등록된 입주민 정보가 없습니다' } }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firstMatch = residents[0] as any;
    const villaId = firstMatch.units?.villa_id ?? firstMatch.units?.villas?.id ?? null;

    // JWT 토큰은 입주민 세션 식별용 — mobile 은 store.loggedResident 로 식별하므로
    // 사실 사용 안 함. SUPABASE_JWT_SECRET 가 Edge Function env 에 등록 안 되어 있으면
    // JWT 생성을 건너뛰고 빈 토큰 반환 (호환성 유지).
    let token = '';
    const jwtSecret = Deno.env.get('SUPABASE_JWT_SECRET');
    if (jwtSecret && jwtSecret.length > 0) {
      try {
        const secret = new TextEncoder().encode(jwtSecret);
        const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        token = await create(
          { alg: 'HS256', typ: 'JWT' },
          {
            resident_id: firstMatch.id,
            unit_id: firstMatch.unit_id,
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
          },
          key
        );
      } catch (e) {
        console.warn('[resident-login] JWT sign skipped:', String(e));
      }
    }

    // 빌라 전체 데이터 동봉 — service_role 로 RLS 우회
    let villa: any = null;
    let payments: any[] = [];
    if (villaId) {
      const { data: villaData } = await supabase
        .from('villas')
        .select(`
          id, name, address, total_units, units_per_floor, account_bank, account_number,
          units ( id, ho_number, floor, residents ( name, phone, status ) ),
          bill_months ( id, year_month, label, status, billing_mode, per_unit_amounts, bill_items ( name, amount ) ),
          notices ( id, title, body, created_at, is_pinned ),
          messages ( id, text, is_read, created_at, unit_id, resident_id, message_replies ( text, author_type, author_name, created_at ) ),
          parking ( id, plate_number, vehicle_type, memo, unit_id ),
          posts ( id, title, body, likes, created_at, resident_id, comments ( text, created_at, resident_id ) )
        `)
        .eq('id', villaId)
        .order('created_at', { ascending: false, referencedTable: 'notices' })
        .limit(RECENT_LIMIT, { referencedTable: 'notices' })
        .order('created_at', { ascending: false, referencedTable: 'messages' })
        .limit(RECENT_LIMIT, { referencedTable: 'messages' })
        .order('created_at', { ascending: false, referencedTable: 'posts' })
        .limit(RECENT_LIMIT, { referencedTable: 'posts' })
        // 청구서는 최근 12개월만 — 1년치 이상 쌓여도 로그인 페이로드 비대화 방지
        .order('year_month', { ascending: false, referencedTable: 'bill_months' })
        .limit(12, { referencedTable: 'bill_months' })
        .single();
      villa = villaData ?? null;

      const billMonthIds = (villa?.bill_months ?? []).map((b: any) => b.id);
      if (billMonthIds.length > 0) {
        const { data: paymentsData } = await supabase
          .from('payments')
          .select('bill_month_id, is_paid, units!inner(ho_number)')
          .in('bill_month_id', billMonthIds)
          .eq('is_paid', true);
        payments = paymentsData ?? [];
      }
    }

    // last_login_at 갱신 — best effort (응답 차단 X)
    supabase.from('residents').update({ last_login_at: new Date().toISOString() }).eq('id', firstMatch.id).then(() => {});

    return new Response(
      JSON.stringify({
        token,
        resident: firstMatch,
        matches: residents,
        villa,
        payments,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: String(err) } }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
