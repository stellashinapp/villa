// 빌라 추가 + subscription_item 동시 생성
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const { admin_id, villa, units_count } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // TODO:
    // 1. villas 테이블에 새 빌라 INSERT
    // 2. units 테이블에 세대 자동 생성 (units_per_floor 기반)
    // 3. subscriptions에서 해당 관리자의 active 구독 조회
    // 4. subscription_items에 새 빌라 항목 INSERT (planFor(units_count))
    // 5. 볼륨 할인 재계산

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
