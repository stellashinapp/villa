// 입주민 이주 신청 — PWA·모바일에서 호출
// - 입주민 본인 식별을 위해 phone + name + residentId (resident-login 응답의 id) 검증
// - 또는 phone + name 으로 active resident 매칭 후 status='pending_moveout' 변경
// - 관리자에게 푸시 알림
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const ok = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const { residentId, name, phone, moveOutDate, reason } = await req.json();
    if (!residentId || !name?.trim() || !phone?.trim()) {
      return ok({ error: { code: 'VALIDATION', message: 'residentId, name, phone 필수' } }, 400);
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const normalizedPhone = phone.replace(/\D/g, '');

    // 본인 검증: id + name + phone 모두 일치 + status='active'
    const { data: resident } = await supabase
      .from('residents')
      .select('id, name, phone, status, unit_id, units!inner(ho_number, villa_id, villas!inner(admin_id, name))')
      .eq('id', residentId)
      .eq('name', name.trim())
      .eq('phone', normalizedPhone)
      .maybeSingle();

    if (!resident) return ok({ error: { code: 'NOT_FOUND', message: '입주민 정보가 일치하지 않습니다' } }, 404);
    if (resident.status !== 'active') return ok({ error: { code: 'INVALID_STATE', message: `현재 상태 ${resident.status} — 이주 신청 불가` } }, 409);

    const units = Array.isArray(resident.units) ? resident.units[0] : resident.units;
    const villas = Array.isArray(units?.villas) ? units.villas[0] : units?.villas;

    // 상태 변경
    const { error: updErr } = await supabase
      .from('residents')
      .update({ status: 'pending_moveout', move_out_date: moveOutDate ?? null })
      .eq('id', residentId);
    if (updErr) return ok({ error: { code: 'UPDATE_FAIL', message: updErr.message } }, 500);

    // 관리자 푸시
    try {
      const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/push-notify`;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
        body: JSON.stringify({
          type: 'message_to_admin',
          villaId: units?.villa_id,
          adminId: villas?.admin_id,
          title: '이주 신청 1건',
          body: `${villas?.name ?? ''} ${units?.ho_number ?? ''}호 ${resident.name}님이 이주 신청을 보냈습니다.${moveOutDate ? ` 예정일 ${moveOutDate}` : ''}${reason ? ` · ${reason}` : ''}`,
          data: { residentId: resident.id, villaId: units?.villa_id, kind: 'moveout_application' },
        }),
      });
    } catch (e) { console.warn('[submit-moveout] push failed:', e); }

    return ok({ ok: true, residentId: resident.id, status: 'pending_moveout' });
  } catch (err) {
    return ok({ error: { code: 'INTERNAL', message: String(err) } }, 500);
  }
});
