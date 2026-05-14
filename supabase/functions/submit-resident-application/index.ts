// 입주민 자가 신청 — PWA / 모바일에서 호출
// 1. 빌라명으로 villas 검색 (service_role, RLS 우회)
// 2. units 매칭 — 없으면 admin 만 만들 수 있으므로 신청자 통과: existing unit 만 허용
// 3. 기존 active resident 있으면 중복 신청 차단 (같은 unit 에 다른 이름)
// 4. residents INSERT with status='pending', applied_at=now()
// 5. (옵션) 관리자에게 push-notify 호출
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function ok(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const { villaName, ho, name, phone } = await req.json();

    if (!villaName?.trim() || !ho?.toString().trim() || !name?.trim() || !phone?.trim()) {
      return ok({ error: { code: 'VALIDATION', message: '빌라명·호실·이름·전화번호를 모두 입력해 주세요' } }, 400);
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const normalizedPhone = phone.replace(/\D/g, '');
    const normalizedHo = String(ho).trim().replace(/호$/, '');

    // 1) 빌라 검색 — 정확 매칭 우선, 그 다음 부분 매칭
    const { data: exactVillas } = await supabase
      .from('villas').select('id, name, address, admin_id').eq('name', villaName.trim()).eq('status', 'active');

    let villas = exactVillas ?? [];
    if (villas.length === 0) {
      const { data: partial } = await supabase
        .from('villas').select('id, name, address, admin_id').ilike('name', `%${villaName.trim()}%`).eq('status', 'active').limit(10);
      villas = partial ?? [];
    }

    if (villas.length === 0) {
      return ok({ error: { code: 'VILLA_NOT_FOUND', message: '해당 빌라가 등록되어 있지 않습니다. 관리자에게 빌라 등록 후 다시 시도해주세요.' } }, 404);
    }
    if (villas.length > 1) {
      return ok({ error: { code: 'MULTIPLE_VILLA', message: '동일한 이름의 빌라가 여러 개입니다. 정확한 빌라명을 알려주세요.', candidates: villas.map(v => ({ id: v.id, name: v.name, address: v.address })) } }, 409);
    }

    const villa = villas[0];

    // 2) 호실 매칭
    const { data: unit } = await supabase
      .from('units').select('id, ho_number').eq('villa_id', villa.id).eq('ho_number', normalizedHo).maybeSingle();
    if (!unit) {
      return ok({ error: { code: 'UNIT_NOT_FOUND', message: `${normalizedHo}호가 등록되어 있지 않습니다. 관리자에게 호실 등록을 요청해주세요.` } }, 404);
    }

    // 3) 중복 신청 차단 — 같은 unit·phone 동일 신청은 1건만
    const { data: existing } = await supabase
      .from('residents').select('id, name, status')
      .eq('unit_id', unit.id).eq('phone', normalizedPhone)
      .in('status', ['pending', 'active']);
    if (existing && existing.length > 0) {
      const e = existing[0];
      const msg = e.status === 'active'
        ? '이미 등록된 입주민입니다. 로그인 화면에서 진행해주세요.'
        : '이미 신청을 보냈습니다. 관리자 승인을 기다려주세요.';
      return ok({ error: { code: 'DUPLICATE', message: msg } }, 409);
    }

    // 4) 같은 unit 의 active 거주자가 있으면 — 입주민 명단에는 들어갈 수 있음 (가족 등). 그러나 동일 이름이면 차단.
    const { data: sameNameSameUnit } = await supabase
      .from('residents').select('id').eq('unit_id', unit.id).eq('name', name.trim()).eq('status', 'active');
    if (sameNameSameUnit && sameNameSameUnit.length > 0) {
      return ok({ error: { code: 'SAME_NAME_UNIT', message: '같은 이름의 입주민이 이미 등록되어 있습니다.' } }, 409);
    }

    // 5) residents INSERT with status='pending'
    const { data: applicant, error: insErr } = await supabase
      .from('residents').insert({
        unit_id: unit.id,
        name: name.trim(),
        phone: normalizedPhone,
        status: 'pending',
        applied_at: new Date().toISOString(),
      }).select('id, name, phone, applied_at').single();

    if (insErr) return ok({ error: { code: 'INSERT_FAIL', message: insErr.message } }, 500);

    // 6) 관리자 푸시 — best effort
    try {
      const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/push-notify`;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
        body: JSON.stringify({
          type: 'message_to_admin',
          villaId: villa.id,
          adminId: villa.admin_id,
          title: '입주 신청 1건',
          body: `${villa.name} ${normalizedHo}호 ${name.trim()}님이 입주 신청을 보냈습니다.`,
          data: { residentId: applicant.id, villaId: villa.id, kind: 'resident_application' },
        }),
      });
    } catch (e) { console.warn('[submit-resident-application] push failed:', e); }

    return ok({
      ok: true,
      application: { id: applicant.id, status: 'pending', villaName: villa.name, ho: normalizedHo, name: applicant.name, appliedAt: applicant.applied_at },
    });
  } catch (err) {
    return ok({ error: { code: 'INTERNAL', message: String(err) } }, 500);
  }
});
