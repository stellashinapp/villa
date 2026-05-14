// 관리자 이주 확정 — pending_moveout → moved_out
// - 관리자 JWT 필수
// - 해당 입주민이 관리자 빌라 소속 검증
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
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) return ok({ error: { code: 'AUTH_REQUIRED', message: '인증 필요' } }, 401);

    const { residentId } = await req.json();
    if (!residentId) return ok({ error: { code: 'VALIDATION', message: 'residentId 필수' } }, 400);

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;

    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return ok({ error: { code: 'INVALID_SESSION', message: '세션 검증 실패' } }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: adminRow } = await admin.from('admins').select('id').eq('auth_id', userData.user.id).maybeSingle();
    if (!adminRow) return ok({ error: { code: 'NOT_ADMIN', message: '관리자가 아닙니다' } }, 403);

    const { data: resident } = await admin
      .from('residents')
      .select('id, name, status, unit_id, units!inner(villa_id, villas!inner(admin_id, name))')
      .eq('id', residentId)
      .maybeSingle();
    if (!resident) return ok({ error: { code: 'NOT_FOUND', message: '입주민 없음' } }, 404);
    if (resident.status !== 'pending_moveout' && resident.status !== 'active') {
      return ok({ error: { code: 'INVALID_STATE', message: `상태 ${resident.status} — 처리 불가` } }, 409);
    }

    const units = Array.isArray(resident.units) ? resident.units[0] : resident.units;
    const villas = Array.isArray(units?.villas) ? units.villas[0] : units?.villas;
    if (!villas || villas.admin_id !== adminRow.id) {
      return ok({ error: { code: 'FORBIDDEN', message: '권한 없음' } }, 403);
    }

    const today = new Date().toISOString().slice(0, 10);
    const { error: updErr } = await admin
      .from('residents')
      .update({ status: 'moved_out', move_out_date: today })
      .eq('id', residentId);
    if (updErr) return ok({ error: { code: 'UPDATE_FAIL', message: updErr.message } }, 500);

    // 입주민 푸시 알림
    try {
      const url = `${SUPABASE_URL}/functions/v1/push-notify`;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SERVICE_ROLE}` },
        body: JSON.stringify({
          type: 'message_to_resident',
          residentId: resident.id,
          title: '이주 처리 완료',
          body: `${villas.name} 이주 처리가 완료되었습니다. 그동안 감사했습니다.`,
          data: { villaName: villas.name, kind: 'moveout_confirmed' },
        }),
      });
    } catch (e) { console.warn('[confirm-moveout] push failed:', e); }

    return ok({ ok: true, residentId, status: 'moved_out', moveOutDate: today });
  } catch (err) {
    return ok({ error: { code: 'INTERNAL', message: String(err) } }, 500);
  }
});
