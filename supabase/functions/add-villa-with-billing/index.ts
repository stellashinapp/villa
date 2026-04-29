// 빌라 추가 + subscription_item 자동 생성
// 세대 수 기반 플랜 자동 선택 (small/popular/large)
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function planFor(unitsCount: number): { plan: 'small' | 'popular' | 'large'; price: number } {
  if (unitsCount <= 10) return { plan: 'small', price: 30000 };
  if (unitsCount <= 30) return { plan: 'popular', price: 50000 };
  return { plan: 'large', price: 70000 };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { admin_id, villa, units_count = 0, create_units = true } = await req.json();

    if (!admin_id || !villa?.name || !villa?.address) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: villaRow, error: villaErr } = await supabase
      .from('villas')
      .insert({
        admin_id,
        name: villa.name,
        address: villa.address,
        total_units: units_count,
        units_per_floor: villa.units_per_floor ?? 2,
        account_bank: villa.account_bank ?? null,
        account_number: villa.account_number ?? null,
        account_holder: villa.account_holder ?? null,
      })
      .select()
      .single();

    if (villaErr || !villaRow) {
      return new Response(JSON.stringify({ error: villaErr?.message ?? 'Villa insert failed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (create_units && units_count > 0) {
      const perFloor = villa.units_per_floor ?? 2;
      const unitRows: Array<{ villa_id: string; ho_number: string; floor: number }> = [];
      for (let i = 1; i <= units_count; i++) {
        const floor = Math.ceil(i / perFloor);
        const idx = ((i - 1) % perFloor) + 1;
        unitRows.push({
          villa_id: villaRow.id,
          ho_number: `${floor}0${idx}`,
          floor,
        });
      }
      await supabase.from('units').insert(unitRows);
    }

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('admin_id', admin_id)
      .in('status', ['trialing', 'active', 'past_due', 'pending_cancel'])
      .maybeSingle();

    const { plan, price } = planFor(units_count);

    if (sub) {
      await supabase.from('subscription_items').insert({
        subscription_id: sub.id,
        villa_id: villaRow.id,
        plan,
        price,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      villa: villaRow,
      plan,
      price,
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
