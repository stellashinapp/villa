// 입주민 로그인: 이름+전화번호 → DB 조회 → 커스텀 JWT 발급
// Supabase Edge Function
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { create } from 'https://deno.land/x/djwt@v3.0.1/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // 전체 빌라에서 이름+전화번호 매칭 검색
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

    // JWT 토큰 발급
    const secret = new TextEncoder().encode(Deno.env.get('SUPABASE_JWT_SECRET')!);
    const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);

    const firstMatch = residents[0];
    const token = await create(
      { alg: 'HS256', typ: 'JWT' },
      {
        resident_id: firstMatch.id,
        unit_id: firstMatch.unit_id,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30일
      },
      key
    );

    // 로그인 시간 업데이트
    await supabase.from('residents').update({ last_login_at: new Date().toISOString() }).eq('id', firstMatch.id);

    return new Response(
      JSON.stringify({
        token,
        resident: firstMatch,
        matches: residents, // 복수 빌라 매칭 시 선택용
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
