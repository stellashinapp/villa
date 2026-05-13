import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { isSuperAdminAsync } from '@/lib/auth-context';
import { logAdminAccess } from '@/lib/access-log';
import { createServerClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const VIEWER_COOKIE = 'villatolk_viewer_email';

async function recordLoginLog(authId: string, email: string) {
  try {
    const hdrs = await headers();
    const xff = hdrs.get('x-forwarded-for');
    const ip = xff ? xff.split(',')[0].trim() : (hdrs.get('x-real-ip') ?? null);
    const userAgent = hdrs.get('user-agent') ?? null;

    const supabase = createServerClient();
    const { data: admin } = await supabase
      .from('admins')
      .select('id, name, phone')
      .eq('auth_id', authId)
      .maybeSingle();

    await supabase.from('login_logs').insert({
      user_type: 'admin',
      user_id: admin?.id ?? null,
      user_name: admin?.name ?? email,
      user_phone: admin?.phone ?? null,
      ip_address: ip,
      device_info: userAgent ? `admin-web · ${userAgent.slice(0, 200)}` : 'admin-web',
    });
  } catch (e) {
    console.error('[login_logs] insert failed:', e);
  }
}

export async function POST(req: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청' }, { status: 400 });
  }

  const email = (body.email ?? '').trim().toLowerCase();
  const password = body.password ?? '';
  if (!email || !password) {
    return NextResponse.json({ error: '이메일·비밀번호를 입력해 주세요' }, { status: 400 });
  }

  if (!(await isSuperAdminAsync(email))) {
    return NextResponse.json(
      { error: '본사 콘솔 접근 권한이 없는 계정입니다' },
      { status: 403 },
    );
  }

  // anon 키로 Supabase 로그인 검증. 세션을 서버에 저장하진 않고 검증 후 폐기.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    return NextResponse.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다' }, { status: 401 });
  }

  await Promise.all([
    logAdminAccess({
      path: '/api/auth/login',
      viewerEmail: email,
      payload: { event: 'login_success' },
    }),
    recordLoginLog(data.user.id, email),
  ]);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(VIEWER_COOKIE, email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8시간
  });
  return res;
}
