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
import { createServerClient } from './supabase-server';

const VIEWER_COOKIE = 'villatolk_viewer_email';

export async function getViewerEmail(): Promise<string | null> {
  const c = await cookies();
  return c.get(VIEWER_COOKIE)?.value ?? null;
}

/**
 * 동기 판정 — SUPER_ADMIN_EMAILS env 화이트리스트만 검사.
 * DB 호출 없이 빠르게 확인할 때 사용 (RevealToggle 등).
 */
export function isSuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.SUPER_ADMIN_EMAILS ?? '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

/**
 * 비동기 판정 — env 화이트리스트 ∪ admins.role='super' DB 조회.
 * 로그인 게이트 등 정확한 판정이 필요한 곳에서 사용. SUPER_ADMIN_EMAILS env 없어도 작동.
 */
export async function isSuperAdminAsync(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  if (isSuperAdmin(email)) return true;
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from('admins')
      .select('role')
      .eq('email', email.toLowerCase())
      .maybeSingle();
    return data?.role === 'super';
  } catch {
    return false;
  }
}

/** ?reveal=1 + 슈퍼관리자 인 경우만 PII 마스킹 해제 */
export function canRevealPII(email: string | null | undefined, revealParam: string | string[] | undefined): boolean {
  const reveal = revealParam === '1' || revealParam === 'true';
  return reveal && isSuperAdmin(email);
}

export const VIEWER_COOKIE_NAME = VIEWER_COOKIE;
