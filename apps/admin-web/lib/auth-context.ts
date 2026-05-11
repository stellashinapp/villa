/**
 * 본사 콘솔 접근자 식별 + 권한 판정.
 *
 * 정식 인증 도입 전 단순화 — cookie 'villatolk_viewer_email' 에 저장된 이메일을 신뢰.
 * /login 페이지가 Supabase 자격증명으로 검증 후 cookie 설정.
 *
 * 슈퍼관리자 판정: SUPER_ADMIN_EMAILS env (쉼표 구분) 에 포함된 이메일.
 * 슈퍼만 ?reveal=1 으로 PII 풀 노출 가능. 외엔 항상 마스킹.
 */
import { cookies } from 'next/headers';

const VIEWER_COOKIE = 'villatolk_viewer_email';

export async function getViewerEmail(): Promise<string | null> {
  const c = await cookies();
  return c.get(VIEWER_COOKIE)?.value ?? null;
}

export function isSuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.SUPER_ADMIN_EMAILS ?? '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

/** ?reveal=1 + 슈퍼관리자 인 경우만 PII 마스킹 해제 */
export function canRevealPII(email: string | null | undefined, revealParam: string | string[] | undefined): boolean {
  const reveal = revealParam === '1' || revealParam === 'true';
  return reveal && isSuperAdmin(email);
}

export const VIEWER_COOKIE_NAME = VIEWER_COOKIE;
