// 빌라 관리자 변경 (이전)
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const { villa_id, from_admin_id, to_admin_id, reason } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // TODO: 트랜잭션으로 처리
    // 1. villas.admin_id 업데이트
    // 2. villa_transfers 기록
    // 3. subscription_items에서 이전 관리자 항목 제거
    // 4. 새 관리자 subscription_items에 추가

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
