/**
 * 본사 콘솔 접근 로그 기록.
 * 개인정보보호법 제29조 (안전성 확보조치) 의 접근기록 보관 의무 (1년 이상).
 *
 * admin-web 의 PII 노출 페이지(/residents, /admins 등) 진입 시 호출.
 * service_role 클라이언트 사용하므로 RLS 우회 INSERT.
 */
import { headers } from 'next/headers';
import { createServerClient } from './supabase-server';

export async function logAdminAccess(opts: {
  path: string;
  viewerEmail: string | null;
  viewerAdminId?: string | null;
  payload?: Record<string, unknown>;
}) {
  try {
    const hdrs = await headers();
    const xff = hdrs.get('x-forwarded-for');
    const ip = xff ? xff.split(',')[0].trim() : (hdrs.get('x-real-ip') ?? null);
    const userAgent = hdrs.get('user-agent') ?? null;

    const supabase = createServerClient();
    await supabase.from('admin_access_logs').insert({
      viewer_email: opts.viewerEmail,
      viewer_admin_id: opts.viewerAdminId ?? null,
      path: opts.path,
      ip,
      user_agent: userAgent,
      payload: opts.payload ?? null,
    });
  } catch (e) {
    // 로깅 실패는 페이지 렌더링을 막지 않음 — 운영 로그에만 남김
    console.error('[admin-access-log] insert failed:', e);
  }
}
