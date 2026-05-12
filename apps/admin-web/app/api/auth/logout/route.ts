import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logAdminAccess } from '@/lib/access-log';

const VIEWER_COOKIE = 'villatolk_viewer_email';

export const dynamic = 'force-dynamic';

export async function POST() {
  const c = await cookies();
  const viewer = c.get(VIEWER_COOKIE)?.value ?? null;

  await logAdminAccess({
    path: '/api/auth/logout',
    viewerEmail: viewer,
    payload: { event: 'logout' },
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(VIEWER_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
