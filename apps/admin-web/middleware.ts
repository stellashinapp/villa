import { NextRequest, NextResponse } from 'next/server';

/**
 * 본사 콘솔 진입 게이트.
 *
 * 인증되지 않은 모든 요청은 /login 으로 리다이렉트.
 * SUPER_ADMIN_EMAILS env 에 등록된 이메일만 진입 허용 (/api/auth/login 에서 검증).
 *
 * 공개 경로:
 *   - /login (로그인 페이지)
 *   - /api/auth/* (로그인·로그아웃 엔드포인트)
 *   - /api/keep-alive (Vercel cron — Supabase 슬립 방지)
 *   - /api/danal/* (모바일·관리자 앱에서 호출하는 본인인증 콜백)
 *   - /legal/* (약관·처리방침 공개 페이지)
 *   - 정적 자산 (matcher 에서 제외)
 */

const VIEWER_COOKIE = 'villatolk_viewer_email';

const PUBLIC_PATHS = [
  '/login',
  '/api/auth',
  '/api/keep-alive',
  '/api/danal',
  '/legal',
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(`${p}/`));
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // layout 에서 chrome 분기용. 모든 요청에 x-pathname 헤더 동봉.
  function withPathHeader(res: NextResponse) {
    res.headers.set('x-pathname', pathname);
    return res;
  }

  if (isPublic(pathname)) return withPathHeader(NextResponse.next());

  const viewer = req.cookies.get(VIEWER_COOKIE)?.value;
  if (viewer) return withPathHeader(NextResponse.next());

  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('next', pathname + (search || ''));
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // _next, 정적 자산, favicon 제외
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js|map)).*)',
  ],
};
