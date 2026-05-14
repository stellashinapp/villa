// 입주 신청 승인 / 거부 — 관리자가 PWA·모바일에서 호출
// - 인증된 관리자 JWT 필수
// - 해당 입주민이 신청한 unit 이 관리자의 빌라에 속해야 함 (소유권 검증)
// - status='pending' → 'active' (승인) 또는 'rejected' (거부)
// - 승인 시 approved_at, approved_by 채움
// - 거부 시 reject_reason 채움
// - 입주민 푸시 알림 (best effort)
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

    const { residentId, action, rejectReason } = await req.json();
    if (!residentId || !['approve', 'reject'].includes(action)) {
      return ok({ error: { code: 'VALIDATION', message: 'residentId 와 action(approve/reject) 필수' } }, 400);
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;

    // 사용자 JWT 검증
    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return ok({ error: { code: 'INVALID_SESSION', message: '세션 검증 실패' } }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // 관리자 row 확인
    const { data: adminRow } = await admin.from('admins').select('id').eq('auth_id', userData.user.id).maybeSingle();
    if (!adminRow) return ok({ error: { code: 'NOT_ADMIN', message: '관리자가 아닙니다' } }, 403);

    // 해당 입주민의 unit → villa → admin 소유권 검증
    const { data: applicant } = await admin
      .from('residents')
      .select('id, name, phone, status, unit_id, units!inner(ho_number, villa_id, villas!inner(admin_id, name))')
      .eq('id', residentId)
      .maybeSingle();
    if (!applicant) return ok({ error: { code: 'NOT_FOUND', message: '신청을 찾을 수 없습니다' } }, 404);
    if (applicant.status !== 'pending') return ok({ error: { code: 'INVALID_STATE', message: `현재 상태 ${applicant.status} — 처리 불가` } }, 409);

    // applicant.units 가 array 일 수도 있어 안전 추출
    const units = Array.isArray(applicant.units) ? applicant.units[0] : applicant.units;
    const villas = Array.isArray(units?.villas) ? units.villas[0] : units?.villas;
    if (!villas || villas.admin_id !== adminRow.id) {
      return ok({ error: { code: 'FORBIDDEN', message: '해당 빌라의 관리자가 아닙니다' } }, 403);
    }

    // 상태 업데이트
    const now = new Date().toISOString();
    let updated;
    if (action === 'approve') {
      const { data, error: updErr } = await admin
        .from('residents')
        .update({ status: 'active', approved_at: now, approved_by: adminRow.id })
        .eq('id', residentId)
        .select('id, name, phone, status')
        .single();
      if (updErr) return ok({ error: { code: 'UPDATE_FAIL', message: updErr.message } }, 500);
      updated = data;
    } else {
      const { data, error: updErr } = await admin
        .from('residents')
        .update({ status: 'rejected', approved_at: now, approved_by: adminRow.id, reject_reason: rejectReason ?? null })
        .eq('id', residentId)
        .select('id, name, phone, status')
        .single();
      if (updErr) return ok({ error: { code: 'UPDATE_FAIL', message: updErr.message } }, 500);
      updated = data;
    }

    // 입주민 푸시 — best effort
    try {
      const url = `${SUPABASE_URL}/functions/v1/push-notify`;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SERVICE_ROLE}` },
        body: JSON.stringify({
          type: 'message_to_resident',
          residentId: updated.id,
          title: action === 'approve' ? '입주 신청 승인' : '입주 신청 거부',
          body: action === 'approve'
            ? `${villas.name} 입주 신청이 승인되었습니다. 로그인 후 이용해 주세요.`
            : `입주 신청이 거부되었습니다. ${rejectReason ?? ''}`.trim(),
          data: { villaName: villas.name, kind: 'application_result', action },
        }),
      });
    } catch (e) { console.warn('[approve] push failed:', e); }

    return ok({ ok: true, resident: updated });
  } catch (err) {
    return ok({ error: { code: 'INTERNAL', message: String(err) } }, 500);
  }
});
